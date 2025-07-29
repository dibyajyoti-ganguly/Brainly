import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { UserModel, ContentModel, TagModel, LinkModel } from "./db";
import * as z from "zod";
import jwt from "jsonwebtoken";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;

function inputCheck(req: Request, res: Response, next: NextFunction) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) return res.status(411).json("Error in inputs");

  const User = z.object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long" })
      .max(10, { message: "Username must be at most 10 characters long" })
      .regex(/^[a-zA-Z]+$/, { message: "Username must contain only letters" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(20, { message: "Password must be at most 20 characters long" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      }),
  });

  const data = User.safeParse({ username, password });

  if (!data.success) {
    const errorMessages = data.error.message;
    return res.status(411).json({ error: errorMessages });
  }

  next();
}

async function tokenDecoder(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  const decoded = jwt.verify(token as string, JWT_SECRET);

  if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
    return res.status(403).json("Missing or invalid token");
  }

  const userId = decoded.id as string;

  const user = await UserModel.findOne({
    _id: userId,
  });

  if (!user) return res.status(403).json("Invalid token");

  req.userId = userId;

  next();
}

export { inputCheck, tokenDecoder };
