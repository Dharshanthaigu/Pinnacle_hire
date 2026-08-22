import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
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
        "open", "accepted", "instructions_sent", "verifying", "confirmed",
        "connecting", "awaiting_proof", "completed", "disputed", "expired", "cancelled",
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

    verification: {
      resumeUrl: String,
      referenceLetterUrl: String,
      respondBy: Date,
      reminderSent: { type: Boolean, default: false },
    },

    minExperience: { type: Number, required: true, min: 0 },
    numberOfOpenings: { type: Number, required: true, min: 1 },
    applicationDeadline: { type: Date, required: true },
    workMode: { type: String, enum: ["remote", "hybrid", "on-site"], required: true },
    jobContactPhone: { type: String, required: true },
    postingAttested: { type: Boolean, required: true },

    foodProvided: Boolean,
    transportationProvided: Boolean,
    workStartDate: Date,
    workEndDate: Date,
    workingHours: {
      start: String,
      end: String,
    },
    instructions: {
      text: String,
      durationMinutes: Number,
      submittedAt: Date,
      readyAt: Date,
    },

    requiredSkills: [String],
    reviewTimer: {
      durationMinutes: Number,
      submittedAt: Date,
      readyAt: Date,
    },

    minClientProjectExperience: Number,
    minTeamSizeExperience: Number,

    minDirectReportsToBoard: Number,
    requiredDomainExpertise: [String],

    interview: {
      posterEmail: String,
      reviewedAt: Date,
      meetingDate: Date,
      meetingLink: String,
      scheduledAt: Date,
      seekerAttendConfirmedAt: Date,
      finalConfirmedAt: Date,
    },

    connection: {
      contactRevealed: { type: Boolean, default: false },
      meetingLink: String,
      scheduledAt: Date,
      seekerConfirmedCall: { type: Boolean, default: false },
      posterConfirmedCall: { type: Boolean, default: false },
    },

    proof: {
      fileId: String,
      filename: String,
      note: String,
      submittedAt: Date,
    },
    seekerConfirmed: { type: Boolean, default: false },
    posterConfirmed: { type: Boolean, default: false },

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

jobSchema.pre("validate", function () {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (this.workflowType === "daily_wage" && this.workStartDate) {
    if (new Date(this.workStartDate) <= todayEnd) {
      throw new Error("workStartDate must be a future date, not today or earlier");
    }
  }

  if (this.applicationDeadline) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (new Date(this.applicationDeadline) < todayStart) {
      throw new Error("applicationDeadline cannot be in the past");
    }
  }
});

jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ workflowType: 1, status: 1 });

export default mongoose.model("Job", jobSchema);