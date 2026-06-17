import type { Request, Response } from "express";
import { db } from "@/db";
import { courses, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createPurchase = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;

    if (user.role !== "STUDENT") {
      return res
        .status(403)
        .json({ error: "Only students can purchase courses" });
    }

    const { courseId } = req.body;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await db.insert(purchases).values({
      userId: user.id,
      courseId,
    });
    return res.status(200).json({ message: "Course purchased successfully" });
  } catch (error: any) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "You have already purchased this course" });
    }
    return res.status(500).json({ error: "Failed to purchase course" });
  }
};
