import { supabase } from "./services/supabase";
import { generateResponseChatGPT, generateResponseGPT4 } from "./services/openai";


export function convertDateToSupabaseFormat(date: Date){
  return date.toISOString().replace('T', ' ').replace('Z', '+00');
}


export async function getBrainFromAuth(req: Request): Promise<Brain | null> {
  const authorization = req.headers.get('Authorization');
  if(!authorization){
    return null;
  }

  const match = authorization.match(/Bearer (.+)/);
  if(match && match[1]){
    const authToken = match[1];

    const { data } = await supabase
      .from('brain')
      .select('*')
      .eq('auth_token', authToken)
      .single();
    return data ? data as Brain : null;
  }
  return null;
}


export function getUniqueNumber(x: number, y: number){
  return ((x + y) * (x + y + 1)) / 2 + Math.min(x,y);
}


export function createResponse(
  message: string,
  status: number,
  data?: any
): Response {
  // Endpoints follow the JSend specification
  return new Response(
    JSON.stringify({
      status: (`${status}`.startsWith('1') || `${status}`.startsWith('2')) ? 'success' : (`${status}`.startsWith('5') ? 'error' : 'fail'),
      message,
      data,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}


export async function formConnection(fable_1: Fable, fable_2: Fable) {
  if (fable_1.id === fable_2.id) {
    return false;
  }

  const id_pair = getUniqueNumber(fable_1.id, fable_2.id);

  const { data: existingConnection } = await supabase
    .from('fable_connection')
    .select('*')
    .eq('id_pair', id_pair);
  if(!existingConnection || existingConnection.length > 0){
    return false;
  }

  // Determine connection strength
  const result = await generateResponseGPT4(
    `
    Please respond with only a number between 0 and 100 for how similar the two following inputs are to each other. Where a 0 is that they're not even remotely similar and a 100 is that they're the exact same input.

    ## Input 1
    ${fable_1.input.trim()}

    ## Input 2
    ${fable_2.input.trim()}
    `
  );
  if(!result) { return false; }

  const match = result.match(/\d+/);
  if (match && match[0]) {
    const { error: createError } = await supabase
      .from("fable_connection")
      .insert({
          id_pair,
          fable_id_1: fable_1.id,
          fable_id_2: fable_2.id,
          strength: +match[0],
        },
      );

    if (createError) {
      return false;
    }

    return true;
  } else {
    return false;
  }
}
