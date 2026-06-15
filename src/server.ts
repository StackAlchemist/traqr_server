import cors from "cors";
import express from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { requireAuth } from "./middleware/auth.middleware";
import dotenv from "dotenv";
dotenv.config();
import uploadRouter from "./routes/upload.route";
import transactionRouter from "./routes/transaction.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use("/uploads", uploadRouter);
app.use("/transactions", transactionRouter);

app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Traqr API is running",
    });
  });

  app.get("/test", requireAuth, (req, res) => {
    const { userId } = getAuth(req);
    res.json({ message: "You're in!", userId });
  });

app.listen(5000, "0.0.0.0", () => {
  console.log('Server is running on port 5000');
});

export default app;
