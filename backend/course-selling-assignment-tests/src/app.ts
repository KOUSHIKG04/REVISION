import express from "express";
import { authRoutes, userRoutes, courseRoutes, lessonRoutes, purchaseRoutes } from "@/routes/exportAllRoutes"

const app = express(); app.use(express.json());


app.use("/v1/users", userRoutes);
app.use("/v1/auth", authRoutes);
app.use("/v1/purchases", purchaseRoutes); 
app.use("/v1/courses", courseRoutes);
app.use("/v1/lessons", lessonRoutes);

export default app;
