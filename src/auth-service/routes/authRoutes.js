import { Router } from "express";
import {
  register,
  login,
  completeProfile,
  getProfileStatus,
  getCandidateMatchInfo,
  getInvoiceStatus,
  clearUnpaidInvoice,
  setUnpaidInvoice,
  incrementReputation,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

const router = Router();

// Public / user-facing
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/complete-profile", requireAuth, completeProfile);

// Internal — called by job-service
router.get("/internal/profile-status/:userId", requireAuth, getProfileStatus);
router.get("/internal/candidate-match-info/:userId", requireAuth, getCandidateMatchInfo);
router.get("/internal/invoice-status/:userId", requireAuth, getInvoiceStatus);
router.patch("/internal/invoice-status/:userId/clear", requireAuth, clearUnpaidInvoice);
router.patch("/internal/invoice-status/:userId/set", requireAuth, setUnpaidInvoice);
router.patch("/internal/reputation/:userId/increment", requireAuth, incrementReputation);

export default router;