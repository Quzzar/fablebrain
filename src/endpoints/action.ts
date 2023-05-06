import { searchMemory } from "../memory";
import { supabase } from "../services/supabase";
import { createResponse, getBrainFromAuth } from "../utils";


export default async function action(req: Request): Promise<Response> {
  const brain = await getBrainFromAuth(req);
  if(!brain){
    return createResponse(`Please provide a valid auth token`, 401);
  }

  if (req.method === "POST") {
    try {
      return await createAction(req, brain);
    } catch (e) {
      console.error(`Error creating action: ${e}`);
      return createResponse(`Error creating action: ${e}`, 500);
    }
  }

  return createResponse(`Unknown method: ${req.method}`, 405);
}


async function createAction(req: Request, brain: Brain): Promise<Response> {

  const body = await req.json<any>();

  const name = body.name;
  const description = body.description;
  let args = body.args;

  if (!name || !description || !args) {
    return createResponse(`Please provide name, description, and args`, 400);
  }

  if(Array.isArray(args) && args.length > 0){
    for(let arg of args){
      if(!arg.name || !arg.description || !arg.type){
        return createResponse(`Please provide name, description, and type for all args`, 400);
      }
      if(arg.type === 'enum' && !arg.extra?.enum){
        return createResponse(`Please provide enum values for enum args`, 400);
      } else if (arg.type === 'enum') {
        // Format enum values
        arg.extra.enum = arg.extra.enum.map((e: string) => e.trim().toUpperCase().replace(/\s+/g, '_'));
        // Remove duplicates
        arg.extra.enum = Array.from(new Set(arg.extra.enum));
      }
      if(arg.type !== 'number' && arg.type !== 'string' && arg.type !== 'boolean' && arg.type !== 'enum'){
        return createResponse(`Invalid arg type: ${arg.type}`, 400);
      }
    }
  } else {
    args = [];
  }

  const { data, error } = await supabase
    .from('action')
    .insert({
      brain_id: brain.id,
      name,
      description,
      args: args.map((arg: Arg) => {
        return {
          name: arg.name,
          description: arg.description,
          type: arg.type,
          extra: arg.extra ? {
            number: arg.extra.number ? {
              min: arg.extra.number.min,
              max: arg.extra.number.max,
            } : undefined,
            enum: arg.extra.enum,
            string: arg.extra.string ? {
              min: arg.extra.string.min,
              max: arg.extra.string.max,
            } : undefined,
          } : undefined,
        }
      })
    })
    .select();

  return createResponse(`Created new action`, 200, data);
  
}
