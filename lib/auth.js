// lib/auth.js
// Reads the JWT from sessionStorage and returns request headers / decoded payload.
// Using sessionStorage (per-tab) instead of a shared cookie means each browser
// tab has its own independent session — fixing the "shared cookie overwrites
// another user's token" bug.

// Use sessionStorage-stored per-tab user info. Client stores the user object
// at `sessionStorage.smart-team-user` and server-side helpers read headers
// `x-user-id` and `x-user-email` produced from that value.

// ─── CLIENT helper (call only from "use client" code) ─────────────────────────
export function getAuthHeaders() {
	if (typeof window === "undefined") return {};
	const userStr = sessionStorage.getItem("smart-team-user");
	if (!userStr) return {};
	try {
		const user = JSON.parse(userStr);
		if (!user || !user.user_id) return {};
		return {
			"x-user-id": user.user_id,
			"x-user-email": user.email || "",
		};
	} catch {
		return {};
	}
}

// ─── SERVER helper (call only from API route handlers) ────────────────────────
export function getTokenPayload(req) {
	// Expect client to send `x-user-id` header derived from sessionStorage.
	const userId = req.headers.get("x-user-id");
	if (!userId) return null;
	return {
		user_id: userId,
		email: req.headers.get("x-user-email") || null,
	};
}