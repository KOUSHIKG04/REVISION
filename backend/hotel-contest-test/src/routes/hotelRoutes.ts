import { Router } from "express";
import {
  createHotel,
  addRoom,
  searchHotels,
  getHotelDetails,
} from "@/controllers/hotelController";
import { authenticateJwt } from "@/middleware/auth";
import { isOwner } from "@/middleware/isOwner";
import { validate } from "@/middleware/validate";
import {
  createHotelSchema,
  addRoomSchema,
} from "@/validations/hotelValidation";

const router = Router();

router.get("/", authenticateJwt, searchHotels);
router.get("/:hotelId", authenticateJwt, getHotelDetails);

router.post(
  "/",
  authenticateJwt,
  isOwner,
  validate(createHotelSchema),
  createHotel,
);

router.post(
  "/:hotelId/rooms",
  authenticateJwt,
  isOwner,
  validate(addRoomSchema),
  addRoom,
);

export default router;
