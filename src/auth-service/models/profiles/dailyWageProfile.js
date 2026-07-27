import mongoose from "mongoose";

const dailyWageProfileSchema = new mongoose.Schema(
  {
    trade: { type: String, required: true },
    yearsInTrade: { type: Number, required: true, min: 0 },
    toolsOwned: { type: [String], default: [] },
    languagesSpoken: { type: [String], required: true },
    availableDays: { type: [String], required: true },
    availableHours: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    serviceRadiusKm: { type: Number, required: true, min: 0 },
    pastJobPhotos: { type: [String], default: [] },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  { _id: false }
);

export default dailyWageProfileSchema;