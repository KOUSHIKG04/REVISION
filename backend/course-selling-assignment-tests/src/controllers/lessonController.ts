import type { Request, Response } from "express";
import { db } from "@/db";
import { courses, lessons } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createLesson = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;

    if (user.role !== "INSTRUCTOR") {
      return res
        .status(403)
        .json({ error: "Only instructors can add lessons" });
    }

    const { title, content, courseId } = req.body;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.instructorId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only add lessons to your own courses" });
    }

    const [newLesson] = await db
      .insert(lessons)
      .values({
        title,
        content,
        courseId,
      })
      .returning();

    return res.status(200).json(newLesson);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add lesson" });
  }
};

export const getCourseLessons = async (req: Request, res: Response): Promise<any> => {
  try {
    const courseId = req.params.courseId as string;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    return res.status(200).json(courseLessons);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch lessons" });
  }
};
