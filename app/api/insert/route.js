import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import Task from "@/models/Task";
import TaskActivity from "@/models/TaskActivity";

const VALID_PRIORITIES = ["low", "medium", "high"];
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

export async function POST(req) {
	try {
		await connectDB();

		const user = getTokenPayload(req);
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { title, description = "", priority = "medium", due_date } = body;
		const normalizedTitle = String(title || "").trim();

		if (!normalizedTitle) {
			return NextResponse.json({ message: "Title is required" }, { status: 400 });
		}

		if (!VALID_PRIORITIES.includes(priority)) {
			return NextResponse.json({ message: "Invalid priority" }, { status: 400 });
		}

		const existingTask = await Task.findOne({ title: normalizedTitle });
		if (existingTask) {
			return NextResponse.json({ message: "This task already exists" }, { status: 409 });
		}

		const task = await Task.create({
			title: normalizedTitle,
			description: String(description || "").trim(),
			priority,
			due_date: normalizeDueDate(due_date),
			activity: [buildActivityEntry("created by", user.email || "unknown")],
		});

		await TaskActivity.create({
			task_id: task.task_id,
			title: task.title,
			action: "created",
			user_email: user.email || "unknown",
		});

		return NextResponse.json({ task }, { status: 201 });
	} catch (error) {
		if (error?.code === 11000) {
			return NextResponse.json({ message: "This task already exists" }, { status: 409 });
		}
		console.log(error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
