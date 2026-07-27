import { z } from "zod";

export const midLevelSchema = z.object({
  currentTitle: z.string().min(2),
  totalExperienceYears: z.number().min(0),
  noticePeriodDays: z.number().min(0),
  expectedSalary: z.object({ amount: z.number().positive(), negotiable: z.boolean() }),
  educationLevel: z.string(),
  primarySkills: z.array(z.string()).min(1),
  secondarySkills: z.array(z.string()).default([]),
  resumeUrl: z.string().url(),
  willingToRelocate: z.boolean(),
  employmentType: z.array(z.string()).min(1),
});