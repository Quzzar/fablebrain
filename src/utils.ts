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
      .eq('auth_token', authToken);
    return (data && data.length > 0) ? data[0] as Brain : null;
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
  const result = await generateResponseChatGPT(
    `
    Please respond with only a number between 0 and 100 for how similar the same general premise is on the following two sentences. Where a 0 is that they're not even remotely similar and a 100 is that they're referring to the exact same event.
      
    - ${fable_1.summary.trim()}
  
    - ${fable_2.summary.trim()}
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

const SEARCH_BACK_MINUTES = 10;

export async function getRecentFables() {
  const { data, error } = await supabase
    .from("fable")
    .select()
    .gte(
      "created_at",
      new Date(Date.now() - SEARCH_BACK_MINUTES * 60 * 1000).toISOString()
    );

  if (error || data.length === 0) {
    console.error(error);
    return [];
  }
  return data;
}

/*
const INACTIVITY_MINUTES = 3;
const MAX_FABLES = 50;
const MAX_SEARCHES = 10;

async function searchBack(i: number, fables: any[]): Promise<any[]> {

  console.log(i, fables.length)

  if (fables.length >= MAX_FABLES || i >= MAX_SEARCHES) {
    return fables;
  }

  const searchBackTime = new Date(Date.now() - (i * SEARCH_BACK_MINUTES * 60 * 1000));

  const { data, error } = await supabase
    .from("fable")
    .select()
    .gte("created_at", searchBackTime.toISOString());

  if (error || data.length === 0) {
    console.error(error);
    return fables;
  }

  searchBackTime.setMinutes(searchBackTime.getMinutes() - INACTIVITY_MINUTES);

  console.log(new Date(data[0].created_at).toISOString(), searchBackTime.toISOString());

  if(new Date(data[0].created_at) > searchBackTime){
    return searchBack(i + 1, data);
  }
  return data;
}
*/
