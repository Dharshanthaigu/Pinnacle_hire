import Job from "../models/Job.js";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export const createJob = async (req, res, next) => {
  try {
    if (req.user.role !== "poster") {
      return res.status(403).json({ error: "Only posters can create jobs" });
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

export const listJobs = async (req, res, next) => {
  try {
    const { status = "open", category, jobType } = req.query;
    const filter = { status };
    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

export const listMyJobs = async (req, res, next) => {
  try {
    const filter = req.user.role === "poster"
      ? { postedBy: req.user.id }
      : { acceptedBy: req.user.id };
    const jobs = await Job.find(filter).sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Not your job to edit" });
    }
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.postedBy) !== req.user.id) {
      return res.status(403).json({ error: "Not your job to delete" });
    }
    await job.deleteOne();
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
};