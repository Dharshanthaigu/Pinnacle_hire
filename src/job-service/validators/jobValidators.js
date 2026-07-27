import { z } from "zod";

export const createJobSchema = z.object({
  jobTitle: z.string().min(3, "Job title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  jobType: z.enum(["full-time", "part-time", "gig", "contract", "one-time"], {
    error: "Invalid job type",
  }),
  workflowType: z.enum(["daily_wage", "mid_level", "leadership"], {
    error: "Invalid workflow type",
  }),
  location: z.object({
    address: z.string().min(3, "Address is required"),
    lat: z.number(),
    lng: z.number(),
  }),
  salary: z.object({
    amount: z.number().positive("Salary amount must be positive"),
    type: z.enum(["fixed", "hourly", "negotiable"], {
      error: "Invalid salary type",
    }),
  }),
});