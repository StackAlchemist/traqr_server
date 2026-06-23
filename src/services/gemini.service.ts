import { GoogleGenAI } from "@google/genai";
import type { Transaction } from "../generated/prisma/client";

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

you can infer category from the name of the recipient/merchant if not stated in description. eg. d & d stitches = SHOPPING, bodija intl school = EDUCATION and so on

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

  return response.text ?? "";
};

export const aiInsight = async (
  transactions: Transaction[]
) => {
  if (!transactions.length) {
    return {
      insight: "No transactions found.",
      tips: [],
    };
  }

  // Aggregate transactions by category and calculate total spent
  const totalSpent = transactions.reduce(  // Calculate total spent from transaction
    (sum, transaction) =>
      sum + (transaction.amount ?? 0),
    0
  );

  const categoryTotals: Record<string, number> = {}; // Track total spent by category

  transactions.forEach((transaction) => {
    const category =
      transaction.category ?? "OTHER"; // Default to OTHER if category is not found

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      (transaction.amount ?? 0); // Add amount to category total
  });

  const topCategory = 
  Object.entries(categoryTotals)
  .sort((a, b) => b[1] - a[1])[0]; // Get category with highest total spent, sort in descending order

  const response =
    await ai.models.generateContent({
      model: "gemini-3.5-flash",

      contents: [
        {
          text: `
You are a personal finance advisor.

Analyze this spending summary.

Total spent:
₦${totalSpent}

Number of transactions:
${transactions.length}

Category breakdown:
${JSON.stringify(categoryTotals, null, 2)}

Largest spending category:
${topCategory?.[0] ?? "OTHER"} (₦${topCategory?.[1] ?? 0})

Return ONLY valid JSON.

Analyze the transactions and give the user insights and tips for spending better and saving money, make it concise and to the point. for example: "You spent too much on food and drinks, you should consider cooking at home more and buying less expensive food and drinks."

Return ONLY raw JSON.
Do NOT wrap the response in:
${"```json"}

Do NOT use markdown.

Do NOT explain.

Output must start with { and end with }.

{
  "insight": "string",
  "tips": [
    "string",
    "string",
    "string"
  ]
}

`,
        },
      ],
    });

  const text = response.text?.trim();
  console.log(text);

  return JSON.parse(text || "{}");
};