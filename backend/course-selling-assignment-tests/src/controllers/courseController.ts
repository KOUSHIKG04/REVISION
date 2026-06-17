import type { Request, Response } from "express";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createCourse = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;

    if (user.role !== "INSTRUCTOR") {
      return res
        .status(403)
        .json({ error: "Only instructors can create courses" });
    }

    const { title, description, price } = req.body;

    const [newCourse] = await db
      .insert(courses)
      .values({
        title,
        description,
        price,
        instructorId: user.id,
      })
      .returning();

    return res.status(200).json(newCourse);
  } catch (error) {
    return res.status(409).json({});
  }
};

export const getAllCourses = async (req: Request, res: Response): Promise<any> => {
  try {
    const allCourses = await db.select().from(courses);
    return res.status(200).json(allCourses);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
};

export const getCourseById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch course" });
  }
};

export const updateCourse = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<any> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.instructorId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only edit your own courses" });
    }

    const { title, description, price } = req.body;

    const [updatedCourse] = await db
      .update(courses)
      .set({ title, description, price, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    return res.status(200).json(updatedCourse);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update course" });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const user = (req as any).user;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.instructorId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own courses" });
    }
    await db.delete(courses).where(eq(courses.id, id));

    return res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete course" });
  }
};
