"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const gemini_service_1 = require("../services/gemini.service");
// Temporary user until auth is implemented
const TEST_USER_ID = process.env.TEST_USER_ID ?? "TEST_USER_ID";
const uploadFiles = async (req, res) => {
    try {
        // Get uploaded files from multer
        const files = req.files;
        // Ensure at least one file was uploaded
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded",
            });
        }
        // Extract transaction data from every uploaded image
        const results = await Promise.all(files.map(async (file) => {
            const extractedText = await (0, gemini_service_1.extractTransactionData)(file);
            return {
                fileName: file.originalname,
                extractedText,
            };
        }));
        // Convert Gemini JSON strings into JavaScript objects
        const extractedTransactions = results.map((result) => {
            if (!result.extractedText) {
                throw new Error(`Failed to extract text from ${result.fileName}`);
            }
            return JSON.parse(result.extractedText);
        });
        // Save all transactions
        await prisma_1.default.transaction.createMany({
            data: extractedTransactions.map((transaction) => {
                // Safely parse date
                const parsedDate = transaction.transactionDate
                    ? new Date(transaction.transactionDate)
                    : null;
                const transactionAt = parsedDate &&
                    !isNaN(parsedDate.getTime())
                    ? parsedDate
                    : null;
                // Convert Gemini category values
                const categoryMap = {
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
                    merchant: transaction.merchant ?? null,
                    description: transaction.description ??
                        null,
                    amount: transaction.amount ?? null,
                    category: categoryMap[transaction.category] ?? "OTHER",
                    rawText: transaction.rawText ?? null,
                    transactionAt,
                    // For now all uploads are screenshots
                    source: "SCREENSHOT",
                    // Replace with req.user.id after auth
                    userId: TEST_USER_ID,
                };
            }),
        });
        return res.json({
            success: true,
            results: extractedTransactions,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to process image",
        });
    }
};
exports.uploadFiles = uploadFiles;
