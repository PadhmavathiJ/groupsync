import Link from "next/link";

const features = [
  {
    number: "01",
    label: "WHEN",
    title: "Find a time that works for everyone.",
    description:
      "Compare member schedules and instantly rank the best meeting slots based on group availability.",
  },
  {
    number: "02",
    label: "WHERE",
    title: "Meet somewhere fair.",
    description:
      "Compare starting locations and discover meeting places that balance fairness and overall travel.",
  },
  {
    number: "03",
    label: "SETTLE",
    title: "Split expenses without the awkward math.",
    description:
      "Track payments, calculate balances, and clearly see who should pay whom.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0,_transparent_35%),radial-gradient(circle_at_85%_20%,_#f5f3ff_0,_transparent_30%)]" />

        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              One place for every group decision
            </div>

            <h1 className="max-w-3xl text-5xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Less coordinating.
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                More doing.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              GroupSync helps groups find the best time
              to meet, choose a fair meeting place, and
              settle shared expenses — all in one simple
              workflow.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/groups"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 font-semibold text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-indigo-600"
              >
                Create your group
                <span className="ml-2">
                  →
                </span>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              <span>✓ Smart scheduling</span>
              <span>✓ Fair meeting places</span>
              <span>✓ Easy expense splitting</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-indigo-200/50 blur-3xl" />
            <div className="absolute -right-10 bottom-8 h-44 w-44 rounded-full bg-violet-200/50 blur-3xl" />

            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80 sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                    Your group
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    DBMS Project Team
                  </h2>
                </div>

                <div className="flex -space-x-2">
                  {["P", "A", "D", "R"].map(
                    (name, index) => (
                      <div
                        key={`${name}-${index}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-xs font-bold text-white"
                      >
                        {name}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Best time
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-950">
                        Wednesday · 2:00 PM
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-600">
                      Everyone free
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl">
                      ◎
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                      Fair place
                    </p>

                    <p className="mt-1 font-bold text-slate-950">
                      Balanced for everyone
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Compare member locations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl font-bold text-emerald-600">
                      ₹
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Expenses
                    </p>

                    <p className="mt-1 font-bold text-slate-950">
                      Clear group balances
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Know exactly who pays whom.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    One simple workflow
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold">
                      WHEN → WHERE → SETTLE
                    </span>

                    <span className="text-indigo-300">
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              Group planning should be simple
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Stop turning one meetup into
              endless messages.
            </h2>
          </div>

          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Finding a common time, choosing where to
            meet, remembering who paid, and calculating
            what everyone owes are all connected.
            GroupSync keeps them together in one clear
            place.
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
              Three decisions. One smooth flow.
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Everything your group needs from planning
              the meeting to settling the last rupee.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.label}
                className="group rounded-[2rem] border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-600">
                    {feature.number}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tracking-wider text-slate-600">
                    {feature.label}
                  </span>
                </div>

                <h3 className="mt-14 text-2xl font-bold tracking-tight text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-14 text-white sm:px-10 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
                Ready to coordinate smarter?
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Bring your group together without
                the chaos.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Create a group, add your members, and let
                GroupSync help with the decisions that
                usually take the most messages.
              </p>
            </div>

            <Link
              href="/groups"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:bg-indigo-50"
            >
              Start planning →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-700">
            GroupSync
          </p>

          <p>
            Plan together. Meet smarter. Settle easily.
          </p>
        </div>
      </footer>
    </main>
  );
}