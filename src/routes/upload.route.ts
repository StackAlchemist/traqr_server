import { Router } from "express";
import multer from "multer";
import { uploadFiles } from "../controllers/upload.controller";


const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

router.post("/", upload.array("files", 10), uploadFiles);

export default router;