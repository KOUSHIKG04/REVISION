import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token as string, process.env.JWT_SECRET!, (err, payload) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          data: null, 
          error: "UNAUTHORIZED" 
        });
      }

      // Attach the decoded payload (id, role) to the request object so the next route can use it
      (req as any).user = payload;
      next();
    });
  } else {
    res.status(401).json({ 
      success: false, 
      data: null, 
      error: "UNAUTHORIZED" 
    });
  }
};
