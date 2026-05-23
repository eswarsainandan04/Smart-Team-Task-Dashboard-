import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new mongoose.Schema({
  
  user_id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  reset_otp_hash: {
    type: String,
    default: null,
    select: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

});

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

export default User;