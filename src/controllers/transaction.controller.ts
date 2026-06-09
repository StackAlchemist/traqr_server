import { Request, Response } from "express";
import prisma from "../lib/prisma";

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
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