"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid place-items-center py-24 px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold m-0 mb-2">Something went wrong</h1>
        <p className="text-muted text-[13px] mt-0 mb-4">
          This screen hit a server error. It usually means the database migrations
          haven&apos;t been applied yet, or Supabase environment variables are missing
          for this deployment.
        </p>
        {error.digest && <p className="text-faint text-[11px] font-mono mb-4">ref: {error.digest}</p>}
        <button
          onClick={reset}
          className="bg-primary text-white rounded-[9px] px-4 py-2 text-sm font-semibold hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
