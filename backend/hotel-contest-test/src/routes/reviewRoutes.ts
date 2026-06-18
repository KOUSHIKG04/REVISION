import { Router } from "express";
import { createReview } from "@/controllers/reviewController";
import { authenticateJwt } from "@/middleware/auth";
import { isCustomer } from "@/middleware/isCustomer";
import { validate } from "@/middleware/validate";
import { createReviewSchema } from "@/validations/reviewValidation";

const router = Router();

router.post("/", authenticateJwt, isCustomer, validate(createReviewSchema), createReview);

export default router;
