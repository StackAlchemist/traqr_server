import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { extractTransactionData } from "../services/gemini.service";

// Temporary user until auth is implemented
const TEST_USER_ID = "TEST_USER_ID";

export const uploadFiles = async (
  req: Request,
  res: Response
) => {
  try {
    // Get uploaded files from multer
    const files = req.files as Express.Multer.File[];

    // Ensure at least one file was uploaded
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded",
      });
    }

    // Extract transaction data from every uploaded image
    const results = await Promise.all(
      files.map(async (file) => {
        const extractedText =
          await extractTransactionData(file);

        return {
          fileName: file.originalname,
          extractedText,
        };
      })
    );

    // Convert Gemini JSON strings into JavaScript objects
    const extractedTransactions = results.map(
      (result) => JSON.parse(result.extractedText)
    );

    // Save all transactions
    await prisma.transaction.createMany({
      data: extractedTransactions.map(
        (transaction) => {
          // Safely parse date
          const parsedDate =
            transaction.transactionDate
              ? new Date(
                  transaction.transactionDate
                )
              : null;

          const transactionAt =
            parsedDate &&
            !isNaN(parsedDate.getTime())
              ? parsedDate
              : null;

          // Convert Gemini category values
          const categoryMap: Record<
            string,
            any
          > = {
            "Mobile Data": "DATA",
            "Data purchases": "DATA",
            Airtime: "AIRTIME",
            Transfer: "TRANSFER",
            Food: "FOOD",
            Transport: "TRANSPORT",
            Shopping: "SHOPPING",
            Bills: "BILLS",
            Health: "HEALTH",
            Education: "EDUCATION",
          };

          return {
            merchant:
              transaction.merchant ?? null,

            description:
              transaction.description ??
              null,

            amount:
              transaction.amount ?? null,

            category:
              categoryMap[
                transaction.category
              ] ?? "OTHER",

            rawText:
              transaction.rawText ?? null,

            transactionAt,

            // For now all uploads are screenshots
            source: "SCREENSHOT",

            // Replace with req.user.id after auth
            userId: TEST_USER_ID,
          };
        }
      ),
    });

    return res.json({
      success: true,
      results: extractedTransactions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Failed to process image",
    });
  }
};