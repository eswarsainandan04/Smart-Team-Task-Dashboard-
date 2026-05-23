import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import Task from "@/models/Task";
import TaskActivity from "@/models/TaskActivity";

export async function DELETE(req) {
  try {
    await connectDB();

    const user = getTokenPayload(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json({ message: "Task id is required" }, { status: 400 });
    }

    const deletedTask = await Task.findOneAndDelete({ task_id });
    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    await TaskActivity.create({
      task_id: deletedTask.task_id,
      title: deletedTask.title,
      action: "deleted",
      user_email: user.email || "unknown",
    });

    return NextResponse.json({ task: deletedTask }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
