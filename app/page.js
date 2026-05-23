import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Smart Team
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Register
            </Link>
          </nav>
        </header>

        <section className="mt-14">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            A clear, shared view of every task your team owns.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Smart Team Task Dashboard keeps projects aligned, highlights the next
            best action, and turns updates into calm, consistent momentum.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400"
            >
              Create account
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Instant status",
              description: "See what is blocked, moving, or waiting in a single glance.",
            },
            {
              title: "Focused priorities",
              description: "Surface what matters most and keep the team pointed forward.",
            },
            {
              title: "Clear ownership",
              description: "Every task has a name, a timeline, and a next step.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
