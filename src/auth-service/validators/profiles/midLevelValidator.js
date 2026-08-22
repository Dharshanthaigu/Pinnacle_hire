import { z } from "zod";
import { EDUCATION_LEVELS, EMPLOYMENT_TYPES, AVAILABILITY_OPTIONS } from "../../models/profiles/midLevelProfile.js";

export const midLevelSchema = z.object({
  currentTitle: z.string().min(2),
  totalExperienceYears: z.number().min(0),
  industry: z.string().min(2),
  primarySkills: z.array(z.string()).min(1),
  educationLevel: z.enum(EDUCATION_LEVELS),
  expectedSalary: z.object({ amount: z.number().positive(), negotiable: z.boolean() }),
  availabilityToJoin: z.enum(AVAILABILITY_OPTIONS),
  resume: z.object({ fileId: z.string(), filename: z.string() }),
  headline: z.string().min(2).max(120),

  achievement: z.string().optional(),
  location: z.string().optional(),
  willingToRelocate: z.boolean().default(false),
  certifications: z.array(z.string()).default([]),

  secondarySkills: z.array(z.string()).default([]),
  employmentType: z.array(z.enum(EMPLOYMENT_TYPES)).min(1),
});
