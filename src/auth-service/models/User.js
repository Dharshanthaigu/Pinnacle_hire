import mongoose from "mongoose";
import dailyWageProfileSchema from "./profiles/dailyWageProfile.js";
import midLevelProfileSchema from "./profiles/midLevelProfile.js";
import leadershipProfileSchema from "./profiles/leadershipProfile.js";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["seeker", "poster"], required: true },
    location: {
      lat: Number,
      lng: Number,
    },
    skills: [String],
    reputationScore: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    ghostCount: { type: Number, default: 0 },
    hasUnpaidInvoice: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    professionalInfo: {
      workCategory: { type: String, enum: ["daily_wage", "mid_level", "leadership"] },
      dailyWage: dailyWageProfileSchema,
      midLevel: midLevelProfileSchema,
      leadership: leadershipProfileSchema,
    },
    companyProfile: {
      companyName: String,
      industry: String,
      companySize: String,
      companyAddress: String,
      website: String,
    },
    verificationStatus: {
      identityVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
    },
    bio: String,
    profilePhotoUrl: String,
    disputeCount: { type: Number, default: 0 },
    responseRatePercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export default mongoose.model("User", userSchema);