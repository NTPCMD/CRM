"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0b1220", color: "#f9fafb", margin: 0 }}>
        <div style={{ display: "grid", placeItems: "center", height: "100vh", textAlign: "center", padding: 16 }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>A server error occurred while loading AgencyOS.</p>
            {error.digest && <p style={{ color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}>ref: {error.digest}</p>}
            <button
              onClick={reset}
              style={{ background: "#3b82f6", color: "#fff", border: 0, borderRadius: 9, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
