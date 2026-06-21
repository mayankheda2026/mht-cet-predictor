import Link from "next/link";

export function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`nb-tag ${className}`}>{children}</span>;
}

export function FundingBadge({ funding, isGov }: { funding: string; isGov?: boolean }) {
  const color = isGov ? "bg-mint" : funding.includes("University") ? "bg-sky text-white" : "bg-white";
  return <Tag className={color}>{funding}</Tag>;
}

const TIER_BG: Record<string, string> = {
  Dream: "bg-grape text-white", Target: "bg-sky text-white", Safe: "bg-mint",
};
export function TierBadge({ tier }: { tier: string }) {
  return <Tag className={TIER_BG[tier] ?? "bg-white"}>{tier}</Tag>;
}

export function Stat({ label, value, accent = "bg-acid" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="nb-card-sm p-4">
      <div className={`mb-2 inline-block ${accent} px-2 py-0.5 text-[10px] font-display uppercase tracking-widest`}>
        {label}
      </div>
      <div className="font-display text-2xl leading-none">{value}</div>
    </div>
  );
}

export function SectionTitle({ kicker, title, accent = "bg-acid" }: { kicker?: string; title: string; accent?: string }) {
  return (
    <div className="mb-5">
      {kicker && <span className={`inline-block ${accent} px-2 py-0.5 text-[11px] font-display uppercase tracking-widest`}>{kicker}</span>}
      <h2 className="nb-h1 mt-2 text-3xl sm:text-4xl">{title}</h2>
    </div>
  );
}

export function pct(n: number | null | undefined) {
  return n == null ? "—" : n.toFixed(3) + "%";
}
export function rank(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString("en-IN");
}

export function CollegeLink({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <Link href={`/college/${code}`} className="underline decoration-acid decoration-4 underline-offset-2 hover:bg-acid">
      {children}
    </Link>
  );
}
