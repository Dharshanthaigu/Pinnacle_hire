import { Router } from "express";
import { createJob, listJobs, getJob, updateJob, deleteJob } from "../controllers/jobController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema } from "../validators/jobValidators.js";
import { requireCompleteProfile } from "../middleware/requireCompleteProfile.js";

const router = Router();
router.get("/", requireAuth, requireCompleteProfile, listJobs);
router.get("/:id", requireAuth, requireCompleteProfile, getJob);
router.post("/", requireAuth, validate(createJobSchema), createJob);
router.patch("/:id", requireAuth, updateJob);
router.delete("/:id", requireAuth, deleteJob);

export default router;