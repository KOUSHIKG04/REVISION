import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/db";
import { hotels, bookings, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidUUID } from "@/utils/uuid";

export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookingId, rating, comment } = req.body;
    const userId = (req as any).user.id;

    return await db.transaction(async (tx) => {
      //  Fetch booking
      const [booking] = isValidUUID(bookingId) ? await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId)) : [];

      if (!booking) {
        return res
          .status(404)
          .json({ success: false, data: null, error: "BOOKING_NOT_FOUND" });
      }

      //  Verify ownership
      if (booking.userId !== userId) {
        return res
          .status(403)
          .json({ success: false, data: null, error: "FORBIDDEN" });
      }

      //  Verify eligibility
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const checkOut = new Date(booking.checkOutDate);
      
      // Normalize checkOut time just in case
      checkOut.setHours(0, 0, 0, 0);

      if (booking.status !== "confirmed" || checkOut >= today) {
        return res
          .status(400)
          .json({ success: false, data: null, error: "BOOKING_NOT_ELIGIBLE" });
      }

      //  Verify no existing review
      const [existingReview] = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.bookingId, bookingId));
        
      if (existingReview) {
        return res
          .status(400)
          .json({ success: false, data: null, error: "ALREADY_REVIEWED" });
      }

      //  Fetch hotel to update stats
      const [hotel] = await tx
        .select()
        .from(hotels)
        .where(eq(hotels.id, booking.hotelId));

      if (!hotel) {
        return res
          .status(404)
          .json({ success: false, data: null, error: "HOTEL_NOT_FOUND" });
      }

      const oldRating = Number(hotel.rating) || 0;
      const oldTotal = hotel.totalReviews || 0;

      const newRating = (oldRating * oldTotal + rating) / (oldTotal + 1);
      const newTotal = oldTotal + 1;

      //  Update hotel rating and review count
      await tx
        .update(hotels)
        .set({
          rating: String(newRating.toFixed(2)), // DB schema stores rating as decimal
          totalReviews: newTotal,
        })
        .where(eq(hotels.id, hotel.id));

      //  Insert review
      const insertedReview = await tx
        .insert(reviews)
        .values({
          userId,
          hotelId: hotel.id,
          bookingId,
          rating,
          comment,
        })
        .returning();

      const review = insertedReview[0];

      if (!review) {
        return res
          .status(500)
          .json({ success: false, data: null, error: "REVIEW_CREATION_FAILED" });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: review.id,
          userId: review.userId,
          hotelId: review.hotelId,
          bookingId: review.bookingId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
        },
        error: null,
      });
    });
  },
);
