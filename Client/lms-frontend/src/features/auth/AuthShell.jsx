import { Link } from "react-router-dom";
import { BrandMark } from "../../components/layout/BrandMark";
import { BrandPanel } from "./BrandPanel";

export function AuthShell({ children }) {
  return (
    <main className="min-h-screen bg-white font-sans text-ink">
      <div className="grid min-h-screen md:grid-cols-2">
        <BrandPanel />
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <Link to="/login" className="mb-10 inline-flex lg:hidden">
              <BrandMark />
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
