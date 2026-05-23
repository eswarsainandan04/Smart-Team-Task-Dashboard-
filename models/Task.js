import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const TaskActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    user_email: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  due_date: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "delayed", "cancelled"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: () => new Date(),
  },
  activity: {
    type: [TaskActivitySchema],
    default: [],
  },
});

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
