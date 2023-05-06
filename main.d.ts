

interface GeneratedText {
  id: number,
  model: string,
  prompt: string,
  result: string,
  temperature: number,
  execution_time: number,
  created_at: string,
}

interface Fable {
  id: number,
  summary: string,
  conclusion: string,
  goal: string,
  brain_id: number,
  created_at: string,
}

interface FableConnection {
  id_pair: BigInt,
  fable_id_1: number,
  fable_id_2: number,
  strength: number,
  created_at: string,
}

interface Brain {
  id: number,
  user_id: number,
  name: string,
  description: string,
  created_at: string,
}

