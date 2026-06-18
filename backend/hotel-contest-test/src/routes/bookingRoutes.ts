import { Router } from "express";
import { createBooking, getUserBookings, cancelBooking } from "@/controllers/bookingController";
import { authenticateJwt } from "@/middleware/auth";
import { isCustomer } from "@/middleware/isCustomer";
import { validate } from "@/middleware/validate";
import { createBookingSchema } from "@/validations/bookingValidation";

const router = Router();

router.get("/", authenticateJwt, isCustomer, getUserBookings);
router.post("/", authenticateJwt, isCustomer, validate(createBookingSchema), createBooking);
router.put("/:bookingId/cancel", authenticateJwt, isCustomer, cancelBooking);

export default router;
