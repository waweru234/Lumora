import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg-950 grid place-items-center px-4">
      <div className="text-center">
        <p className="text-7xl font-semibold text-green font-mono">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
        <p className="text-muted mt-2 text-sm">The page you were looking for doesn't exist.</p>
        <Link href="/" className="inline-block mt-6 px-4 py-2 rounded bg-green text-bg-950 font-semibold">
          Back home
        </Link>
      </div>
    </main>
  );
}
