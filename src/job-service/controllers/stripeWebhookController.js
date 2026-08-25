import Job from "../models/Job.js";
import stripe from "../services/stripeService.js";
import { constructWebhookEvent } from "../services/stripeService.js";
import { markPaidAndComplete, updateReputation, clearInvoiceIfFullyPaid } from "../services/settlementService.js";

export const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("WEBHOOK RECEIVED - event type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const jobId = session.metadata?.jobId;
    if (jobId) {
      try {
        const job = await Job.findById(jobId);
        console.log("WEBHOOK - about to check job for jobId:", jobId);
        console.log("WEBHOOK - jobId:", jobId, "job found:", !!job, "already paid:", job?.commission?.paid);
        if (job && !job.commission.paid) {
          markPaidAndComplete(job);
          await job.save();
          try {
            await updateReputation(job, `x-internal-key ${process.env.INTERNAL_SERVICE_KEY}`);
          } catch (repErr) {
            console.error("Reputation update failed:", repErr.message);
          }
          try {
            await clearInvoiceIfFullyPaid(job, `x-internal-key ${process.env.INTERNAL_SERVICE_KEY}`);
          } catch (clearErr) {
            console.error("Invoice clear failed:", clearErr.message);
          }
        }
      } catch (err) {
        console.error("Failed to process Stripe webhook for job", jobId, err.message);
      }
    }
  }

  res.json({ received: true });
};

export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.json({ paid: false });
    }

    const jobId = session.metadata?.jobId;
    const job = await Job.findById(jobId);
        console.log("WEBHOOK - jobId:", jobId, "job found:", !!job, "already paid:", job?.commission?.paid);
        if (job && !job.commission.paid) {
      markPaidAndComplete(job);
      await job.save();
      try {
        await updateReputation(job, req.headers.authorization);
      } catch (repErr) {
        console.error("Reputation update failed:", repErr.message);
      }
      try {
        await clearInvoiceIfFullyPaid(job, req.headers.authorization);
      } catch (clearErr) {
        console.error("Invoice clear failed:", clearErr.message);
      }
    }

    res.json({ paid: true });
  } catch (err) {
    next(err);
  }
};
