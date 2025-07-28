import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { UserModel, ContentModel, TagModel, LinkModel } from "./db";
import { Types } from "mongoose";
import * as z from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(express.json());

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

app.post("/api/v1/signup", inputCheck, async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await UserModel.findOne({
    username: username,
    password: password,
  });

  if (user)
    return res.status(403).json("User already exists with this username");

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await UserModel.create({
      username: username,
      password: hashedPassword,
    });
    res.status(200).json("Signed up");
  } catch (err) {
    res.status(500).json("Server Error : " + err);
  }
});

app.post("/api/v1/signin", inputCheck, async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await UserModel.findOne({
    username: username,
  });

  if (!user) return res.status(403).json("User does not exist");

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) return res.status(403).json("Wrong email password");

  const token = jwt.sign(
    { id: (user._id as Types.ObjectId).toString() },
    JWT_SECRET
  );

  res.status(200).json({
    token: token,
  });
});

app.post("/api/v1/content", (req, res) => {});

app.get("/api/v1/content", (req, res) => {});

app.delete("/api/v1/content", (req, res) => {});

app.post("/api/v1/brain/share", (req, res) => {});

app.get("/api/v1/brain/:shareLink", (req, res) => {});

app.listen(3000);
