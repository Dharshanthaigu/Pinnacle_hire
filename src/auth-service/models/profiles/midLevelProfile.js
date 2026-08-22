import mongoose from "mongoose";

export const EDUCATION_LEVELS = ["high_school", "diploma", "bachelors", "masters", "phd", "other"];
export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "freelance", "internship"];
export const AVAILABILITY_OPTIONS = ["immediately", "2_weeks", "1_month", "1_plus_month"];

const midLevelProfileSchema = new mongoose.Schema(
  {
    // Primary
    currentTitle: { type: String, required: true },
    totalExperienceYears: { type: Number, required: true, min: 0 },
    industry: { type: String, required: true },
    primarySkills: { type: [String], required: true },
    educationLevel: { type: String, required: true, enum: EDUCATION_LEVELS },
    expectedSalary: {
      amount: { type: Number, required: true, min: 0 },
      negotiable: { type: Boolean, required: true },
    },
    availabilityToJoin: { type: String, required: true, enum: AVAILABILITY_OPTIONS },
    resume: {
      fileId: { type: String, required: true },
      filename: { type: String, required: true },
    },
    headline: { type: String, required: true, maxlength: 120 },

    // Secondary
    achievement: { type: String },
    location: { type: String },
    willingToRelocate: { type: Boolean, default: false },
    certifications: { type: [String], default: [] },

    // Kept from before
    secondarySkills: { type: [String], default: [] },
    employmentType: { type: [String], required: true, enum: EMPLOYMENT_TYPES },
  },
  { _id: false }
);

export default midLevelProfileSchema;
