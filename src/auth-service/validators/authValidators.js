import {z} from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(7, "Valid phone is required"),
  role: z.enum(["seeker", "poster"], {
    error: "Role must be seeker or poster",
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});