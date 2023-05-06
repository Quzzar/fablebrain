import { forgetRecentMemories } from "../memory";
import { createResponse, getBrainFromAuth } from "../utils";


export default async function update(req: Request): Promise<Response> {
  const brain = await getBrainFromAuth(req);
  if(!brain){
    return createResponse(`Please provide a valid auth token`, 401);
  }

  if (req.method === "POST") {
    try {
      return await processUpdate(req, brain);
    } catch (e) {
      console.error(`Error updating: ${e}`);
      return createResponse(`Error updating: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}


async function processUpdate(req: Request, brain: Brain): Promise<Response> {

  
  await forgetRecentMemories(brain);


  return createResponse(`Testing`, 200);
  
}
