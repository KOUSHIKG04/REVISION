import express from "express";
import type { Request, Response, NextFunction } from "express";
import { authRoutes } from "@/routes/exportAllRoutes";



const app = express(); app.use(express.json());

app.use("/v1/api/auth/", authRoutes)

// THIS MUST BE THE LAST app.use() BEFORE export default app!
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error Caught:", err.message || err);

  res.status(500).json({
    success: false,
    data: null,
    error: err.message || "INTERNAL_SERVER_ERROR",
  });
});

export default app;