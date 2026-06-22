import { SectionTitle, Stat } from "@/components/ui";
import FeesBrowser from "@/components/FeesBrowser";
import { FEES, FEE_CATEGORIES, feeBase, inr } from "@/lib/fees";

export const metadata = {
  title: "Category-wise Fees · Top Colleges",
  description:
    "Annual category-wise tuition fees for the top MHT-CET engineering colleges, from official / FRA sources.",
};

export default function FeesPage() {
  const withFee = FEES.filter((f) => feeBase(f) != null);
  const official = withFee.filter((f) => f.confidence === "high");
  const bases = withFee.map((f) => feeBase(f) as number).sort((a, b) => a - b);
  const lo = bases[0];
  const hi = bases[bases.length - 1];

  return (
    <div>
      <SectionTitle
        kicker="Money matters"
        title="Category-wise Fees"
        accent="bg-gold"
      />

      <p className="mb-4 max-w-3xl text-[15px] leading-relaxed text-ink/70">
        Annual <strong>tuition&nbsp;+&nbsp;development fee</strong> for the top{" "}
        {FEES.length} colleges (by prestige), researched from official college,
        FRA and DTE sources. In Maharashtra each college has one FRA-approved
        fee; the category columns apply the standard government
        scholarship/freeship concession to that fee — so they show what a
        student of each category actually pays.
      </p>

      <div className="mb-6 max-w-3xl border-l-4 border-flame bg-flame/10 px-4 py-3 text-[13.5px] leading-relaxed text-ink/75">
        <strong>What these numbers are:</strong> every figure is the annual{" "}
        <strong>tuition&nbsp;+&nbsp;development fee</strong> under{" "}
        <strong>CAP&nbsp;/&nbsp;government quota</strong> — <em>not</em> the total
        payable. On top of it, all categories pay exam, university and refundable
        deposit charges (~₹5k–₹20k). Institute-level / management-quota fees
        (often 1.5–2× higher) are <em>not</em> shown.
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Colleges" value={FEES.length} />
        <Stat
          label="Official / FRA sourced"
          value={official.length}
          accent="bg-mint"
        />
        <Stat
          label="OPEN fee range"
          value={
            <span className="text-lg">
              {inr(lo)} – {inr(hi)}
            </span>
          }
          accent="bg-gold"
        />
      </div>

      {/* How category fees work */}
      <div className="nb-card mb-8 p-5">
        <div className="mb-3 inline-block bg-grape px-2 py-0.5 font-display text-[11px] uppercase tracking-widest text-white">
          How category fees work
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="font-display text-base">OPEN · full fee</div>
            <p className="mt-1 text-ink/65">
              OPEN / General pays the entire FRA-approved tuition +
              development fee, with no concession.
            </p>
          </div>
          <div>
            <div className="font-display text-base">
              OBC / EWS / SEBC / VJ-NT / SBC · ~50%
            </div>
            <p className="mt-1 text-ink/65">
              Income ≤ ₹8L qualifies for the Rajarshi Shahu / EBC scheme — about
              half the tuition is reimbursed by the State.
            </p>
          </div>
          <div>
            <div className="font-display text-base">
              SC / ST / TFWS · freeship
            </div>
            <p className="mt-1 text-ink/65">
              Full tuition waiver (100% freeship) for eligible students — net
              tuition is effectively zero.
            </p>
          </div>
        </div>
        <p className="mt-4 border-t-2 border-line pt-3 text-[13px] leading-relaxed text-ink/55">
          <strong>Read me:</strong> figures are the annual tuition + development
          fee only. University, exam and refundable deposit charges (~₹5k–₹20k)
          are extra and broadly the same for all categories. Concession
          categories assume family income ≤ ₹8L and a sanctioned scholarship;
          actual amounts vary by income slab and year. Each row shows the source
          and an <em>Official / Verified / Estimate</em> confidence tag and the
          academic year — always confirm the live figure on the college / FRA
          website before paying.
        </p>
      </div>

      <FeesBrowser fees={FEES} />

      <p className="mt-6 text-[12px] text-ink/45">
        Categories shown:{" "}
        {FEE_CATEGORIES.map((c) => c.label).join(" · ")}. Sources include college
        fee pages, fra.maharashtra.gov.in and DTE Maharashtra.
      </p>
    </div>
  );
}
