import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = true
) {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";
  let last_response: string = "";

  for (let i = 0; i < num_tries; i++) {
    console.log(`Attempt ${i + 1} of ${num_tries}`);
    
    let output_format_prompt: string = `\nYou must respond ONLY with valid JSON in the following format: ${JSON.stringify(
      output_format
    )}. \n\nDo not include any explanations, markdown formatting, or anything else outside the JSON structure.`;

    if (list_input) {
      if (list_output) {
        output_format_prompt += `\nSince you are processing multiple inputs, generate an array of objects, where each object has the format shown above.`;
      } else {
        output_format_prompt += `\nSince you are processing multiple inputs, generate an array of objects, one for each input.`;
      }
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it.`;
    }

    // Add example of expected output format
    const example_format = list_input 
      ? [{ title: "Example Unit Title", chapters: [{ youtube_search_query: "Example search query", chapter_title: "Example Chapter Title" }] }] 
      : { title: "Example Unit Title", chapters: [{ youtube_search_query: "Example search query", chapter_title: "Example Chapter Title" }] };
    
    output_format_prompt += `\n\nExample of expected output format: ${JSON.stringify(example_format)}`;

    try {
      const response = await openai.chat.completions.create({
        temperature: temperature,
        model: model,
        messages: [
          {
            role: "system",
            content: system_prompt + output_format_prompt + error_msg,
          },
          { 
            role: "user", 
            content: Array.isArray(user_prompt) 
              ? `Process the following inputs and generate JSON as specified: ${JSON.stringify(user_prompt)}` 
              : user_prompt.toString() 
          },
        ],
      });

      last_response = response.choices[0].message?.content?.trim() ?? "";
      
      // Better preprocessing for JSON parsing
      let processed_response = last_response;
      
      // Remove any markdown code block indicators
      processed_response = processed_response.replace(/```json/g, "").replace(/```/g, "").trim();
      
      // Log both original and processed responses for debugging
      console.log("\nOriginal GPT response:", last_response);
      console.log("\nProcessed response:", processed_response);

      try {
        // Try to parse the response as JSON
        let output: any = JSON.parse(processed_response);
        
        // Handle specific formats based on input/output configurations
        if (list_input) {
          if (!Array.isArray(output)) {
            console.log("Expected array output but got:", typeof output);
            throw new Error("Output format not in an array of json");
          }
        } else {
          output = [output];
        }

        // Validate and normalize the output
        for (let index = 0; index < output.length; index++) {
          if (!output[index] || typeof output[index] !== 'object') {
            throw new Error(`Output item at index ${index} is not an object`);
          }
          
          // Check required keys
          for (const outputKey in output_format) {
            if (/<.*?>/.test(outputKey)) {
              continue;
            }

            if (!(outputKey in output[index])) {
              throw new Error(`Key "${outputKey}" not found in output at index ${index}`);
            }
            
            // Handle special cases for array output format
            if (Array.isArray(output_format[outputKey])) {
              const choices = output_format[outputKey] as string[];
              if (Array.isArray(output[index][outputKey])) {
                output[index][outputKey] = output[index][outputKey][0];
              }
              if (!choices.includes(output[index][outputKey]) && default_category) {
                output[index][outputKey] = default_category;
              }
              if (typeof output[index][outputKey] === 'string' && output[index][outputKey].includes(":")) {
                output[index][outputKey] = output[index][outputKey].split(":")[0];
              }
            }
          }
        }

        // Return the parsed and validated result
        if (output_value_only) {
          output = output.map((item: any) => {
            const values = Object.values(item);
            return values.length === 1 ? values[0] : values;
          });
        }

        console.log("Successfully parsed JSON. Returning result.");
        return list_input ? output : output[0];
      } catch (e) {
        // If JSON parsing fails, provide detailed error message for retry
        console.error("JSON parsing error:", e);
        error_msg = `\n\nYour previous response could not be parsed as valid JSON. The error was: ${e}.\n\nPlease respond ONLY with valid JSON matching the specified format exactly. No explanations, no markdown, just the JSON data.`;
        
        // Try manual JSON extraction as a fallback (for responses with extra text)
        try {
          // Use a regex approach that works with ES5/ES6
          // First try to find JSON starting with { and ending with }
          let jsonStart = processed_response.indexOf('{');
          let jsonEnd = processed_response.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const extractedJson = processed_response.substring(jsonStart, jsonEnd + 1);
            console.log("Attempting to extract object JSON:", extractedJson);
            const output = JSON.parse(extractedJson);
            console.log("Successfully extracted JSON object. Returning result.");
            
            let normalizedOutput = Array.isArray(output) ? output : [output];
            return list_input ? normalizedOutput : normalizedOutput[0];
          }
          
          // If that fails, try finding JSON starting with [ and ending with ]
          jsonStart = processed_response.indexOf('[');
          jsonEnd = processed_response.lastIndexOf(']');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const extractedJson = processed_response.substring(jsonStart, jsonEnd + 1);
            console.log("Attempting to extract array JSON:", extractedJson);
            const output = JSON.parse(extractedJson);
            console.log("Successfully extracted JSON array. Returning result.");
            
            let normalizedOutput = Array.isArray(output) ? output : [output];
            return list_input ? normalizedOutput : normalizedOutput[0];
          }
        } catch (extractionError) {
          console.error("Extraction fallback failed:", extractionError);
        }
      }
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      error_msg = `\n\nThere was an error calling the OpenAI API. Will retry.`;
    }
  }

  // If we get here, all attempts failed
  console.error("All attempts failed. Last response:", last_response);
  throw new Error(`Failed to get valid JSON after ${num_tries} attempts. Last response: ${last_response}`);
}