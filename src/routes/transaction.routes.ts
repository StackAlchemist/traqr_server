import { Router } from "express";
import { deleteTransaction, getAIInsight, getTransactionById, getTransactions, getTopCategories, getSpendingChart, getRecentTransactions, getTopMerchants, getBiggestTransaction, getHeatmap, getMonthlyComparison } from "../controllers/transaction.controller";

const router = Router();

router.get('/', getTransactions); 
router.get('/ai-insight', getAIInsight);
router.get('/top-categories', getTopCategories);
router.get('/chart', getSpendingChart);
router.get('/recent', getRecentTransactions);
router.get('/top-merchants', getTopMerchants)
router.get('/biggest', getBiggestTransaction)
router.get('/monthly-comparison', getMonthlyComparison)
router.get('/heatmap', getHeatmap)
router.get('/:id', getTransactionById);
router.delete('/:id', deleteTransaction);

export default router;