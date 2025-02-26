import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { createChaptersSchema } from "../../validators/chapter.validator";

const openai = new OpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY
    }
);

export const strict_output = async (system_prompt: string, user_prompt: any, output_format: any) => {
    const completion = await openai.beta.chat.completions.parse({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt },
        ],
        response_format: zodResponseFormat(createChaptersSchema, "json"),
      });
      
      const math_reasoning = completion.choices[0].message.parsed;
      return math_reasoning;
}


