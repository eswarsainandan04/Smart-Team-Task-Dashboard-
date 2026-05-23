"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[@#$%^]).{8,}$/;

export default function ResetPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [otpVerified, setOtpVerified] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSendOtp = async (event) => {
		event.preventDefault();
		if (loading) return;
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch("/api/reset_password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "send_otp", email }),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				if (response.status === 404) {
					window.alert(data.message || "This email doesn't exist");
				}
				if (response.status === 400 && data.message === "Please request OTP first") {
					window.alert(data.message);
				}
				setError(data.message || "Failed to send OTP");
				return;
			}

			setOtpSent(true);
			setOtpVerified(false);
			setSuccess(data.message || "OTP sent to your email");
		} catch {
			setError("Unable to reach server");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (event) => {
		event.preventDefault();
		if (loading) return;
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch("/api/reset_password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "verify_otp", email, otp }),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				if (response.status === 400 && data.message === "Please request OTP first") {
					window.alert(data.message);
				}
				setError(data.message || "OTP verification failed");
				return;
			}

			setOtpVerified(true);
			setSuccess("OTP verified. You can now reset your password.");
		} catch {
			setError("Unable to reach server");
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (event) => {
		event.preventDefault();
		if (loading) return;

		setError("");
		setSuccess("");

		if (!PASSWORD_RULE.test(password)) {
			setError("Password must be at least 8 chars with 1 uppercase and 1 special char (@#$%^).");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/reset_password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reset_password",
					email,
					otp,
					password,
					confirm_password: confirmPassword,
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				if (response.status === 400 && data.message === "Please request OTP first") {
					window.alert(data.message);
				}
				setError(data.message || "Failed to reset password");
				return;
			}

			setSuccess("Password reset successful. Redirecting to login...");
			setTimeout(() => {
				router.replace("/login");
			}, 1200);
		} catch {
			setError("Unable to reach server");
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
					<h1 className="mt-3 text-2xl font-semibold text-slate-900">Forgot password</h1>
					<p className="mt-2 text-sm text-slate-600">
						Enter your email, verify OTP, and set a new password.
					</p>

					<form onSubmit={handleSendOtp} className="mt-6 space-y-4">
						<div>
							<label className="text-sm font-medium text-slate-700" htmlFor="email">
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								disabled={otpSent}
								className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
							/>
						</div>

						{!otpSent ? (
							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{loading ? "Sending OTP..." : "Send OTP"}
							</button>
						) : null}
					</form>

					{otpSent ? (
						<form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
							<div>
								<label className="text-sm font-medium text-slate-700" htmlFor="otp">
									6-digit OTP
								</label>
								<input
									id="otp"
									type="text"
									inputMode="numeric"
									maxLength={6}
									value={otp}
									onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
									required
									disabled={otpVerified}
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
								/>
							</div>

							{!otpVerified ? (
								<button
									type="submit"
									disabled={loading}
									className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
								>
									{loading ? "Verifying..." : "Verify OTP"}
								</button>
							) : null}
						</form>
					) : null}

					{otpVerified ? (
						<form onSubmit={handleResetPassword} className="mt-4 space-y-4">
							<div>
								<label className="text-sm font-medium text-slate-700" htmlFor="new_password">
									New password
								</label>
								<input
									id="new_password"
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
								/>
							</div>
							<div>
								<label className="text-sm font-medium text-slate-700" htmlFor="confirm_password">
									Confirm password
								</label>
								<input
									id="confirm_password"
									type="password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									required
									className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
								/>
							</div>

							<p className="text-xs text-slate-500">
								Password must be at least 8 characters with 1 uppercase and 1 special character (@#$%^).
							</p>

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{loading ? "Resetting..." : "Reset Password"}
							</button>
						</form>
					) : null}

					{error ? (
						<p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
					) : null}

					{success ? (
						<p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
					) : null}

					<p className="mt-6 text-sm text-slate-600">
						Back to{" "}
						<Link href="/login" className="font-semibold text-slate-900">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
