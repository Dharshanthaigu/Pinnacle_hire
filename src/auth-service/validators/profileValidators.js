import { z } from "zod";
import { dailyWageSchema } from "./profiles/dailyWageValidator.js";
import { midLevelSchema } from "./profiles/midLevelValidator.js";
import { leadershipSchema } from "./profiles/leadershipValidator.js";

export const completeProfileSchema = z.discriminatedUnion("workCategory", [
  z.object({ workCategory: z.literal("daily_wage"), data: dailyWageSchema }),
  z.object({ workCategory: z.literal("mid_level"), data: midLevelSchema }),
  z.object({ workCategory: z.literal("leadership"), data: leadershipSchema }),
]);