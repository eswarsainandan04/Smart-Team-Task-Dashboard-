import { NextResponse } from "next/server";

export function middleware(req) {
	const authUser = req.cookies.get("auth_user")?.value;

	if (!authUser) {
		const loginUrl = new URL("/login", req.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
