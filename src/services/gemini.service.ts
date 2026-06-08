import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const extractTransactionData = async (
  file: Express.Multer.File
) => {
  const imageBase64 = file.buffer.toString("base64");

  const response = await ai.models.generateContent({
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
You are an expert financial document parser.

The image may contain:
- Bank transfer receipts
- OPay receipts
- PalmPay receipts
- Moniepoint receipts
- Kuda receipts
- Airtime purchases
- Data purchases
- Store receipts
- Bank statements

Extract the information and return ONLY valid JSON.

Schema:

{
  "merchant": string | null,
  "description": string | null,
  "amount": number | null,
  "category": string | null,
  "transactionDate": string | null,
  "reference": string | null,
  "sourceType": string | null,
  "rawText": string
}

Rules:
- Do not invent values.
- Use null when unavailable.
- amount must be a number.
- Return JSON only.
- No markdown.
- No explanations.
`,
      },
    ],
  });

  return response.text;
};