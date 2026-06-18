import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    return res.status(409).json({
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
      email,
      password: hashedPassword,
      phone,
      role: role || "CUSTOMER",
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
      role: newUser.role,
      phone: newUser.phone,
    },
    error: null,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
});
