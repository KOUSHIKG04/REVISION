import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.email("Invalid email format").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .optional(),
    role: z.enum(["CUSTOMER", "OWNER", "customer", "owner"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});
