import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateWebsiteContext(prompt: string) {
  const config = {
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: `You will be provided with a website URL and its context. Your task is to generate a comprehensive context for the website based on the provided information.`,
      },
    ],
  };

  const model = "gemini-2.0-flash";
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

  return response?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function generateArticle(prompt: string) {
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

  return response?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function generateImage(prompt: string) {
  const config = {
    responseModalities: ["image", "text"],
    responseMimeType: "text/plain",
  };

  const model = "gemini-2.0-flash-exp-image-generation";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Create a 16/9 image. ${prompt}`,
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
    if (
      !chunk.candidates ||
      !chunk.candidates[0].content ||
      !chunk.candidates[0].content.parts
    ) {
      continue;
    }
    if (chunk.candidates[0].content.parts[0].inlineData) {
      const fileName = "ENTER_FILE_NAME";
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      let fileExtension = mime.getExtension(inlineData.mimeType || "");
      let buffer = Buffer.from(inlineData.data || "", "base64");
      saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
    }
  }
}
