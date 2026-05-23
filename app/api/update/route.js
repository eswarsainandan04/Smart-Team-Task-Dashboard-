import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import Task from "@/models/Task";
import TaskActivity from "@/models/TaskActivity";

const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["pending", "in_progress", "completed", "delayed", "cancelled"];

function buildActivityEntry(action, email) {
  return {
    action,
    user_email: email,
    timestamp: new Date(),
  };
}

function normalizeDueDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(req) {
  try {
    await connectDB();

    const user = getTokenPayload(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { task_id, title, description = "", priority = "medium", due_date, status = "pending" } = body;
    const normalizedTitle = String(title || "").trim();

    if (!task_id) {
      return NextResponse.json({ message: "Task id is required" }, { status: 400 });
    }

    if (!normalizedTitle) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ message: "Invalid priority" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const duplicateTask = await Task.findOne({ title: normalizedTitle, task_id: { $ne: task_id } });
    if (duplicateTask) {
      return NextResponse.json({ message: "This task already exists" }, { status: 409 });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { task_id },
      {
        $set: {
          title: normalizedTitle,
          description: String(description || "").trim(),
          priority,
          due_date: normalizeDueDate(due_date),
          status,
        },
        $push: {
          activity: buildActivityEntry("updated by", user.email || "unknown"),
        },
      },
      { returnDocument: "after", runValidators: false }
    );

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    await TaskActivity.create({
      task_id: updatedTask.task_id,
      title: updatedTask.title,
      action: "updated",
      user_email: user.email || "unknown",
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: "This task already exists" }, { status: 409 });
    }
    console.log(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
