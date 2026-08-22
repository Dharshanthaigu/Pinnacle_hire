import { z } from "zod";

export const companyProfileSchema = z.object({
  companyName: z.string().min(2),
  industry: z.string().min(2),
  companySize: z.string().min(1),
  companyAddress: z.string().min(2),
  website: z.string().url().optional(),
});
