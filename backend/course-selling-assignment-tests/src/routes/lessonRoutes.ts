import { Router } from "express";
import { createLesson } from "@/controllers/lessonController";
import { authenticateJwt } from "@/middleware/auth";

const router = Router();

router.post("/", authenticateJwt, createLesson);

export default router;
