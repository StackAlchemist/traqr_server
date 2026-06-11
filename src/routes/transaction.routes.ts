import { Router } from "express";
import { deleteTransaction, getAIInsight, getTransactionById, getTransactions } from "../controllers/transaction.controller";

const router = Router();

router.get("/", getTransactions); 
router.get('/ai-insight', getAIInsight);
router.get("/:id", getTransactionById);
router.delete("/:id", deleteTransaction);

export default router;