import fetch from "node-fetch";
import Job from "../models/Job.js";
import mongoose from "mongoose";
import { runVerification } from "../services/verificationService.js";
import { approveByHost, confirmByParty } from "../services/approvalService.js";
import { finalizeJob, updateReputation } from "../services/settlementService.js";



const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export const createJob = async (req, res, next) => {
  try {
    if (req.user.role !== "poster") {
      return res.status(403).json({ error: "Only posters can create jobs" });
    }

    const invoiceRes = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/invoice-status/${req.user.id}`, {
      headers: { Authorization: req.headers.authorization, "x-request-id": req.id },
    });
    if (invoiceRes.ok) {
      const { hasUnpaidInvoice } = await invoiceRes.json();
      if (hasUnpaidInvoice) {
        return res.status(402).json({ error: "Outstanding invoice must be paid before posting new jobs" });
      }
    }

    const {
      jobTitle, description, category, jobType, workflowType, location, salary,
      minExperience, numberOfOpenings, applicationDeadline, workMode, jobContactPhone, postingAttested,
      foodProvided, transportationProvided, workStartDate, workEndDate, workingHoursStart, workingHoursEnd,
      instructionsText, instructionsDurationMinutes,
      requiredSkills, reviewTimerDurationMinutes,
      minClientProjectExperience, minTeamSizeExperience,
      minDirectReportsToBoard, requiredDomainExpertise,
    } = req.body;

    if (minExperience == null) return res.status(400).json({ error: "Experience is required" });
    if (!numberOfOpenings || numberOfOpenings < 1) return res.status(400).json({ error: "Number of openings must be at least 1" });
    if (!applicationDeadline) return res.status(400).json({ error: "Application deadline is required" });
    if (!workMode) return res.status(400).json({ error: "Work mode is required" });
    if (!jobContactPhone) return res.status(400).json({ error: "Job contact phone is required" });
    if (!postingAttested) return res.status(400).json({ error: "You must confirm this posting is real and active" });
    if (!applicationDeadline) return res.status(400).json({ error: "Application deadline is required" });

    const deadlineDate = new Date(applicationDeadline);
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    if (isNaN(deadlineDate.getTime()) || deadlineDate < tomorrowStart) {
      return res.status(400).json({ error: "Application deadline must start from tomorrow" });
    }


    let tierFields = {};

    if (workflowType === "daily_wage") {
      if (!instructionsText || !instructionsDurationMinutes || Number(instructionsDurationMinutes) <= 0) {
        return res.status(400).json({ error: "Instructions text and a positive timer duration are required" });
      }
      if (!workingHoursStart || !workingHoursEnd) {
        return res.status(400).json({ error: "Allocated working time is required" });
      }
      if (!workStartDate || !workEndDate) {
        return res.status(400).json({ error: "Work start date and end date are required" });
      }

      const startDate = new Date(workStartDate);
      const endDate = new Date(workEndDate);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: "Work start date is invalid" });
      }
      if (startDate <= todayEnd) {
        return res.status(400).json({ error: "Work start date must be a future date - it cannot be today" });
      }
      if (isNaN(endDate.getTime()) || endDate < startDate) {
        return res.status(400).json({ error: "Work end date cannot be before the start date" });
      }

      tierFields = {
        foodProvided: !!foodProvided,
        transportationProvided: !!transportationProvided,
        workStartDate: startDate,
        workEndDate: endDate,
        workingHours: { start: workingHoursStart, end: workingHoursEnd },
        instructions: { text: instructionsText, durationMinutes: Number(instructionsDurationMinutes) },
      };
    } else {
      if (!requiredSkills || requiredSkills.length === 0) {
        return res.status(400).json({ error: "Skills are required" });
      }
      tierFields = {
        requiredSkills,
        ...(reviewTimerDurationMinutes ? { reviewTimer: { durationMinutes: Number(reviewTimerDurationMinutes) } } : {}),
      };
      if (workflowType === "mid_level") {
        if (minClientProjectExperience == null || minTeamSizeExperience == null) {
          return res.status(400).json({ error: "Minimum client-project experience and team size experience are required for mid-level jobs" });
        }
        tierFields.minClientProjectExperience = Number(minClientProjectExperience);
        tierFields.minTeamSizeExperience = Number(minTeamSizeExperience);
      }
      if (workflowType === "leadership") {
        if (minDirectReportsToBoard == null) {
          return res.status(400).json({ error: "Minimum direct reports to board is required for leadership jobs" });
        }
        tierFields.minDirectReportsToBoard = Number(minDirectReportsToBoard);
        if (requiredDomainExpertise && requiredDomainExpertise.length > 0) {
          tierFields.requiredDomainExpertise = requiredDomainExpertise;
        }
      }
    }

    const job = await Job.create({
      jobTitle, description, category, jobType, workflowType, location, salary,
      postedBy: req.user.id,
      expiresAt: new Date(Date.now() + TWO_WEEKS_MS),
      minExperience: Number(minExperience),
      numberOfOpenings: Number(numberOfOpenings),
      applicationDeadline: new Date(applicationDeadline),
      workMode,
      jobContactPhone,
      postingAttested: true,
      ...tierFields,
    });

    res.status(201).json(job);
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

export const getSeekerProfile = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can view the candidate profile" });
    }
    if (!job.acceptedBy) {
      return res.status(409).json({ error: "No candidate has accepted this job yet" });
    }
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/candidate-profile/${job.acceptedBy}`, {
      headers: { Authorization: req.headers.authorization, "x-request-id": req.id },
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Unable to fetch candidate profile" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const acceptCandidate = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can accept the candidate" });
    }
    if (job.status !== "accepted") {
      return res.status(409).json({ error: "Job must be in accepted status to accept the candidate" });
    }
    job.status = "confirmed";
    const now = new Date();
    if (job.workflowType === "daily_wage" && job.instructions?.durationMinutes) {
      job.instructions.submittedAt = now;
      job.instructions.readyAt = new Date(now.getTime() + job.instructions.durationMinutes * 60000);
    }
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const startWork = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!job.acceptedBy || String(job.acceptedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the accepted seeker can start work" });
    }
    if (job.status !== "confirmed") {
      return res.status(409).json({ error: "Job is not ready to start" });
    }
    if (!job.instructions?.readyAt || new Date() < new Date(job.instructions.readyAt)) {
      return res.status(409).json({ error: "Timer has not finished yet" });
    }
    job.status = "awaiting_proof";
    await job.save();
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
    const { fileId, filename, note } = req.body;
    if (!fileId || !filename) {
      return res.status(400).json({ error: "A proof file upload (fileId and filename) is required" });
    }
    job.proof = { fileId, filename, note: note || "", submittedAt: new Date() };
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const reviewCandidate = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can review the candidate" });
    }
    if (job.workflowType === "daily_wage") {
      return res.status(400).json({ error: "This step does not apply to daily wage jobs" });
    }
    if (job.status !== "confirmed") {
      return res.status(409).json({ error: "Poster must accept the candidate before reviewing them" });
    }
    const { posterEmail } = req.body;
    if (!posterEmail) {
      return res.status(400).json({ error: "posterEmail is required" });
    }
    job.interview = job.interview || {};
    job.interview.posterEmail = posterEmail;
    job.interview.reviewedAt = new Date();
    job.status = "verifying";
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const scheduleMeeting = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the job poster can schedule the meeting" });
    }
    if (job.workflowType === "daily_wage") {
      return res.status(400).json({ error: "This step does not apply to daily wage jobs" });
    }
    if (job.status !== "verifying" || !job.interview?.reviewedAt) {
      return res.status(409).json({ error: "Candidate must be reviewed before scheduling a meeting" });
    }
    const { meetingDate, meetingLink } = req.body;
    if (!meetingDate || !meetingLink) {
      return res.status(400).json({ error: "meetingDate and meetingLink are required" });
    }
    job.interview.meetingDate = new Date(meetingDate);
    job.interview.meetingLink = meetingLink;
    job.interview.scheduledAt = new Date();
    job.status = "connecting";
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// Seeker confirms they'll attend. This alone is now enough - no separate
// "confirmReady" timer step gated by proximity to the meeting time anymore.
export const confirmAttendance = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!job.acceptedBy || String(job.acceptedBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the accepted seeker can confirm attendance" });
    }
    if (job.status !== "connecting" || !job.interview?.meetingLink) {
      return res.status(409).json({ error: "No scheduled meeting to confirm" });
    }
    job.interview.seekerAttendConfirmedAt = new Date();
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// confirmReady has been REMOVED entirely - do not add it back.
// Its old job (a 1-hour-before-meeting readiness timer) is gone.
// confirmAttendance above is now the seeker's only step before confirmJob.

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

// Single confirm-completion endpoint, used by BOTH roles - seeker first,
// poster second. Auto-finalizes the moment both are confirmed. No separate
// /finalize route or button exists anymore.
export const confirmJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const isPoster = String(job.postedBy) === req.user.id;
    const isSeeker = job.acceptedBy && String(job.acceptedBy) === req.user.id;
    if (!isPoster && !isSeeker) {
      return res.status(403).json({ error: "Only the job's poster or accepted seeker can confirm" });
    }

    if (job.workflowType === "daily_wage") {
      if (job.status !== "awaiting_proof") {
        return res.status(409).json({ error: "Job must be awaiting proof before confirming completion" });
      }
      if (isSeeker && !job.proof?.fileId) {
        return res.status(409).json({ error: "Submit proof before confirming completion" });
      }
      if (isPoster && !job.seekerConfirmed) {
        return res.status(409).json({ error: "Seeker must confirm completion before the poster can" });
      }
    } else {
      if (job.status !== "connecting") {
        return res.status(409).json({ error: "Job must be in the connecting stage before confirming completion" });
      }
      // Only attendance confirmation is required now - the old readiness
      // timer step (finalConfirmedAt) has been removed from this gate.
      if (!job.interview?.seekerAttendConfirmedAt) {
        return res.status(409).json({ error: "Seeker must confirm meeting attendance first" });
      }
      if (isPoster && !job.connection?.seekerConfirmedCall) {
        return res.status(409).json({ error: "Seeker must confirm completion before the poster can" });
      }
    }

    confirmByParty(job, req.user.role);

    const bothConfirmed =
      job.workflowType === "daily_wage"
        ? job.seekerConfirmed && job.posterConfirmed
        : job.connection.seekerConfirmedCall && job.connection.posterConfirmedCall;

    if (bothConfirmed) {
      finalizeJob(job);
    }

    await job.save();

    if (job.status === "completed") {
      try {
        await updateReputation(job, req.headers.authorization);
      } catch (repErr) {
        console.error("Reputation/invoice update failed:", repErr.message);
      }
    }

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
    if (!job.commission?.amount || job.commission.paid) {
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
        headers: { Authorization: req.headers.authorization, "x-request-id": req.id },
      });
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
};