import mongoose from "mongoose";

let bucket = null;

export function getBucket() {
  if (!bucket) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Cannot get GridFS bucket before MongoDB is connected");
    }
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
  }
  return bucket;
}
