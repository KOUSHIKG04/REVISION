import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/db";
import { hotels, rooms, bookings } from "@/db/schema";
import { eq, and, lt, gt } from "drizzle-orm";
import { isValidUUID } from "@/utils/uuid";

export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { roomId, checkInDate, checkOutDate, guests } = req.body;
    const userId = (req as any).user.id;

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inDate <= today) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "INVALID_DATES" });
    }

    if (outDate <= inDate) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "INVALID_REQUEST" });
    }

    const nights = Math.round(
      (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return await db.transaction(async (tx) => {
      //  Fetch room & hotel
      const roomWithHotel = isValidUUID(roomId) ? await tx
        .select({
          room: rooms,
          hotel: hotels,
        })
        .from(rooms)
        .innerJoin(hotels, eq(rooms.hotelId, hotels.id))
        .where(eq(rooms.id, roomId)) : [];

      const firstResult = roomWithHotel[0];
      
      if (!firstResult) {
        return res
          .status(404)
          .json({ success: false, data: null, error: "ROOM_NOT_FOUND" });
      }

      const { room, hotel } = firstResult;

      // Check if owner is booking their own hotel
      if (hotel.ownerId === userId) {
        return res
          .status(403)
          .json({ success: false, data: null, error: "FORBIDDEN" });
      }

      // Check capacity
      if (guests > room.maxOccupancy) {
        return res
          .status(400)
          .json({ success: false, data: null, error: "INVALID_CAPACITY" });
      }

      // Check overlapping bookings atomically
      const overlappingBookings = await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.roomId, roomId),
            eq(bookings.status, "confirmed"),
            lt(bookings.checkInDate, checkOutDate),
            gt(bookings.checkOutDate, checkInDate),
          ),
        );

      if (overlappingBookings.length > 0) {
        // Transaction will automatically resolve and not save anything if we just return here
        return res
          .status(400)
          .json({ success: false, data: null, error: "ROOM_NOT_AVAILABLE" });
      }

      // Calculate price
      const pricePerNight = Number(room.pricePerNight);
      const totalPrice = nights * pricePerNight;

      // Insert new booking
      const insertedBooking = await tx
        .insert(bookings)
        .values({
          userId,
          roomId,
          hotelId: hotel.id,
          checkInDate,
          checkOutDate,
          totalPrice: String(totalPrice),
          guests,
        })
        .returning();

      const newBooking = insertedBooking[0];

      if (!newBooking) {
        return res
          .status(500)
          .json({
            success: false,
            data: null,
            error: "BOOKING_CREATION_FAILED",
          });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: newBooking.id,
          userId: newBooking.userId,
          roomId: newBooking.roomId,
          hotelId: newBooking.hotelId,
          checkInDate: newBooking.checkInDate,
          checkOutDate: newBooking.checkOutDate,
          guests: newBooking.guests,
          totalPrice: Number(newBooking.totalPrice),
          status: newBooking.status,
          bookingDate: newBooking.bookingDate.toISOString(),
        },
        error: null,
      });
    });
  },
);

export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const statusFilter = req.query.status as string | undefined;

  const filters = [eq(bookings.userId, userId)];
  if (statusFilter && (statusFilter === "confirmed" || statusFilter === "cancelled")) {
    filters.push(eq(bookings.status, statusFilter));
  }

  const userBookings = await db
    .select({
      id: bookings.id,
      roomId: bookings.roomId,
      hotelId: bookings.hotelId,
      hotelName: hotels.name,
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guests: bookings.guests,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      bookingDate: bookings.bookingDate,
    })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(hotels, eq(bookings.hotelId, hotels.id))
    .where(and(...filters));

  const formattedBookings = userBookings.map((b) => ({
    ...b,
    totalPrice: Number(b.totalPrice),
    bookingDate: b.bookingDate.toISOString(),
  }));

  return res.status(200).json({
    success: true,
    data: formattedBookings,
    error: null,
  });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const userId = (req as any).user.id;

  if (!isValidUUID(bookingId)) {
    return res.status(404).json({ success: false, data: null, error: "BOOKING_NOT_FOUND" });
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));

  if (!booking) {
    return res.status(404).json({ success: false, data: null, error: "BOOKING_NOT_FOUND" });
  }

  if (booking.userId !== userId) {
    return res.status(403).json({ success: false, data: null, error: "FORBIDDEN" });
  }

  if (booking.status === "cancelled") {
    return res.status(400).json({ success: false, data: null, error: "ALREADY_CANCELLED" });
  }

  const checkIn = new Date(booking.checkInDate);
  const now = new Date();
  
  const diffHours = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return res.status(400).json({ success: false, data: null, error: "CANCELLATION_DEADLINE_PASSED" });
  }

  const [updatedBooking] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date()
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (!updatedBooking) {
    return res.status(500).json({ success: false, data: null, error: "UPDATE_FAILED" });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: updatedBooking.id,
      status: updatedBooking.status,
      cancelledAt: updatedBooking.cancelledAt?.toISOString(),
    },
    error: null,
  });
});
