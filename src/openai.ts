import { supabase } from './supabase';


export async function generateResponseGPT4(prompt: string, temperature=0, max_tokens=250){
  const model = "gpt-4";
  
  // Directly hit the OpenAI's API - TODO: Try using the package again?
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        {role: "system", content: "You are an oracle for determining the lessons learned from events and dictating the best choices to wisely achieve goals."},
        {role: "user", content: prompt},
      ],
      model,
      temperature,
      max_tokens,
    }),
    //verbose: true
  });
  const response = await res.json<any>();
  const result = response.choices[0].message.content;


  // Save to database
  const { error } = await supabase
    .from('generated_text')
    .insert({
      model,
      prompt,
      result,
      temperature,
    });
  if(error){
    console.error(error);
  }

  return result;
}


export async function generateResponseGPT3(prompt: string, temperature=0, max_tokens=250){
  const model = "text-davinci-003";
  
  // Directly hit the OpenAI's API - TODO: Try using the package again?
  const res = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      prompt,
      model,
      temperature,
      max_tokens,
    }),
    //verbose: true
  });
  const response = await res.json<any>();
  const result = response.choices[0].text;


  // Save to database
  const { error } = await supabase
    .from('generated_text')
    .insert({
      model,
      prompt,
      result,
      temperature,
    });
  if(error){
    console.error(error);
  }

  return result;
}
