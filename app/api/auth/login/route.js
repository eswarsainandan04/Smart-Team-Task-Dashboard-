import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {

  try {

    // connect database
    await connectDB();

    // request body
    const body = await req.json();

    const { email, password } = body;

    // validation
    if (!email || !password) {

      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    }

    // find user
    const user = await User.findOne({ email });

    if (!user) {

      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // compare password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {

      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // response — return user object only; client will manage sessionStorage.
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}