import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const extractTextFromImage = async (
  file: Express.Multer.File
) => {
  const imageBase64 =
    file.buffer.toString("base64");

  const response =
    await ai.models.generateContent({
      model: "gemini-3.5-flash",

      contents: [
        {
          inlineData: {
            mimeType: file.mimetype,
            data: imageBase64,
          },
        },

        {
          text: `
Extract every visible text from this image.

Return only the text.

Do not explain.
Do not summarize.
`,
        },
      ],
    });

  return response.text;
};