import type { Request, Response, NextFunction } from "express";

export const isOwner = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== "OWNER") {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  next();
};
