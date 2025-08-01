import dotenv from "dotenv";
import express from "express";
import { inputCheck, tokenDecoder } from "./middleware";
import { UserModel, ContentModel, TagModel, LinkModel } from "./db";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

dotenv.config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET!;

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

app.post("/api/v1/content", tokenDecoder, async (req, res) => {
  const userId = req.userId;
  const { link, type, title, tags } = req.body;

  if (!link || !type || !title || !userId) {
    return res.status(403).json({ message: "Missing required fields" });
  }

  const validTypes = ["image", "video", "article", "audio"] as const;
  if (!validTypes.includes(type)) {
    return res.status(403).json({ message: "Invalid content type" });
  }

  const tagDocs = await Promise.all(
    tags.map(async (tagtitle: string) => {
      let tag = await TagModel.findOne({ title: tagtitle });
      tag ??= await TagModel.create({ title: tagtitle });
      return tag;
    })
  );

  // Extract only the ObjectId of the tag documents
  const tagIds = tagDocs.map((tag) => tag._id);

  try {
    await ContentModel.create({
      link: link,
      type: type,
      title: title,
      tags: tagIds,
      userId: userId,
    });
    res.status(200).json("Content stored in db");
  } catch (err) {
    return res.status(403).json(err);
  }
});

app.get("/api/v1/content", (req, res) => {});

app.delete("/api/v1/content", tokenDecoder, async (req, res) => {
  const userId = req.userId;
  const link = req.body.link;
  const title = req.body.title;

  try {
    await ContentModel.deleteOne({
      link: link,
      title: title,
      userId: userId,
    });
  } catch (e) {
    return res.status(403).json(e);
  }

  res.status(200).json("Document deleted successfully");
});

app.post("/api/v1/brain/share", (req, res) => {});

app.get("/api/v1/brain/:shareLink", (req, res) => {});

app.listen(3000);
