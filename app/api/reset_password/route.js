import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import emailjs from "@emailjs/nodejs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[@#$%^]).{8,}$/;

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createOtp() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
	const serviceId = process.env.EMAILJS_SERVICE_ID;
	const templateId = process.env.EMAILJS_TEMPLATE_ID;
	const publicKey = process.env.EMAILJS_PUBLIC_KEY;
	const privateKey = process.env.EMAILJS_PRIVATE_KEY;

	if (!serviceId || !templateId || !publicKey) {
		throw new Error("Email service is not configured");
	}

	await emailjs.send(
		serviceId,
		templateId,
		{
			otp,
			email,
		},
		{
			publicKey,
			...(privateKey ? { privateKey } : {}),
		}
	);
}

export async function POST(req) {
	try {
		await connectDB();

		const body = await req.json();
		const { action, email, otp, password, confirm_password } = body;

		if (!action) {
			return NextResponse.json({ message: "Action is required" }, { status: 400 });
		}

		const normalizedEmail = String(email || "").trim();
		if (!normalizedEmail) {
			return NextResponse.json({ message: "Email is required" }, { status: 400 });
		}

		const emailFilter = { email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i") };

		if (action === "send_otp") {
			const user = await User.findOne(emailFilter);

			if (!user) {
				return NextResponse.json({ message: "This email doesn't exist" }, { status: 404 });
			}

			const generatedOtp = createOtp();
			const otpHash = await bcrypt.hash(generatedOtp, 10);

			// Persist OTP in dedicated collection (do not overwrite or remove user's data)
			const otpDoc = new Otp({ email: normalizedEmail.toLowerCase(), otp_hash: otpHash });
			await otpDoc.save();

			try {
				await sendOtpEmail(normalizedEmail, generatedOtp);
			} catch (emailError) {
				const errorText = emailError?.text || emailError?.message || "Failed to send OTP email";

				// Keep the OTP record so verification can still succeed if OTP was delivered by other means
				return NextResponse.json({ message: errorText }, { status: 502 });
			}

			return NextResponse.json({ message: "OTP sent to your email" }, { status: 200 });
		}

		if (action === "verify_otp") {
			if (!otp || String(otp).trim().length !== 6) {
				return NextResponse.json({ message: "Valid 6-digit OTP is required" }, { status: 400 });
			}

			// Find latest unused OTP for this email
			const otpRecord = await Otp.findOne({ email: normalizedEmail.toLowerCase(), used: false })
				.sort({ created_at: -1 })
				.select("+otp_hash");

			if (!otpRecord || !otpRecord.otp_hash) {
				return NextResponse.json({ message: "Please request OTP first" }, { status: 400 });
			}

			const matches = await bcrypt.compare(String(otp).trim(), otpRecord.otp_hash);
			if (!matches) {
				return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
			}

			// Do not mark OTP as used on verification alone — mark it when password is reset.
			return NextResponse.json({ message: "OTP verified" }, { status: 200 });
		}

		if (action === "reset_password") {
			if (!otp || String(otp).trim().length !== 6) {
				return NextResponse.json({ message: "Valid 6-digit OTP is required" }, { status: 400 });
			}

			if (!password || !confirm_password) {
				return NextResponse.json({ message: "Password and confirm password are required" }, { status: 400 });
			}

			if (password !== confirm_password) {
				return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
			}

			if (!PASSWORD_PATTERN.test(password)) {
				return NextResponse.json(
					{
						message:
							"Password must be at least 8 characters, include 1 uppercase letter, and 1 special character (@#$%^).",
					},
					{ status: 400 }
				);
			}

			// find latest unused OTP record
			const otpRecord = await Otp.findOne({ email: normalizedEmail.toLowerCase(), used: false })
				.sort({ created_at: -1 })
				.select("+otp_hash");

			if (!otpRecord || !otpRecord.otp_hash) {
				return NextResponse.json({ message: "Please request OTP first" }, { status: 400 });
			}

			const matches = await bcrypt.compare(String(otp).trim(), otpRecord.otp_hash);
			if (!matches) {
				return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
			}

			const user = await User.findOne(emailFilter);
			if (!user) {
				return NextResponse.json({ message: "This email doesn't exist" }, { status: 404 });
			}

			user.password = await bcrypt.hash(password, 10);
			await user.save();

			otpRecord.used = true;
			await otpRecord.save();

			return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
		}

		return NextResponse.json({ message: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.log(error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
