import { z } from "zod";

export const dailyWageSchema = z.object({
  trade: z.string().min(2),
  yearsInTrade: z.number().min(0),
  toolsOwned: z.array(z.string()).default([]),
  languagesSpoken: z.array(z.string()).min(1),
  availableDays: z.array(z.string()).min(1),
  availableHours: z.object({ start: z.string(), end: z.string() }),
  serviceRadiusKm: z.number().positive(),
  pastJobPhotos: z.array(z.string()).default([]),
  emergencyContact: z.object({ name: z.string(), phone: z.string() }),
});