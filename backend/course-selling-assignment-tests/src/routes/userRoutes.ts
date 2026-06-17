import { Router } from "express";
import { getMe, getUserPurchases } from "@/controllers/userController";
import { authenticateJwt } from "@/middleware/auth";

const router = Router();

router.get("/me", authenticateJwt, getMe);
router.get("/:id/purchases", authenticateJwt, getUserPurchases);

export default router;
