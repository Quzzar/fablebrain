
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
  input: string,
  conclusion: string,
  goal: string,
  brain_id: number,
  resulting_action_id: number,
  created_at: string,
}

interface FableAction extends Fable {
  action: Action,
}

interface Brain {
  id: number,
  user_id: number,
  name: string,
  description: string,
  created_at: string,
}

interface FableConnection {
  id_pair: BigInt,
  fable_id_1: number,
  fable_id_2: number,
  strength: number,
  created_at: string,
}

interface RecentlyRecalled extends FableConnection {
  brain_id: number,
  removed_at: string,
}

interface Action {
  id: number,
  brain_id: number,
  name: string,
  description: string,
  args: Arg[],
}

interface Arg {
  name: string,
  description: string,
  type: 'string' | 'number' | 'boolean' | 'enum',
  extra?: {
    number?: {
      min?: number,
      max?: number,
    },
    enum?: string[],
    string?: {
      min?: number,
      max?: number,
    }
  },
}

