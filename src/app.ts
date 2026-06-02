import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Traqr API is running",
    });
  });

export default app;
