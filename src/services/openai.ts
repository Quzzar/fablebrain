import { supabase } from "./supabase";


export async function generateResponseGPT4(
  prompt: string,
  temperature = 0,
  max_tokens = 250
): Promise<string | null> {
  const model = "gpt-4";

  // Check to see if we've generated this one before,
  const { data: generatedText, error: fetchError } = await supabase
    .from("generated_text")
    .select("*")
    .eq("prompt", prompt)
    .eq("temperature", temperature)
    .eq("model", model)
    .order("created_at")
    .limit(1);

  // If we don't have this result yet, generate a result from OpenAI
  if (!generatedText || generatedText.length === 0 || fetchError) {

    let startTime = performance.now();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are an oracle for determining the lessons learned from events and dictating the best choices to wisely achieve goals.",
          },
          { role: "user", content: prompt },
        ],
        model,
        temperature,
        max_tokens,
      }),
    });

    let result = '';
    try {
      const response = await res.json<any>();
      result = response.choices[0].message.content;
    } catch (e) {
      return null;
    }

    let endTime = performance.now();

    // Save to database
    const { error } = await supabase.from("generated_text").insert({
      model,
      prompt,
      result,
      temperature,
      execution_time: Math.round(endTime - startTime),
    });
    if (error) {
      console.error(error);
    }
    return result;

  } else {
    return generatedText[0].result;
  }
}


export async function generateResponseChatGPT(
  prompt: string,
  temperature = 0,
  max_tokens = 250
): Promise<string | null> {
  const model = "gpt-3.5-turbo";

  // Check to see if we've generated this one before,
  const { data: generatedText, error: fetchError } = await supabase
    .from("generated_text")
    .select("*")
    .eq("prompt", prompt)
    .eq("temperature", temperature)
    .eq("model", model)
    .order("created_at")
    .limit(1);

  // If we don't have this result yet, generate a result from OpenAI
  if (!generatedText || generatedText.length === 0 || fetchError) {

    let startTime = performance.now();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are an oracle for determining the lessons learned from events and dictating the best choices to wisely achieve goals.",
          },
          { role: "user", content: prompt },
        ],
        model,
        temperature,
        max_tokens,
      }),
    });

    let result = '';
    try {
      const response = await res.json<any>();
      result = response.choices[0].message.content;
    } catch (e) {
      return null;
    }

    let endTime = performance.now();

    // Save to database
    const { error } = await supabase.from("generated_text").insert({
      model,
      prompt,
      result,
      temperature,
      execution_time: Math.round(endTime - startTime),
    });
    if (error) {
      console.error(error);
    }
    return result;

  } else {
    return generatedText[0].result;
  }
}


export async function generateResponseGPT3(
  prompt: string,
  temperature = 0,
  max_tokens = 250
): Promise<string | null> {
  const model = "text-davinci-003";

  // Check to see if we've generated this one before,
  const { data: generatedText, error: fetchError } = await supabase
    .from("generated_text")
    .select("*")
    .eq("prompt", prompt)
    .eq("temperature", temperature)
    .eq("model", model)
    .order("created_at")
    .limit(1);

  // If we don't have this result yet, generate a result from OpenAI
  if (!generatedText || generatedText.length === 0 || fetchError) {

    let startTime = performance.now();

    const res = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        model,
        temperature,
        max_tokens,
      }),
    });

    let result = '';
    try {
      const response = await res.json<any>();
      result = response.choices[0].text;
    } catch (e) {
      return null;
    }

    let endTime = performance.now();

    // Save to database
    const { error } = await supabase.from("generated_text").insert({
      model,
      prompt,
      result,
      temperature,
      execution_time: Math.round(endTime - startTime),
    });
    if (error) {
      console.error(error);
    }
    return result;

  } else {
    return generatedText[0].result;
  }
}
