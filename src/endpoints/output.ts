import { searchMemory } from "../memory";
import { createResponse, getBrainFromAuth } from "../utils";


export default async function output(req: Request): Promise<Response> {
  const brain = await getBrainFromAuth(req);
  if(!brain){
    return createResponse(`Please provide a valid auth token`, 401);
  }

  if (req.method === "GET") {
    try {
      return await getOutput(req, brain);
    } catch (e) {
      console.error(`Error getting output: ${e}`);
      return createResponse(`Error getting output: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}


async function getOutput(req: Request, brain: Brain): Promise<Response> {
  if(!brain.latest_fable_id){
    return createResponse(`Please create a fable first`, 400);
  }

  const result = await searchMemory(brain);


  return createResponse(`TODO`, 200, result);
  
}
