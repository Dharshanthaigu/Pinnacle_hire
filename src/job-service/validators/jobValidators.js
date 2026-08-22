import { z } from "zod";
export const createJobSchema = z.object({
  jobTitle: z.string().min(3, "Job title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  jobType: z.enum(["full-time", "part-time", "gig", "contract", "one-time"], { error: "Invalid job type" }),
  workflowType: z.enum(["daily_wage", "mid_level", "leadership"], { error: "Invalid workflow type" }),
  location: z.object({
    address: z.string().min(3, "Address is required"),
    lat: z.number(),
    lng: z.number(),
  }),
  salary: z.object({
    amount: z.number().positive("Salary amount must be positive"),
    type: z.enum(["fixed", "hourly", "negotiable"], { error: "Invalid salary type" }),
  }),

  minExperience: z.number().min(0),
  numberOfOpenings: z.number().min(1),
  applicationDeadline: z.string().min(1),
  workMode: z.enum(["remote", "hybrid", "on-site"]),
  jobContactPhone: z.string().min(6),
  postingAttested: z.literal(true, { error: "You must confirm this posting is real and active" }),

  foodProvided: z.boolean().optional(),
  transportationProvided: z.boolean().optional(),
  workStartDate: z.string().optional(),
  workEndDate: z.string().optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  instructionsText: z.string().optional(),
  instructionsDurationMinutes: z.number().optional(),

  requiredSkills: z.array(z.string()).optional(),
  reviewTimerDurationMinutes: z.number().positive().optional(),

  minClientProjectExperience: z.number().optional(),
  minTeamSizeExperience: z.number().optional(),

  minDirectReportsToBoard: z.number().optional(),
  requiredDomainExpertise: z.array(z.string()).optional(),
});
