import mongoose from "mongoose";

const midLevelProfileSchema = new mongoose.Schema(
  {
    currentTitle: { type: String, required: true },
    totalExperienceYears: { type: Number, required: true, min: 0 },
    noticePeriodDays: { type: Number, required: true, min: 0 },
    expectedSalary: {
      amount: { type: Number, required: true, min: 0 },
      negotiable: { type: Boolean, required: true },
    },
    educationLevel: { type: String, required: true },
    primarySkills: { type: [String], required: true },
    secondarySkills: { type: [String], default: [] },
    resumeUrl: { type: String, required: true },
    willingToRelocate: { type: Boolean, required: true },
    employmentType: { type: [String], required: true },
  },
  { _id: false }
);

export default midLevelProfileSchema;