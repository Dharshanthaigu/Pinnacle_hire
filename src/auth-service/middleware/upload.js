import multer from "multer"
import path from "path"
import { randomUUID } from "crypto"
import fs from "fs"

const UPLOAD_DIR = "uploads"

if(!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR,{recursive: true})
}

const storage = multer.diskStorage({
    destination: (req,file,cb) => cb(null,UPLOAD_DIR),
    filename: (req,file,cb) =>{
        const ext = path.extname(file.originalname)
        cb(null,`${randomUUID()}${ext}`)
    }
})

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const fileFilter = (req,file,cb) =>{
    if(!ALLOWED_MIME.has(file.mimetype)){
        return cb(new Error("Unsupported file type"))
    }
    cb(null,true)
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {fileSize: 10 * 1024 * 1024}
})