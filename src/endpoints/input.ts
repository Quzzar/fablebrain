import { supabase } from "../services/supabase";
import { generateResponseGPT4 } from "../services/openai";
import { createResponse, formConnection, getBrainFromAuth } from "../utils";
import { getRecentFables } from "../memory";

export default async function input(req: Request): Promise<Response> {
  const brain = await getBrainFromAuth(req);
  if(!brain){
    return createResponse(`Please provide a valid auth token`, 401);
  }

  // Submit input
  if (req.method === "POST") {
    try {
      return await submitInput(req, brain);
    } catch (e) {
      return createResponse(`Error submitting input: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}

async function submitInput(req: Request, brain: Brain): Promise<Response> {
  const body = await req.json<any>();

  const info = body.info;
  const goal = body.goal;

  if (!info || !goal) {
    return createResponse(`Please provide info and goal`, 400);
  }
  
  // Determine conclusion for latest resulted fable
  const recentFables = await getRecentFables(brain);

  if(recentFables.length > 0){
    const latestResultedFable = recentFables.find(fable => fable.resulting_action_id !== null);
    if(latestResultedFable && !latestResultedFable.conclusion){

      const { data: latestResultedAction } = await supabase
        .from('action')
        .select('*')
        .eq('id', latestResultedFable.resulting_action_id)
        .single() as { data: Action | null };

      if(latestResultedAction){
        let conclusion = await generateResponseGPT4(
          `
          Please come up with a simple conclusion based on the following input and corresponding action. Include the name of the action attempted:

          Previous Input: ${latestResultedFable.input.trim()}
          Corresponding Attempted Action: ${latestResultedAction.name.trim()}
          Corresponding Attempted Action Description: ${latestResultedAction.description.trim()}


          New Input: ${info.trim()}
          `
        );
        if(conclusion){
          conclusion = conclusion.split(':').at(-1) ?? null;
          if(conclusion){
            // Update latest resulted fable
            await supabase
              .from('fable')
              .update({ conclusion })
              .eq('id', latestResultedFable.id);
          }
        }
      }

    }
  }

  // Create fable
  const { data: newFable } = await supabase.from("fable").insert({
    brain_id: brain.id,
    input: info,
    goal,
  }).select().single() as { data: Fable | null };;

  
  let c_count = 0;
  if(newFable){

    // Form connections with recent fables and with recently recalled (both connected fables)
    for(const fable of recentFables) {
      const success = await formConnection(newFable, fable);
      if(success) { c_count++; }
    }

    const { data: recentConnections } = await supabase
      .from('recently_recalled')
      .select('*')
      .eq('brain_id', brain.id);
    if(recentConnections){
      for(const recentConnection of recentConnections){

        // Form connection with recently connection pt.1
        const { data: fable_1 } = await supabase
          .from('fable')
          .select('*')
          .eq('id', recentConnection.fable_id_1)
          .single() as { data: Fable | null };;
        if(fable_1){
          const success = await formConnection(newFable, fable_1);
          if(success) { c_count++; }
        }

        // Form connection with recently connection pt.2
        const { data: fable_2 } = await supabase
          .from('fable')
          .select('*')
          .eq('id', recentConnection.fable_id_2)
          .single() as { data: Fable | null };
        if(fable_2){
          const success = await formConnection(newFable, fable_2);
          if(success) { c_count++; }
        }

      }
    }

  }

  return createResponse(`Submitted feed`, 200, {
    fable: newFable,
    new_connections: c_count,
  });
}




  /*
  const recentFables = await getRecentFables();
  let conclusion = undefined;
  
  if (recentFables.length > 0) {
    let events = ``;
    for(const fable of recentFables) {
      events += `
      Goal: ${fable.goal.trim()}
      Event: ${fable.input.trim()}
    
      --
      `
    }

    conclusion = await generateResponseGPT4(
      `
      Your job is to come up with the overarching conclusion from a series of recent events. These events occurred as a result of following a prescribed goal. The following is a list of events and their corresponding goal that caused them to occur. Please respond with a lesson learned from everything that occurred. Include the names of specific issues that occurred if applicable.
    
      --
      ${events}
    
      Lesson learned: 
      `
    );
  }
  */