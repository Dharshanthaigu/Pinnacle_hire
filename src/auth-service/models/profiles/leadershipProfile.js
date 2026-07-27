import mongoose from "mongoose";

const leadershipProfileSchema = new mongoose.Schema(
  {
    currentTitle: { type: String, required: true },
    yearsInLeadership: { type: Number, required: true, min: 0 },
    teamSizeManaged: { type: Number, required: true, min: 0 },
    industryFocus: { type: [String], required: true },
    keyAchievements: { type: [String], required: true },
    referenceContacts: {
      type: [
        {
          name: { type: String, required: true },
          relationship: { type: String, required: true },
          contact: { type: String, required: true },
          letterUrl: { type: String, required: true },
        },
      ],
      required: true,
    },
    compensationExpectation: {
      base: { type: Number, required: true },
      bonus: { type: Number, required: true },
      equity: { type: Boolean, required: true },
      negotiable: { type: Boolean, required: true },
    },
    availableFrom: { type: Date, required: true },
  },
  { _id: false }
);

export default leadershipProfileSchema;