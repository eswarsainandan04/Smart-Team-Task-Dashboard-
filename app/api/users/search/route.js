import { connectDB } from "@/lib/mongodb";
import { getTokenPayload } from "@/lib/auth";
import User from "@/models/User";

export async function GET(req) {
	try {
		await connectDB();

		const decoded = getTokenPayload(req);
		if (!decoded) {
			return Response.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const email = searchParams.get("email");

		if (!email) {
			return Response.json({ message: "Email required" }, { status: 400 });
		}

		const user = await User.findOne({ email }).select("user_id name email");
		if (!user) {
			return Response.json({ message: "User not found" }, { status: 404 });
		}

		return Response.json({
			user: {
				user_id: user.user_id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.log(error);
		return Response.json({ message: "Server error" }, { status: 500 });
	}
}