import type { Request, Response } from "express";
import { db } from "@/db";
import { users, courses, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getMe = async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).user.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
};

export const getUserPurchases = async (req: Request, res: Response): Promise<any> => {
  try {
    const requestedUserId = req.params.id as string;
    const user = (req as any).user;

    if (requestedUserId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only view your own purchases" });
    }

    const myPurchases = await db
      .select({
        course: {
          id: courses.id,
          title: courses.title,
          description: courses.description,
          price: courses.price,
        },
      })
      .from(purchases)
      .innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(purchases.userId, requestedUserId));

    return res.status(200).json(myPurchases);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch purchases" });
  }
};
