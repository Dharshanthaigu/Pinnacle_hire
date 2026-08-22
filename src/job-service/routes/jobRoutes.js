import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema } from "../validators/jobValidators.js";
import { requireCompleteProfile } from "../middleware/requireCompleteProfile.js";
import { listJobs, getJob, updateJob, deleteJob, listMyJobs } from "../controllers/jobController.js";

import {
  createJob,
  acceptJob,
  getSeekerProfile,
  acceptCandidate,
  startWork,
  reviewCandidate,
  scheduleMeeting,
  confirmAttendance,
  verifyJob,
  approveJob,
  confirmJob,
  submitProof,
  payInvoice,
} from "../controllers/jobWorkflowController.js";

const router = Router();

router.get("/", listJobs);
router.get("/mine", requireAuth, listMyJobs);
router.get("/:id", getJob);

router.post("/", requireAuth, validate(createJobSchema), createJob);
//router.post("/", requireAuth, /* validate(createJobSchema), */ createJob);
router.patch("/:id", requireAuth, updateJob);
router.delete("/:id", requireAuth, deleteJob);

router.patch("/:id/accept", requireAuth, acceptJob);
router.get("/:id/seeker-profile", requireAuth, getSeekerProfile);

router.patch("/:id/accept-candidate", requireAuth, acceptCandidate);
router.patch("/:id/start-work", requireAuth, startWork);

router.patch("/:id/review-candidate", requireAuth, reviewCandidate);
router.patch("/:id/schedule-meeting", requireAuth, scheduleMeeting);
router.patch("/:id/confirm-attendance", requireAuth, confirmAttendance);
// confirm-ready route REMOVED - no longer exists, matches jobWorkflowController.js.

router.patch("/:id/verify", requireAuth, verifyJob);
router.patch("/:id/approve", requireAuth, approveJob);

router.patch("/:id/confirm", requireAuth, confirmJob);
// finalize route REMOVED - folded into confirmJob, matches jobWorkflowController.js.

router.post("/:id/submit-proof", requireAuth, submitProof);
router.patch("/:id/pay-invoice", requireAuth, payInvoice);

export default router;
