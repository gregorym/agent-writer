import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export async function generateArticle(prompt: string) {
  const ai = new GoogleGenAI({});
  const promptPath = path.join(__dirname, "../prompt.md");
  const promptContent = fs.readFileSync(promptPath, "utf-8");

  const config = {
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: promptContent,
      },
    ],
  };
  const model = "gemini-2.5-flash-preview-04-17";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });

  return response.candidates[0].parts[0].text;
}

export async function generateImage() {
  const ai = new GoogleGenAI({});
  const config = {
    responseMimeType: "text/plain",
  };
  const model = "gemini-2.0-flash";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Create a 16/9 image of people walking down a wooden path. They are in the forest surrounded by trees.`,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          fileData: {
            // fileUri: files[0].uri,
            // mimeType: files[0].mimeType,
          },
        },
      ],
    },
    {
      role: "user",
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}
