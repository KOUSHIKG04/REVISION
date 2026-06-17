import { Router } from "express";
import { createPurchase } from "@/controllers/purchaseController";
import { authenticateJwt } from "@/middleware/auth";

const router = Router();

router.post("/", authenticateJwt, createPurchase);

export default router;
