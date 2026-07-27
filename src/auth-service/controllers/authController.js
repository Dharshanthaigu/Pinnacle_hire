import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { completeProfileSchema } from "../validators/profileValidators.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, phone, role });

    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const completeProfile = async (req, res, next) => {
  try {
    const parsed = completeProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const { workCategory, data } = parsed.data;
    const key = { daily_wage: "dailyWage", mid_level: "midLevel", leadership: "leadership" }[workCategory];

    const user = await User.findById(req.user.id);
    user.professionalInfo = { workCategory, [key]: data };
    user.profileComplete = true;
    await user.save();

    res.json({ message: "Profile completed", user });
  } catch (err) {
    next(err);
  }
};

// ---- Internal endpoints, called by job-service (not used by the frontend) ----

export const getProfileStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("profileComplete");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ profileComplete: user.profileComplete });
  } catch (err) {
    next(err);
  }
};

export const getCandidateMatchInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("location skills");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      location: user.location,
      skills: user.skills,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("hasUnpaidInvoice");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ hasUnpaidInvoice: user.hasUnpaidInvoice });
  } catch (err) {
    next(err);
  }
};

export const clearUnpaidInvoice = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { hasUnpaidInvoice: false });
    res.json({ message: "Invoice status cleared" });
  } catch (err) {
    next(err);
  }
};

export const setUnpaidInvoice = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { hasUnpaidInvoice: true });
    res.json({ message: "Invoice status set" });
  } catch (err) {
    next(err);
  }
};

export const incrementReputation = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      $inc: { completedJobs: 1, reputationScore: 1 },
    });
    res.json({ message: "Reputation updated" });
  } catch (err) {
    next(err);
  }
};