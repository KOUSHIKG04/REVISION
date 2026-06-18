import { z } from "zod";

export const createHotelSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    amenities: z.array(z.string()).optional(),
  }),
});

export const addRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1),
    roomType: z.string().min(1),
    pricePerNight: z.number().positive(),
    maxOccupancy: z.number().int().positive(),
  }),
});
