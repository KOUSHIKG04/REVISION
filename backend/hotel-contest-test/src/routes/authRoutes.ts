import { Router } from "express";
import { signupSchema, loginSchema } from "@/validations/authValidation";
import { signup, login } from "@/controllers/authController";
import { validate } from "@/middleware/validate";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login" , validate(loginSchema) , login );

export default router;
