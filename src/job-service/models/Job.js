import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true }, // e.g. plumbing, IT, sales
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "gig", "contract", "one-time"],
      required: true,
    },
    workflowType: {
      type: String,
      enum: ["daily_wage", "mid_level", "leadership"],
      required: true,
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    salary: {
      amount: { type: Number, required: true, min: 0 },
      type: { type: String, enum: ["fixed", "hourly", "monthly", "negotiable"], required: true },
    },

    status: {
      type: String,
      enum: [
        "open",
        "accepted",
        "verifying",       // resume/reference routed, awaiting host response
        "confirmed",       // host approved
        "connecting",      // meeting link stage (mid/leadership only)
        "awaiting_proof",  // work started, proof not yet submitted (daily_wage)
        "completed",
        "disputed",
        "expired",
        "cancelled",
      ],
      default: "open",
    },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],

    // --- Step 3/5: verification & relay (mid_level, leadership) ---
    verification: {
      resumeUrl: String,
      referenceLetterUrl: String,
      respondBy: Date,
      reminderSent: { type: Boolean, default: false },
    },

    // --- Step 6/7: connection & confirmation (mid_level, leadership) ---
    connection: {
      contactRevealed: { type: Boolean, default: false },
      meetingLink: String,
      scheduledAt: Date,
      seekerConfirmedCall: { type: Boolean, default: false },
      posterConfirmedCall: { type: Boolean, default: false },
    },

    // --- Step 7/8/9: proof & completion (daily_wage) ---
    proof: {
      url: String,
      note: String,
      submittedAt: Date,
    },
    seekerConfirmed: { type: Boolean, default: false },
    posterConfirmed: { type: Boolean, default: false },

    // --- Step 8: commission (all three, different shape) ---
    commission: {
      type: { type: String, enum: ["percentage", "flat"] },
      amount: Number,
      invoiced: { type: Boolean, default: false },
      paid: { type: Boolean, default: false },
    },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ workflowType: 1, status: 1 });

export default mongoose.model("Job", jobSchema);