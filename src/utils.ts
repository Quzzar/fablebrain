import { fable } from "@prisma/client";
import { supabase } from "./supabase";
import { prisma } from "..";
import { generateResponseGPT4 } from "./openai";


export function getSzudzikPair(a: number, b: number){
  if(a < 0 || b < 0) throw new Error("a and b must be >= 0");
  return a >= b ? a * a + a + b : a + b * b;
}

export function createResponse(
  message: string,
  status: number,
  data?: any
): Response {
  return new Response(
    JSON.stringify({
      message,
      data,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function formConnection(fable_1: fable, fable_2: fable) {
  if(fable_1.id === fable_2.id) { return false; }
  
  // Determine connection strength
  const result = await generateResponseGPT4(
    `
    Please respond with only a number between 0 and 100 for how similar the same general premise is on the following two sentences. Where a 0 is that they're not even remotely similar and a 100 is that they're referring to the exact same event.
      
    - ${fable_1.summary.trim()}
  
    - ${fable_2.summary.trim()}
    `
  );

  const match = result.match(/\d+/);
  if (match && match[0]) {

    const id_pair = getSzudzikPair(fable_1.id, fable_2.id);
    console.log(await prisma.fable_connection.findMany())
    const existingConnection = await prisma.fable_connection.findFirst({
      where: {
        id_pair,
      },
    });

    console.log(id_pair, existingConnection);

    if(existingConnection) { return false; }

    await prisma.fable_connection.create({
      data: {
        id_pair,
        fable_id_1: fable_1.id,
        fable_id_2: fable_2.id,
        strength: +match[0],
      },
    });
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
