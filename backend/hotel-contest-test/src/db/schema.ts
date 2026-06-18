import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  unique,
  varchar,
  decimal,
  jsonb,
  integer,
  date,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["CUSTOMER", "OWNER"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 15 })
    .unique("users_phone_unique"),
  role: roleEnum("role").default("CUSTOMER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  city: text("city").notNull(),
  country: text("country").notNull(),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  rating: decimal("rating", {
    precision: 3,
    scale: 2,
  }).default("0.00"),
  totalReviews: integer("total_reviews").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotels_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomNumber: text("room_number").notNull(),
    roomType: text("room_type").notNull(),
    pricePerNight: decimal("price_per_night", {
      precision: 10,
      scale: 2,
    }).notNull(),
    // pricePerNight: doublePrecision("price_per_night").notNull(),
    maxOccupancy: integer("max_occupancy").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("hotel_room_number_unique").on(t.hotelId, t.roomNumber)],
);

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("users_id")
      .notNull()
      .references(() => users.id),
    roomId: uuid("rooms_id")
      .notNull()
      .references(() => rooms.id),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id),
    checkInDate: date("check_in_date").notNull(),
    checkOutDate: date("check_out_date").notNull(),
    totalPrice: decimal("total_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    guests: integer("guests").notNull(),
    status: bookingStatusEnum("status").default("confirmed").notNull(),
    bookingDate: timestamp("booking_date").defaultNow().notNull(),
    cancelledAt: timestamp("cancelled_at"),
  },
  (t) => [check("check_dates", sql`${t.checkOutDate} > ${t.checkInDate}`)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("users_id")
      .notNull()
      .references(() => users.id),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    rating: integer("rating").notNull(),
  },
  (t) => [
    unique("review_booking_unique").on(t.bookingId),
    check("rating_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    // check("rating_check", sql`rating >= 1 AND rating <= 5`),
  ],
);

// ------------------------------------------------------------

// Use decimal for:
// price
// totalPrice
// salary
// booking cost
// transactions

// Use doublePrecision for:
// GPS coordinates
// scientific calculations
// machine learning values
// speed/measurements
