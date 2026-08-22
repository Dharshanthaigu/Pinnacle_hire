import { Readable } from "stream";
import mongoose from "mongoose";
import { getBucket } from "../config/gridfs.js";

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: { uploadedBy: req.user.id },
    });
    Readable.from(req.file.buffer)
      .pipe(uploadStream)
      .on("error", (err) => next(err))
      .on("finish", () => {
        res.status(201).json({
          fileId: uploadStream.id.toString(),
          filename: req.file.originalname,
          url: `/api/uploads/${uploadStream.id.toString()}`,
        });
      });
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) {
      return res.status(404).json({ error: "File not found" });
    }
    res.set("Content-Type", files[0].contentType || "application/octet-stream");
    bucket.openDownloadStream(fileId)
      .on("error", () => res.status(404).json({ error: "File not found" }))
      .pipe(res);
  } catch (err) {
    next(err);
  }
};
