import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6 text-slate-700">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/" className="text-blue-600 underline">
        Back to your list
      </Link>
    </main>
  );
}
