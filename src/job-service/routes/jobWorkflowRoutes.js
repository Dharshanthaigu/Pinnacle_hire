import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { verifyJob, approveJob, confirmJob, finalizeJobHandler , acceptJob, payInvoice } from "../controllers/jobWorkflowController.js";

const router = Router();

router.patch("/:id/verify", requireAuth, verifyJob);
router.patch("/:id/approve", requireAuth, approveJob);
router.patch("/:id/confirm", requireAuth, confirmJob);
router.patch("/:id/finalize", requireAuth, finalizeJobHandler);
router.patch("/:id/accept", requireAuth, acceptJob);
router.patch("/:id/pay-invoice", requireAuth, payInvoice);

export default router;