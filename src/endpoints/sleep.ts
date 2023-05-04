import { generateResponseGPT4 } from "../openai";
import { createResponse, formConnection, getRecentFables } from "../utils";
import { prisma } from "../..";

export default async function sleep(req: Request): Promise<Response> {

  if (req.method === "POST") {
    try {
      return await processSleep(req);
    } catch (e) {
      return createResponse(`Error sleeping: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}

async function processSleep(req: Request): Promise<Response> {

  const fables = await prisma.fable.findMany();
  
  // Create connections between fables
  let count = 0;
  for(const fable_1 of fables) {
    for(const fable_2 of fables) {
      const success = await formConnection(fable_1, fable_2);
      if(success) { count++; }
    }
  }


  return createResponse(`Slept`, 200, { new_connections: count });
}
