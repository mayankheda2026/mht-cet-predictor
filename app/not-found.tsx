import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="nb-card inline-block bg-acid px-6 py-3 font-display text-7xl shadow-hardlg">404</div>
      <h1 className="nb-h1 mt-6 text-3xl">This page took a different CAP round.</h1>
      <p className="mt-2 text-ink/70">The college or page you’re looking for doesn’t exist.</p>
      <Link href="/" className="nb-btn-ink mt-6 inline-flex">← Back to Finder</Link>
    </div>
  );
}
