import { z } from "zod";

export const leadershipSchema = z.object({
  currentTitle: z.string().min(2),
  yearsInLeadership: z.number().min(0),
  teamSizeManaged: z.number().min(0),
  industryFocus: z.array(z.string()).min(1),
  keyAchievements: z.array(z.string()).min(1),
  referenceContacts: z.array(
    z.object({
      name: z.string(),
      relationship: z.string(),
      contact: z.string(),
      letterUrl: z.string().url(),
    })
  ).min(1),
  compensationExpectation: z.object({
    base: z.number(),
    bonus: z.number(),
    equity: z.boolean(),
    negotiable: z.boolean(),
  }),
  availableFrom: z.string(), // ISO date string
});