import { uploadFileToS3 } from "@/lib/upload";
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const aiRouter = router({
  createImage: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
              text: `Create a 16/9 image. ${input.prompt}`,
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
    }),
});
