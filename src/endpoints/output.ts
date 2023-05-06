import { getRecentFables, searchMemory } from "../memory";
import { generateResponseGPT4 } from "../services/openai";
import { supabase } from "../services/supabase";
import { createResponse, getBrainFromAuth } from "../utils";
import FuzzySet from 'fuzzyset';

export default async function output(req: Request): Promise<Response> {
  const brain = await getBrainFromAuth(req);
  if (!brain) {
    return createResponse(`Please provide a valid auth token`, 401);
  }

  if (req.method === "GET") {
    try {
      return await getOutput(req, brain);
    } catch (e) {
      return createResponse(`Error getting output: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}

const DEFAULT_SEARCH_BACK_MINUTES = 10;

async function getOutput(req: Request, brain: Brain): Promise<Response> {

  // Get search_back_minutes from query param, TODO: move to middleware
  let search_back_minutes;
  try {
    const url = new URL(req.url);
    search_back_minutes = parseInt(url.searchParams.get("search_back_minutes") ?? `${DEFAULT_SEARCH_BACK_MINUTES}`);
    if (isNaN(search_back_minutes) || search_back_minutes <= 0) {
      search_back_minutes = DEFAULT_SEARCH_BACK_MINUTES;
    }
  } catch (e) {
    search_back_minutes = DEFAULT_SEARCH_BACK_MINUTES;
  }

  // Get all action options
  const { data: actions } = await supabase
    .from("action")
    .select("*")
    .eq("brain_id", brain.id) as { data: Action[] | null };
  if (!actions || actions.length === 0) {
    return createResponse(
      `No actions found for brain. Please create an action first.`,
      400
    );
  }

  // Get all recent fables (to get most recent input)
  const recentFables = await getRecentFables(brain, search_back_minutes);
  if (recentFables.length === 0) {
    return createResponse(
      `No recent input found to reference. Please provide a new input or increase the 'search_back_minutes'`,
      400
    );
  }
  const latestFable = recentFables[0];

  // If we already have an action determined, return it instead
  if (latestFable.resulting_action_id) {
    const nextAction = actions.find((action) => action.id === latestFable.resulting_action_id);
    if (nextAction) {
      return createResponse(`Determined next action`, 200, {
        action: nextAction.name,
        _meta: {
          source: "cached",
        }
      });
    } else {
      return createResponse(`Previous determined action seems to be corrupt. Please provide a new input.`, 500);
    }
  }

  const connections = await searchMemory(latestFable);

  const similarFables: FableAction[] = [];
  for (let connection of connections) {
    const fable_id =
      latestFable.id === connection.fable_id_1
        ? connection.fable_id_2
        : connection.fable_id_1;
    const { data: fable } = await supabase
      .from("fable")
      .select(`
        *,
        action (
          *
        )
      `)
      .eq("id", fable_id)
      .single();
    if (fable && fable.action && fable.conclusion) {
      similarFables.push(fable as FableAction);
    }
  }

  // Generate resulting next action
  const actionResult = await generateResponseGPT4(
    `
    Your job is to determine the best action to select given a current input and goal. To help you make your decision, you will also be provided with a list of previous similar inputs, their selected actions, and the corresponding result of those actions. Select an action only from the provided list. Respond with only the name of the action you select. If you're unsure, select an action from the list at random.

    ## Current Input

    Current Input: ${latestFable.input.trim()}
    Current Goal: ${latestFable.goal.trim()}

    ## Previous Similar Inputs
    ${similarFables.map((fableAction) => {
      return `
      Input: ${fableAction.input.trim()}
      Action Name: ${fableAction.action.name.trim()}
      Action Description: ${fableAction.action.description.trim()}
      Result: "${fableAction.conclusion.trim()}"  
      `;
    }).join('')}
    ## List of Actions
    ${actions.map((action) => {
      return `
      name: ${action.name.trim()}
      description: ${action.description.trim()}
      `;
    }).join('')}
    ## Action Name:
    `
  );
  if (!actionResult) {
    return createResponse(`Failed to determine an action (1). Please try again.`, 500);
  }

  // Used to match next action result to our list of actions
  const fuzzy = FuzzySet();
  for (let action of actions) {
    fuzzy.add(action.name);
  }
  const fuzzyResults = fuzzy.get(actionResult);
  if (!fuzzyResults || fuzzyResults.length === 0 || fuzzyResults[0][0] < 0.75) {
    return createResponse(`Failed to determine an action (2). Please try again.`, 500);
  }

  // Find the action that matches the result
  const nextAction = actions.find((action) => action.name === fuzzyResults[0][1]);
  if (!nextAction) {
    return createResponse(`Failed to determine an action (3). Please try again.`, 500);
  }

  // Update fable
  await supabase
    .from("fable")
    .update({
      resulting_action_id: nextAction.id,
    })
    .eq("id", latestFable.id);

  return createResponse(`Determined next action`, 200, {
    action: nextAction.name,
    _meta: {
      source: "created",
    }
  });
}
