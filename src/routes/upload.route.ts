import { Router } from "express";
import multer from "multer";
import { Request, Response } from "express";

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

router.post("/", upload.array("files", 10), async(req: Request, res: Response)=>{
    const files = req.files as Express.Multer.File[];

    if(!files?.length) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    res.json({
        success: true,
        message: `${files.length} file(s) received`,
        files: files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })),
    });
});

export default router;