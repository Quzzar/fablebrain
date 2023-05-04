import { supabase } from "../supabase";
import { generateResponseGPT4 } from "../openai";
import { createResponse, getRecentFables } from "../utils";

export default async function feed(req: Request): Promise<Response> {
  // Submit feed
  if (req.method === "POST") {
    try {
      return await submitFeed(req);
    } catch (e) {
      return createResponse(`Error submitting feed: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}

async function submitFeed(req: Request): Promise<Response> {
  const body = await req.json<any>();

  const input = body.input;
  const goal = body.goal;

  if (!input || !goal) {
    return createResponse(`Please provide input and goal`, 400);
  }

  // Summarize input
  const result = await generateResponseGPT4(
    `
    Please give me a 200 character summary of the following:

    ${input.trim()}
    `
  );
  
  // Determine conclusion
  const recentFables = await getRecentFables();
  let conclusion = undefined;
  
  if (recentFables.length > 0) {
    let events = ``;
    for(const fable of recentFables) {
      events += `
      Goal: ${fable.goal.trim()}
      Event: ${fable.summary.trim()}
    
      --
      `
    }

    conclusion = await generateResponseGPT4(
      `
      Your job is to come up with the overarching conclusion from a series of recent events. These events occured as a result of following a prescribed goal. The following is a list of events and their corresponding goal that caused them to occur. Please respond with a lesson learned from everything that occurred. Include the names of specific issues that occured if applicable.
    
      --
      ${events}
    
      Lesson learned: 
      `
    );
  }

  // Create fable
  const { error } = await supabase.from("fable").insert({
    summary: result,
    goal: goal,
    conclusion,
  });

  return createResponse(`Submitted feed`, 200);
}
