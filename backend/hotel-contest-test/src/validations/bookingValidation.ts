import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    roomId: z.string(),
    checkInDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
    checkOutDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
    guests: z.number().int().positive("Must have at least 1 guest"),
  }),
});
