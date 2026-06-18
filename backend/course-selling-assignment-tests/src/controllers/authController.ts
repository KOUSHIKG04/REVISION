import type { Request, Response } from "express";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, name, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: role || "STUDENT",
    });

    return res.status(200).json({
      message: "User signed up successfully!",
    });
  } catch (error) {
    return res.status(409).json({
      error: "Email already exists",
    });
  }
};


export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
