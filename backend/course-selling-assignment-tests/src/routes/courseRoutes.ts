import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "@/controllers/courseController";
import { getCourseLessons } from "@/controllers/lessonController";
import { authenticateJwt } from "@/middleware/auth";

const router = Router();

router.post("/", authenticateJwt, createCourse);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.patch("/:id", authenticateJwt, updateCourse);
router.delete("/:id", authenticateJwt, deleteCourse);

// Moved from lessonRoutes since it fits under /v1/courses/:courseId/lessons
router.get("/:courseId/lessons", getCourseLessons);

export default router;
