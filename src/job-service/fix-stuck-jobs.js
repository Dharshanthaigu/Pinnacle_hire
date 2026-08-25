import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Job from "./models/Job.js";

await mongoose.connect(process.env.MONGO_URI);
const result = await Job.updateMany(
  { postedBy: "6a758f8c9495ac1d3be09fcf", status: "awaiting_payment" },
  { $set: { status: "completed", "commission.paid": true } }
);
console.log("Fixed jobs:", result.matchedCount, result.modifiedCount);
process.exit();
