import { supabase } from "../services/supabase";
import { generateResponseGPT4 } from "../services/openai";
import { createResponse, formConnection, getBrainFromAuth, getRecentFables } from "../utils";

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

  // Summarize info
  const result = await generateResponseGPT4(
    `
    Please give me a 200 character summary of the following:

    ${info.trim()}
    `
  );

  if (!result){
    return createResponse(`Failed to process feed, please try again later`, 500);
  }
  
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
      Your job is to come up with the overarching conclusion from a series of recent events. These events occurred as a result of following a prescribed goal. The following is a list of events and their corresponding goal that caused them to occur. Please respond with a lesson learned from everything that occurred. Include the names of specific issues that occurred if applicable.
    
      --
      ${events}
    
      Lesson learned: 
      `
    );
  }

  // Create fable
  const { data, error } = await supabase.from("fable").insert({
    brain_id: brain.id,
    summary: result,
    goal,
    conclusion,
  }).select();

  
  let c_count = 0;
  if(data){
    // Update brain
    await supabase.from("brain").update({
      latest_fable_id: data[0].id,
    }).eq('id', brain.id);


    // Form connections with recent fables and with recently recalled (both connected fables)
    for(const fable of recentFables) {
      const success = await formConnection(data[0] as Fable, fable as Fable);
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
          .eq('id', recentConnection.fable_id_1);
        if(fable_1){
          const success = await formConnection(data[0] as Fable, fable_1[0] as Fable);
          if(success) { c_count++; }
        }

        // Form connection with recently connection pt.2
        const { data: fable_2 } = await supabase
          .from('fable')
          .select('*')
          .eq('id', recentConnection.fable_id_2);
        if(fable_2){
          const success = await formConnection(data[0] as Fable, fable_2[0] as Fable);
          if(success) { c_count++; }
        }

      }
    }

  }

  return createResponse(`Submitted feed`, 200, {
    new_connections: c_count,
  });
}
