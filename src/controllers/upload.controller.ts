import { Request, Response } from "express";
import { extractTextFromImage } from "../services/gemini.service";

export const uploadFiles = async (
  req: Request,
  res: Response
) => {
  try {
    const files =
      req.files as Express.Multer.File[];

    if (!files?.length) {
      return res.status(400).json({
        error: "No files uploaded",
      });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const extractedText =
          await extractTextFromImage(file);

        return {
          fileName: file.originalname,
          extractedText,
        };
      })
    );

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Failed to process image",
    });
  }
};