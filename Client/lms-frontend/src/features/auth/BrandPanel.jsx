import { Sparkles } from "lucide-react";
import { BrandMark } from "../../components/layout/BrandMark";

export function BrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex xl:p-16">
      <div className="pointer-events-none absolute -right-32 -bottom-20 h-96 w-96 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-20 -bottom-10 h-72 w-72 rounded-full border border-white/10" />
      <BrandMark inverted />

      <div className="relative z-10 max-w-lg py-12">
        <span className="text-xs font-bold tracking-[0.25em] text-orange">
          YOUR LEARNING SPACE
        </span>
        <h1 className="mt-6 font-display text-5xl leading-tight font-extrabold tracking-tight xl:text-6xl">
          Learn today.
          <br />
          Lead tomorrow.
        </h1>
        <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
          Your courses, assignments, quizzes and academic progress — all organized in one place.
        </p>
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange/15 text-orange">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="font-semibold">Everything in one place</h3>
            <p className="mt-1 text-sm text-slate-300">Stay organized. Keep moving forward.</p>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-xs text-slate-400">Built for learners. Designed for growth.</p>
    </section>
  );
}
