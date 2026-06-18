import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (existingUser) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "EMAIL_ALREADY_EXISTS",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertedUsers = await db
    .insert(users)
    .values({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: (role || "CUSTOMER").toUpperCase(),
    })
    .returning();

  const newUser = insertedUsers[0];

  if (!newUser) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "USER_CREATION_FAILED",
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.toLowerCase(),
      phone: newUser.phone,
    },
    error: null,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // const normalizedEmail = email.toLowerCase();

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "INVALID_CREDENTIALS",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "INVALID_CREDENTIALS",
    });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "1d" }
  );

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
      },
    },
    error: null,
  });
});
