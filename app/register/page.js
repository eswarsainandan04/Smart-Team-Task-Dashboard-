"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const passwordPattern = /^(?=.*[A-Z])(?=.*[@#$%^]).{8,}$/;

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (loading) return;
		setError("");

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (!passwordPattern.test(form.password)) {
			setError(
				"Password must be at least 8 characters, include 1 uppercase letter, and 1 special character (@#$%^)."
			);
			return;
		}

		setLoading(true);

		const payload = {
			name: form.name,
			email: form.email,
			password: form.password,
		};

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				setError(data.message || "Registration failed.");
				setLoading(false);
				return;
			}

			// store user in sessionStorage to auto-login (per-tab)
			if (data.user) {
				sessionStorage.setItem("smart-team-user", JSON.stringify(data.user));
			}

			router.replace("/dashboard");
		} catch (err) {
			setError("Unable to reach the server.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="flex-1 bg-slate-50">
			<div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-6 py-16">
				<div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
					<div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
						Smart Team
					</div>
					<h1 className="mt-3 text-2xl font-semibold text-slate-900">Create account</h1>
					<p className="mt-2 text-sm text-slate-600">
						Join your team dashboard in a few quick steps.
					</p>

					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<div>
							<label className="text-sm font-medium text-slate-700" htmlFor="name">
								Full name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								value={form.name}
								onChange={handleChange}
								required
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700" htmlFor="email">
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								value={form.email}
								onChange={handleChange}
								required
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700" htmlFor="password">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								value={form.password}
								onChange={handleChange}
								required
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
							/>
							<p className="mt-2 text-xs text-slate-500">
								At least 8 characters, 1 uppercase, 1 special (@#$%^).
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
								Confirm password
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								value={form.confirmPassword}
								onChange={handleChange}
								required
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
							/>
						</div>

						{error ? (
							<p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
								{error}
							</p>
						) : null}

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
						>
							{loading ? "Creating..." : "Create account"}
						</button>
					</form>

					<p className="mt-6 text-sm text-slate-600">
						Already have an account?{" "}
						<Link href="/login" className="font-semibold text-slate-900">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
