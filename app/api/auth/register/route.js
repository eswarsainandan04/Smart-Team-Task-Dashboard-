import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {

  try {

    await connectDB();

    const body = await req.json();

    const { name, email, password } = body;
    const passwordPattern = /^(?=.*[A-Z])(?=.*[@#$%^]).{8,}$/;

    // validation
    if (!name || !email || !password) {

      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 }
      );
    }

    // existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    if (!passwordPattern.test(password)) {

      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters, include 1 uppercase letter, and 1 special character (@#$%^).",
        },
        { status: 400 }
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const responseBody = {
      message: "User registered successfully",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    };

    return NextResponse.json(responseBody, { status: 201 });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}