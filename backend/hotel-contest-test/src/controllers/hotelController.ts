import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/db";
import { hotels, rooms } from "@/db/schema";
import { eq, and, ilike, gte, lte, sql, SQL } from "drizzle-orm";
import { isValidUUID } from "@/utils/uuid";

export const createHotel = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, city, country, amenities } = req.body;
  const ownerId = (req as any).user.id;

  const insertedHotel = await db
    .insert(hotels)
    .values({
      ownerId,
      name,
      description,
      city,
      country,
      amenities: amenities || [],
    })
    .returning();

  const newHotel = insertedHotel[0];

  if (!newHotel) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "HOTEL_CREATION_FAILED",
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id: newHotel.id,
      ownerId: newHotel.ownerId,
      name: newHotel.name,
      description: newHotel.description,
      city: newHotel.city,
      country: newHotel.country,
      amenities: newHotel.amenities,
      rating: Number(newHotel.rating) || 0.0,
      totalReviews: newHotel.totalReviews,
    },
    error: null,
  });
});

export const addRoom = asyncHandler(async (req: Request, res: Response) => {
  const hotelId = req.params.hotelId as string;
  const { roomNumber, roomType, pricePerNight, maxOccupancy } = req.body;
  const userId = (req as any).user.id;

  const [hotel] = isValidUUID(hotelId)
    ? await db.select().from(hotels).where(eq(hotels.id, hotelId))
    : [null];

  if (!hotel) {
    return res
      .status(404)
      .json({ success: false, data: null, error: "HOTEL_NOT_FOUND" });
  }

  if (hotel.ownerId !== userId) {
    return res
      .status(403)
      .json({ success: false, data: null, error: "FORBIDDEN" });
  }

  const [existingRoom] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hotelId, hotelId), eq(rooms.roomNumber, roomNumber)));

  if (existingRoom) {
    return res
      .status(400)
      .json({ success: false, data: null, error: "ROOM_ALREADY_EXISTS" });
  }

  const insertedRoom = await db
    .insert(rooms)
    .values({
      hotelId,
      roomNumber,
      roomType,
      pricePerNight: String(pricePerNight),
      maxOccupancy,
    })
    .returning();

  const newRoom = insertedRoom[0];

  if (!newRoom) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "ROOM_CREATION_FAILED",
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id: newRoom.id,
      hotelId: newRoom.hotelId,
      roomNumber: newRoom.roomNumber,
      roomType: newRoom.roomType,
      pricePerNight: Number(newRoom.pricePerNight),
      maxOccupancy: newRoom.maxOccupancy,
    },
    error: null,
  });
});

export const searchHotels = asyncHandler(
  async (req: Request, res: Response) => {
    const { city, country, minPrice, maxPrice, minRating } = req.query;

    const cityStr = typeof city === "string" ? city : undefined;
    const countryStr = typeof country === "string" ? country : undefined;
    const minRatingStr = typeof minRating === "string" ? minRating : undefined;

    let query = db
      .select({
        id: hotels.id,
        name: hotels.name,
        description: hotels.description,
        city: hotels.city,
        country: hotels.country,
        amenities: hotels.amenities,
        rating: hotels.rating,
        totalReviews: hotels.totalReviews,
        minPricePerNight: sql<number>`min(${rooms.pricePerNight}::numeric)`,
      })
      .from(hotels)
      .innerJoin(rooms, eq(hotels.id, rooms.hotelId))
      .where(
        and(
          cityStr ? ilike(hotels.city, `%${cityStr}%`) : undefined,
          countryStr ? ilike(hotels.country, `%${countryStr}%`) : undefined,
          minRatingStr ? gte(hotels.rating, minRatingStr) : undefined,
        ),
      )
      .groupBy(hotels.id)
      .$dynamic();

    const havingConditions: SQL[] = [];
    if (minPrice)
      havingConditions.push(
        gte(sql`min(${rooms.pricePerNight}::numeric)`, Number(minPrice)),
      );
    if (maxPrice)
      havingConditions.push(
        lte(sql`min(${rooms.pricePerNight}::numeric)`, Number(maxPrice)),
      );

    if (havingConditions.length > 0) {
      query = query.having(and(...havingConditions));
    }

    const results = await query;

    const formattedResults = results.map((h: any) => ({
      ...h,
      rating: Number(h.rating) || 0,
      minPricePerNight: Number(h.minPricePerNight),
    }));

    return res.status(200).json({
      success: true,
      data: formattedResults,
      error: null,
    });
  },
);

export const getHotelDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const hotelId = req.params.hotelId as string;

    if (!isValidUUID(hotelId)) {
      return res
        .status(404)
        .json({ success: false, data: null, error: "HOTEL_NOT_FOUND" });
    }

    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId));

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, data: null, error: "HOTEL_NOT_FOUND" });
    }

    const hotelRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.hotelId, hotelId));

    return res.status(200).json({
      success: true,
      data: {
        id: hotel.id,
        ownerId: hotel.ownerId,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        amenities: hotel.amenities,
        rating: Number(hotel.rating) || 0,
        totalReviews: hotel.totalReviews,
        rooms: hotelRooms.map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          pricePerNight: Number(r.pricePerNight),
          maxOccupancy: r.maxOccupancy,
        })),
      },
      error: null,
    });
  },
);
