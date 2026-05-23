import mongoose from "mongoose";

const TaskActivitySchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
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
});

const TaskActivity = mongoose.models.TaskActivity || mongoose.model("TaskActivity", TaskActivitySchema);

export default TaskActivity;