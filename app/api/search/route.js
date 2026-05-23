import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import Task from "@/models/Task";

export async function GET(req) {
	try {
		await connectDB();

		const user = getTokenPayload(req);
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const query = (searchParams.get("q") || "").trim();
		const status = (searchParams.get("status") || "").trim();
		const priority = (searchParams.get("priority") || "").trim();
		const dueDate = (searchParams.get("due_date") || "").trim();

		const filter = {};

		if (query) {
			filter.$or = [
				{ title: { $regex: query, $options: "i" } },
				{ description: { $regex: query, $options: "i" } },
			];
		}

		if (status) {
			filter.status = status;
		}

		if (priority) {
			filter.priority = priority;
		}

		if (dueDate) {
			const start = new Date(`${dueDate}T00:00:00.000Z`);
			const end = new Date(`${dueDate}T23:59:59.999Z`);
			filter.due_date = { $gte: start, $lte: end };
		}

		const tasks = await Task.find(filter).sort({ created_at: 1 });

		return NextResponse.json({ tasks }, { status: 200 });
	} catch (error) {
		console.log(error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
