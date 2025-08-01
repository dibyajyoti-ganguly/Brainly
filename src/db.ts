require("dotenv").config();
import mongoose, { Schema, Types, Document } from "mongoose";

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}`
  )
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

interface IUser extends Document {
  username: string;
  password: string;
}

interface IContent extends Document {
  link: string;
  type: string;
  title: string;
  tags?: Types.ObjectId[];
  userId: Types.ObjectId;
  shareId: string;
}

interface ITags extends Document {
  title: string;
}

interface ILink {
  hash: string;
  userId: Types.ObjectId;
}

const contentTypes = ["image", "video", "article", "audio"] as const;

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const ContentSchema = new Schema<IContent>({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  shareId: { type: String, unique: true, sparse: true }, // optional field in content schema
});

const TagSchema = new Schema<ITags>({
  title: { type: String, required: true, unique: true },
});

const LinkSchema = new Schema<ILink>({
  hash: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const UserModel = mongoose.model("User", UserSchema);
const ContentModel = mongoose.model("Content", ContentSchema);
const TagModel = mongoose.model("Tags", TagSchema);
const LinkModel = mongoose.model("Link", LinkSchema);

export { UserModel, ContentModel, TagModel, LinkModel };
