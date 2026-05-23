import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const OtpSchema = new mongoose.Schema({
  otp_id: {
    type: String,
    default: uuidv4,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },

  otp_hash: {
    type: String,
    required: true,
    select: false,
  },

  used: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);

export default Otp;
