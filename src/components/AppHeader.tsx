import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-200 transition group-hover:scale-105">
            G
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">
              GroupSync
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              Plan together. Meet smarter. Settle easily.
            </p>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Dashboard
          </Link>

          <Link
            href="/groups"
            className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Groups
          </Link>

          <Link
            href="/groups#create-group"
            className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
          >
            Start planning
          </Link>
        </nav>
      </div>
    </header>
  );
}