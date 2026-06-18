import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body, query: req.query, params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (
        parsed.query !== undefined &&
        Object.keys(parsed.query as any).length > 0
      ) {
        Object.assign(req.query, parsed.query);
      }

      if (
        parsed.params !== undefined &&
        Object.keys(parsed.params as any).length > 0
      ) {
        Object.assign(req.params, parsed.params);
      }
      
      next();


    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      next(error);
    }
  };
};
