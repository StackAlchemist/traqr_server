import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { aiInsight } from "../services/gemini.service";
import { Transaction, Category } from "../generated/prisma/client"; 

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_ID = process.env.TEST_USER_ID ?? "TEST_USER_ID";

const getMonthRange = (year: number, month: number) => ({
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
});

const formatChartDay = (day: Date | string): string => {
    if (day instanceof Date) {
        return day.toISOString().slice(0, 10);
    }
    return String(day).slice(0, 10);
};
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
                userId: TEST_USER_ID,
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
        const user = await prisma.user.findUnique({
            where: { email: TEST_USER_EMAIL },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        const queryYear = req.query.year ? Number(req.query.year) : undefined;
        const queryMonth = req.query.month ? Number(req.query.month) : undefined;

        let year: number;
        let month: number;

        if (
            queryYear &&
            queryMonth &&
            queryMonth >= 1 &&
            queryMonth <= 12
        ) {
            year = queryYear;
            month = queryMonth - 1;
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth();

            const { start, end } = getMonthRange(year, month);

            const countThisMonth = await prisma.transaction.count({
                where: {
                    userId: user.id,
                    OR: [
                        { transactionAt: { gte: start, lt: end } },
                        {
                            transactionAt: null,
                            createdAt: { gte: start, lt: end },
                        },
                    ],
                },
            });

            if (countThisMonth === 0) {
                const latest = await prisma.transaction.findFirst({
                    where: { userId: user.id },
                    orderBy: [
                        { transactionAt: "desc" },
                        { createdAt: "desc" },
                    ],
                });

                if (latest) {
                    const effectiveDate =
                        latest.transactionAt ?? latest.createdAt;
                    year = effectiveDate.getFullYear();
                    month = effectiveDate.getMonth();
                }
            }
        }

        const { start, end } = getMonthRange(year, month);

        const grouped = await prisma.$queryRaw<{ day: Date; total: number }[]>`
            SELECT
                (COALESCE("transactionAt", "createdAt")::date) AS day,
                SUM(amount) AS total
            FROM "Transaction"
            WHERE
                "userId" = ${user.id}
                AND COALESCE("transactionAt", "createdAt") >= ${start}
                AND COALESCE("transactionAt", "createdAt") < ${end}
            GROUP BY (COALESCE("transactionAt", "createdAt")::date)
            ORDER BY day ASC
        `;

        const data = grouped.map((g) => ({
            day: formatChartDay(g.day),
            total: Number(g.total),
        }));

        return res.status(200).json({
            success: true,
            data,
            meta: { year, month: month + 1 },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch chart data",
        });
    }
};

export const getRecentTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: TEST_USER_ID },
            orderBy: { transactionAt: "desc" },
            take: 5,
        });

        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch recent transactions",
        });
    }
};

export const getTopMerchants = async (req: Request, res: Response) => {
    try {
      const merchants = await prisma.transaction.groupBy({
        by: ["merchant"],
        where: { userId: TEST_USER_ID },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      })
  
      const data = merchants.map((m) => ({
        merchant: m.merchant,
        total: m._sum.amount ?? 0,
      }))
  
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: "Failed to fetch top merchants" })
    }
  }


  export const getBiggestTransaction = async (req: Request, res: Response) => {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { userId: TEST_USER_ID },
        orderBy: { amount: "desc" },
      })
  
      return res.status(200).json({ success: true, data: transaction })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: "Failed to fetch biggest transaction" })
    }
  }


  export const getMonthlyComparison = async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: TEST_USER_ID,
          category: { not: Category.INCOME },
          transactionAt: {
            gte: lastMonthStart,
            lt: nextMonthStart,
            not: null,
          },
        },
        select: { amount: true, transactionAt: true },
      });

      let thisMonth = 0, lastMonth = 0;
      for (const t of transactions) {
        if (t.transactionAt && t.transactionAt >= thisMonthStart) thisMonth += t.amount;
        else if (t.transactionAt && t.transactionAt >= lastMonthStart && t.transactionAt < thisMonthStart) lastMonth += t.amount;
      }

      const change = lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : 0;

      return res.status(200).json({
        success: true,
        data: { thisMonth, lastMonth, change }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Failed to fetch monthly comparison" });
    }
  }

  export const getHeatmap = async (req: Request, res: Response) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: TEST_USER_ID,
          transactionAt: { not: null },
          category: { not: Category.INCOME },
        },
        select: { amount: true, transactionAt: true },
      })
  
      // Build map of { "2026-05-01": total }
      const map = new Map<string, number>()
      for (const t of transactions) {
        const day = t.transactionAt!.toISOString().split("T")[0]
        map.set(day, (map.get(day) ?? 0) + t.amount)
      }
  
      const data = [...map.entries()].map(([day, total]) => ({ day, total }))
  
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, error: "Failed to fetch heatmap" })
    }
  }