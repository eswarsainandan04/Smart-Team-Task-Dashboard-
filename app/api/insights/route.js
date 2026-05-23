import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import Task from "@/models/Task";
import TaskActivity from "@/models/TaskActivity";

export async function GET(req) {
	try {
		await connectDB();

		const user = getTokenPayload(req);
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const tasks = await Task.find({}, { status: 1 }).sort({ created_at: -1 });

		const totalTasks = tasks.length;
		const completedTasks = tasks.filter((task) => task.status === "completed").length;
		const pendingTasks = tasks.filter((task) => task.status === "pending").length;

		const recentLoggedActivity = await TaskActivity.findOne({}).sort({ timestamp: -1 }).lean();

		const recentActivity = recentLoggedActivity || null;

		return NextResponse.json(
			{
				totalTasks,
				completedTasks,
				pendingTasks,
				recentActivity,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.log(error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
