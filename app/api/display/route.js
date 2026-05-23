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

		const tasks = await Task.find({}).sort({ created_at: 1 });

		return NextResponse.json({ tasks }, { status: 200 });
	} catch (error) {
		console.log(error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
