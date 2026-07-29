import fetch from "node-fetch";
import Job from "../models/Job.js";
import mongoose from "mongoose";
import { runVerification } from "../services/verificationService.js";
import { approveByHost, confirmByParty } from "../services/approvalService.js";
import { finalizeJob } from "../services/settlementService.js";
import { enqueueReputationUpdate } from "../queues/reputationQueue.js";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export const createJob = async (req, res, next) => {
  try {
    if (req.user.role !== "poster") {
      return res.status(403).json({ error: "Only posters can create jobs" });
    }

    const invoiceRes = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/invoice-status/${req.user.id}`, {
      headers: {
        Authorization: req.headers.authorization,
        "x-request-id": req.id,
      },
    });
    if (invoiceRes.ok) {
      const { hasUnpaidInvoice } = await invoiceRes.json();
      if (hasUnpaidInvoice) {
        return res.status(402).json({ error: "Outstanding invoice must be paid before posting new jobs" });
      }
    }

    const { jobTitle, description, category, jobType, workflowType, location, salary } = req.body;

    const job = await Job.create({
      jobTitle,
      description,
      category,
      jobType,
      workflowType,
      location,
      salary,
      postedBy: req.user.id,
      expiresAt: new Date(Date.now() + TWO_WEEKS_MS),
    });

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

export const verifyJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    await runVerification(job, job.acceptedBy, req.headers.authorization, req.id);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const approveJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can approve" });
    }

    approveByHost(job);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const confirmJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    confirmByParty(job, req.user.role);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const acceptJob = async (req, res, next) => {
  try {
    if (req.user.role !== "seeker") {
      return res.status(403).json({ error: "Only seekers can accept jobs" });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, status: "open", expiresAt: { $gt: new Date() } },
      {
        $set: { acceptedBy: req.user.id, status: "accepted" },
        $push: { statusHistory: { status: "accepted", changedBy: req.user.id } },
      },
      { new: true }
    );

    if (!job) {
      const exists = await Job.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: "Job not found" });
      return res.status(409).json({ error: "Job is no longer available for acceptance" });
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const finalizeJobHandler = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const isSeeker = job.acceptedBy && String(job.acceptedBy) === req.user.id;
    const isPoster = String(job.postedBy) === req.user.id;
    if (!isSeeker && !isPoster) {
      return res.status(403).json({ error: "Not authorized to finalize this job" });
    }

    if (job.status === "completed") {
      return res.status(409).json({ error: "Job has already been finalized", job });
    }

    finalizeJob(job);
    await job.save();
    await enqueueReputationUpdate(job);

    res.json(job);
  } catch (err) {
    next(err);
  }
};
export const submitProof = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.acceptedBy && String(job.acceptedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the accepted seeker can submit proof" });
    }
    if (job.status !== "awaiting_proof") {
      return res.status(409).json({ error: "Job is not awaiting proof" });
    }

    const { url, note } = req.body;
    job.proof = { url, note, submittedAt: new Date() };
    await job.save();

    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const payInvoice = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can pay this invoice" });
    }
    if (!job.commission || job.commission.paid) {
      return res.status(409).json({ error: "No outstanding invoice on this job" });
    }

    job.commission.paid = true;
    await job.save();

    const stillOwing = await Job.exists({
      postedBy: req.user.id,
      "commission.paid": false,
      "commission.invoiced": true,
    });

    if (!stillOwing) {
      await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/invoice-status/${req.user.id}/clear`, {
        method: "PATCH",
        headers: {
          Authorization: req.headers.authorization,
          "x-request-id": req.id,
        },
      });
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
}; 