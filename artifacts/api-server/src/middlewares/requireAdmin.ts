import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const adminId = process.env.ADMIN_CLERK_ID;
  if (!adminId || userId !== adminId) {
    res.status(403).json({ error: "Forbidden: admin access only" });
    return;
  }

  (req as Request & { clerkUserId: string }).clerkUserId = userId;
  next();
}
