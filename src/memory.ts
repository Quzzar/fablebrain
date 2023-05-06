import { supabase } from "./services/supabase";
import { convertDateToSupabaseFormat } from "./utils";

const TOP_CONNECTIONS = 5;
const USEFUL_CONNECTION_THRESHOLD = 50;
const RECENT_MEMORY_TIME = 10 * 60 * 1000; // 10 minutes

async function searchEntireMemory(brain: Brain): Promise<FableConnection[]>{

  console.log("Searching entire memory...");

  const { data, error } = await supabase
    .from('fable_connection')
    .select('*')
    .or(`fable_id_1.eq.${brain.latest_fable_id},fable_id_2.eq.${brain.latest_fable_id}`)
    .order('strength', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(TOP_CONNECTIONS);
  if(!data){
    return [];
  }

  const usefulConnections = [];

  for(const fable_connection of data){
    if(fable_connection.strength >= USEFUL_CONNECTION_THRESHOLD){
      usefulConnections.push(fable_connection);
    }

    // Add to recently recalled
    const { error } = await supabase
      .from("recently_recalled")
      .upsert({
          id_pair: fable_connection.id_pair,
          fable_id_1: fable_connection.fable_id_1,
          fable_id_2: fable_connection.fable_id_2,
          strength: fable_connection.strength,
          brain_id: brain.id,
          created_at: convertDateToSupabaseFormat(new Date()),
          remove_at: convertDateToSupabaseFormat(new Date(new Date().getTime() + RECENT_MEMORY_TIME)),
        },
        {
          onConflict: 'id_pair',
        }
      );
  }

  console.log(`Found ${usefulConnections.length} more useful connections.`);

  return usefulConnections as FableConnection[];

}


export async function searchMemory(brain: Brain){

  console.log("Searching recent memory...");

  const { data } = await supabase
    .from('recently_recalled')
    .select('*')
    .or(`fable_id_1.eq.${brain.latest_fable_id},fable_id_2.eq.${brain.latest_fable_id}`)
    .order('strength', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(TOP_CONNECTIONS);
  const recentConnections = (data ? data : []) as RecentlyRecalled[];
  
  const usefulConnections: FableConnection[] = [];// cast down to FableConnection

  for(const recently_recalled of recentConnections){
    if(recently_recalled.strength >= USEFUL_CONNECTION_THRESHOLD){
      usefulConnections.push(recently_recalled);
    }

    // Update recently recalled
    const { error } = await supabase
      .from("recently_recalled")
      .upsert({
          id_pair: recently_recalled.id_pair,
          fable_id_1: recently_recalled.fable_id_1,
          fable_id_2: recently_recalled.fable_id_2,
          strength: recently_recalled.strength,
          brain_id: brain.id,
          created_at: convertDateToSupabaseFormat(new Date()),
          remove_at: convertDateToSupabaseFormat(new Date(new Date().getTime() + RECENT_MEMORY_TIME)),
        },
        {
          onConflict: 'id_pair',
        }
      );
  }

  console.log(`Found ${usefulConnections.length} useful connections.`);

  // If we don't have enough useful connections, search the entire memory for more
  if(usefulConnections.length < TOP_CONNECTIONS){
    console.log(`Need more connections,`);
    const moreConnections = await searchEntireMemory(brain);

    // Remove duplicates
    const connectionMap = new Map<BigInt, FableConnection>();
    for(const connection of usefulConnections){
      connectionMap.set(connection.id_pair, connection);
    }
    for(const connection of moreConnections){
      connectionMap.set(connection.id_pair, connection);
    }
    
    console.log(`Total of ${connectionMap.size} useful connections, up to ${TOP_CONNECTIONS}.`);

    // Sort by strength, then by most recently created
    const sortedConnections = [...connectionMap.values()].sort((a, b) => {
      if (a.strength > b.strength) {
        return -1;
      } else if (a.strength < b.strength) {
        return 1;
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Return the top connections
    return sortedConnections.slice(0, TOP_CONNECTIONS);

  } else {
    return usefulConnections;
  }

}


export async function forgetRecentMemories(brain: Brain){

  const { error } = await supabase
    .from("recently_recalled")
    .delete()
    .eq("brain_id", brain.id)
    .lt("remove_at", convertDateToSupabaseFormat(new Date()));
  
  if (error) {
    console.error("Error forgetting recently recalled: ", error);
  }

}