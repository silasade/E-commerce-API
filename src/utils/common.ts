import mongoose from "mongoose";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export { toObjectId };
