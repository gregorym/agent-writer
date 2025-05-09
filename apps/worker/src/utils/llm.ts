import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import mime from "mime";
import path from "path";
import { uploadFileToS3 } from "./upload";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateWebsiteContext(prompt: string) {
  const config = {
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: `You will be provided with a website URL and its context. 
        Your task is to generate a comprehensive description for the website based on the provided information. Only reply with the description, without any additional text or explanations.`,
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

export async function generateArticle(
  prompt: string,
  overridePrompt?: string | null
) {
  const promptPath = path.join(__dirname, "../prompt.md");
  let promptContent = fs.readFileSync(promptPath, "utf-8");

  if (overridePrompt) {
    promptContent = overridePrompt;
  }

  const config = {
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: promptContent,
      },
    ],
  };
  const model = "gemini-2.5-pro-preview-05-06";
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

export async function generateImage(
  prompt: string
): Promise<string | undefined> {
  const config = {
    responseModalities: ["image", "text"],
    responseMimeType: "text/plain",
  };

  const model = "gemini-2.0-flash-preview-image-generation";
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

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });

  const candidates = response?.candidates;
  if (!candidates?.length) return undefined;

  const parts = candidates[0]?.content?.parts;
  if (!parts?.length) return undefined;

  const imagePart = parts.find((part) => part?.inlineData);
  if (imagePart?.inlineData) {
    const inlineData = imagePart.inlineData;
    const mimeType = inlineData.mimeType || "image/png";
    const fileExtension = mime.getExtension(mimeType);
    if (!fileExtension) {
      return undefined;
    }
    const fileName = `${Date.now()}.${fileExtension}`;
    const s3Key = `images/${fileName}`;
    const buffer = Buffer.from(inlineData.data || "", "base64");

    try {
      const imageUrl = await uploadFileToS3(buffer, s3Key, mimeType);
      return imageUrl;
    } catch (error) {
      return undefined;
    }
  }

  console.warn("No image data found in the response stream.");
  return undefined;
}
