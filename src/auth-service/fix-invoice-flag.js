import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./models/User.js";

await mongoose.connect(process.env.MONGO_URI);
const result = await User.updateOne(
  { _id: "6a758f8c9495ac1d3be09fcf" },
  { $set: { hasUnpaidInvoice: false } }
);
console.log("User invoice flag cleared:", result.matchedCount, result.modifiedCount);
process.exit();
