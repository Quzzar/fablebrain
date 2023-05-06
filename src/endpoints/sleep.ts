import { generateResponseGPT4 } from "../openai";
import { supabase } from "../supabase";
import { createResponse, formConnection, getRecentFables } from "../utils";

export default async function sleep(req: Request): Promise<Response> {

  if (req.method === "POST") {
    try {
      return await processSleep(req);
    } catch (e) {
      console.error(`Error sleeping: ${e}`);
      return createResponse(`Error sleeping: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}

async function processSleep(req: Request): Promise<Response> {

  const { data: fables, error } = await supabase.from('fable').select('*');

  if(!fables || error){
    return createResponse(`Error fetching fables`, 500);
  }

  const { count } = await supabase
    .from('fable_connection')
    .select('*', { count: 'exact', head: true });
  
  // Create connections between fables
  let c_count = 0;
  for(const fable_1 of fables) {
    for(const fable_2 of fables) {
      const success = await formConnection(fable_1 as Fable, fable_2 as Fable);
      if(success) { c_count++; }
    }
  }

  const predicted_total_connections = (((fables.length * fables.length) - fables.length) / 2);

  return createResponse(`Slept`, 200, {
    explanation: `${count} + ${c_count} = ${predicted_total_connections}(?)`,
    new_connections: c_count,
    predicted_total_connections,
    total_connections: (count ?? 0)+c_count,
  });
}
