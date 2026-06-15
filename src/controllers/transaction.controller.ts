import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { aiInsight } from "../services/gemini.service";
import { Category } from "../generated/prisma/client";

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_ID = process.env.TEST_USER_ID;
export const getTransactions = async (req: Request, res: Response) => {
    try {

        const user = await prisma.user.findUnique({
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
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                transactionAt: "desc", // Sort by transaction date in descending order
            }
        })

        return res.status(200).json({
            success: true,
            data: transactions,
        })
    } catch (error) {
        console.error(error);
    return res.status(500).json({
        success: false,
        error: "Failed to fetch transactions",
      });
    }
}

export const getTransactionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid transaction id",
            });
        }

        const transaction = await prisma.transaction.findUnique({
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch transaction",
        });
    }
}

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid transaction id",
            });
        }

        const transaction = await prisma.transaction.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete transaction",
        });
    }
}

export const getBigBuys = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                amount: { gt: 100000 },
            },
        });
        return res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch big buys",
        });
    }
}

export const getAIInsight = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: TEST_USER_ID,
            },
        });
        const insight = await aiInsight(transactions);
        return res.status(200).json({
            success: true,
            data: insight,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch AI insight",
        });
    }
}

export const getTopCategories = async (req: Request, res: Response) => {
    try {
        const grouped = await prisma.transaction.groupBy({
            by: ["category"],
            where: {
                userId: req.auth?.userId,  // scope to current user
            },
            _sum: {
                amount: true,
            },
            orderBy: {
                _sum: {
                    amount: "desc",  // highest spender first
                },
            },
            take: 5,  // top 5 only
        });

        const total = grouped.reduce((sum, c) => sum + (c._sum.amount ?? 0), 0);

        const data = grouped.map((c) => ({
            category:   c.category,
            total:      c._sum.amount ?? 0,
            percentage: total > 0
                ? Math.round(((c._sum.amount ?? 0) / total) * 100)
                : 0,
        }));

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch top categories",
        });
    }
};

export const getSpendingChart = async (req: Request, res: Response) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: TEST_USER_ID,
          category: { not: Category.INCOME },
          transactionAt: { gte: startOfMonth, not: null },
        },
        select: { transactionAt: true, amount: true },
        orderBy: { transactionAt: "asc" },
      })
  
      // Group by date in JS
      const map = new Map<string, number>()
      for (const t of transactions) {
        const day = t.transactionAt!.toISOString().split("T")[0]
        map.set(day, (map.get(day) ?? 0) + t.amount)
      }
  
      const data = [...map.entries()].map(([day, total]) => ({ day, total }))
  
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: "Failed to fetch chart data" })
    }
  }
  export const getRecentTransactions = async (req: Request, res: Response) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: TEST_USER_ID },
        orderBy: { transactionAt: "desc" },
        take: 5,
      })
  
      return res.status(200).json({ success: true, data: transactions })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: "Failed to fetch recent transactions" })
    }
  }