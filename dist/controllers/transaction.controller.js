"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIInsight = exports.getBigBuys = exports.deleteTransaction = exports.getTransactionById = exports.getTransactions = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const gemini_service_1 = require("../services/gemini.service");
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_ID = process.env.TEST_USER_ID;
const getTransactions = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: {
                email: TEST_USER_EMAIL,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        // Get all transactions from the database
        const transactions = await prisma_1.default.transaction.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                transactionAt: "desc", // Sort by transaction date in descending order
            }
        });
        return res.status(200).json({
            success: true,
            data: transactions,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch transactions",
        });
    }
};
exports.getTransactions = getTransactions;
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid transaction id",
            });
        }
        const transaction = await prisma_1.default.transaction.findUnique({
            where: { id },
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: "Transaction not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: transaction,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch transaction",
        });
    }
};
exports.getTransactionById = getTransactionById;
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid transaction id",
            });
        }
        const transaction = await prisma_1.default.transaction.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            data: transaction,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete transaction",
        });
    }
};
exports.deleteTransaction = deleteTransaction;
const getBigBuys = async (req, res) => {
    try {
        const transactions = await prisma_1.default.transaction.findMany({
            where: {
                amount: { gt: 100000 },
            },
        });
        return res.status(200).json({
            success: true,
            data: transactions,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch big buys",
        });
    }
};
exports.getBigBuys = getBigBuys;
const getAIInsight = async (req, res) => {
    try {
        const transactions = await prisma_1.default.transaction.findMany({
            where: {
                userId: TEST_USER_ID,
            },
        });
        const insight = await (0, gemini_service_1.aiInsight)(transactions);
        return res.status(200).json({
            success: true,
            data: insight,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch AI insight",
        });
    }
};
exports.getAIInsight = getAIInsight;
