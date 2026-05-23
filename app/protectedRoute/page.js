"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoutePage() {
	const router = useRouter();

	useEffect(() => {
		const stored = sessionStorage.getItem("smart-team-user");
		if (!stored) {
			router.replace("/login");
			return;
		}

		router.replace("/dashboard");
	}, [router]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
			<div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
				Checking session...
			</div>
		</main>
	);
}
