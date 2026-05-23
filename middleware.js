import { NextResponse } from "next/server";

export function middleware(req) {
	// Disabled automatic redirect because the app uses client-side sessionStorage
	// to manage per-tab sessions. Client pages perform their own checks and
	// redirect if needed. Let requests through so login can set sessionStorage.
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
