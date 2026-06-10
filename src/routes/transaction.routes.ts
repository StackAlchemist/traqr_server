import { Router } from "express";
import { deleteTransaction, getTransactionById, getTransactions } from "../controllers/transaction.controller";

const router = Router();

router.get("/", getTransactions); 
router.get("/:id", getTransactionById);
router.delete("/:id", deleteTransaction);

export default router;