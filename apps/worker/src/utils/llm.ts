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

export async function generateImage(
  prompt: string
): Promise<string | undefined> {
  // Add return type
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

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });

  console.log("Response:", response);

  const part = response?.candidates[0].content.parts[0];
  if (part?.inlineData) {
    const inlineData = part.inlineData;
    const mimeType = inlineData.mimeType || "image/png"; // Default to png if mimeType is missing
    const fileExtension = mime.getExtension(mimeType); // Corrected usage
    if (!fileExtension) {
      console.error(
        "Could not determine file extension for mime type:",
        mimeType
      );
      return undefined; // Return undefined if file extension cannot be determined
    }
    const fileName = `${Date.now()}.${fileExtension}`;
    const s3Key = `images/${fileName}`; // Define S3 key
    const buffer = Buffer.from(inlineData.data || "", "base64");

    try {
      const imageUrl = await uploadFileToS3(buffer, s3Key, mimeType);
      console.log(`Image uploaded to: ${imageUrl}`);
      return imageUrl; // Return the S3 URL
    } catch (error) {
      console.error("Failed to upload image to S3:", error);
      // Depending on requirements, you might want to throw the error
      // throw new Error("Failed to upload image");
      return undefined; // Or return undefined/null to indicate failure
    }
  }

  console.warn("No image data found in the response stream.");
  return undefined; // Return undefined if no image was generated/uploaded
}
