import cors from "cors";
import express from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { requireAuth } from "./middleware/auth.middleware";
import dotenv from "dotenv";
dotenv.config();
import uploadRouter from "./routes/upload.route";

const app = express();

app.use("/uploads", uploadRouter);
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

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

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

export default app;
