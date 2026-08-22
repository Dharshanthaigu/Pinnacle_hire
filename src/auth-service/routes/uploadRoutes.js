import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadFile, downloadFile } from "../controllers/uploadController.js";

const router = Router();

router.post("/", requireAuth, upload.single("file"), uploadFile);
router.get("/:fileId", downloadFile);

export default router;
