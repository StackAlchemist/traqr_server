import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = getAuth(req);

  if (!("userId" in auth) || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};