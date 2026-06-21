"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Finder" },
  { href: "/explore", label: "Explore" },
  { href: "/colleges", label: "Colleges" },
  { href: "/search", label: "Search" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b-3 border-ink transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-paper/85 backdrop-blur-md shadow-hardsm" : "bg-paper"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center border-3 border-ink bg-acid font-display text-lg shadow-hardsm transition-transform duration-200 ease-brut group-hover:-rotate-6 group-hover:scale-105">
            C
          </span>
          <span className="font-display text-xl uppercase tracking-tight">
            Capstone
          </span>
          <span className="ml-1 hidden border-2 border-ink bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ink/60 sm:inline-block">
            2025-26
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`group relative px-2.5 py-2 font-display text-[13px] uppercase tracking-tight transition-colors duration-150 sm:px-3.5 sm:text-sm ${
                  active ? "text-ink" : "text-ink/50 hover:text-ink"
                }`}
              >
                {n.label}
                {/* active / hover underline indicator */}
                <span
                  className={`pointer-events-none absolute inset-x-2 bottom-1 h-[3px] origin-left bg-acid transition-transform duration-200 ease-brut ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
