import Link from "next/link";

const steps = [
  { key: "when", label: "WHEN", detail: "Find a time" },
  { key: "where", label: "WHERE", detail: "Choose a place" },
  { key: "expenses", label: "SETTLE", detail: "Split expenses" },
] as const;

export default function GroupSteps({ groupId, current }: { groupId: string; current: "when" | "where" | "expenses" }) {
  return (
    <nav aria-label="Group planning steps" className="my-6 grid grid-cols-3 gap-2 sm:gap-3">
      {steps.map((step, index) => (
        <Link key={step.key} href={`/groups/${groupId}/${step.key}`} aria-current={current === step.key ? "page" : undefined}
          className={`min-w-0 rounded-2xl border px-3 py-4 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 sm:px-5 ${current === step.key ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"}`}>
          <span className="block text-xs font-bold tracking-wide sm:text-sm"><span className="mr-1 opacity-70">0{index + 1}</span> {step.label}</span>
          <span className={`mt-1 block text-xs sm:text-sm ${current === step.key ? "text-indigo-100" : "text-slate-500"}`}>{step.detail}</span>
        </Link>
      ))}
    </nav>
  );
}
