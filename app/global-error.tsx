"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error boundary — catches errors that escape the root layout
 * (e.g. errors in the layout itself, or in the root ErrorBoundary).
 *
 * This component MUST render its own <html> and <body> because it
 * replaces the entire layout tree when activated.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an external service in production (e.g. Sentry).
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            background: "#fff",
            borderRadius: "1.5rem",
            border: "1px solid #FDE68A",
            padding: "3rem 2rem",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: "3.5rem" }}>⚠️</span>

          <h1
            style={{
              marginTop: "1rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1C1917",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#57534E",
            }}
          >
            The page hit an unexpected error and could not be rendered. You can
            try reloading or heading back to the home page.
          </p>

          {process.env.NODE_ENV === "development" && (
            <pre
              style={{
                marginTop: "1rem",
                maxHeight: "8rem",
                overflow: "auto",
                borderRadius: "0.75rem",
                background: "#FEF2F2",
                padding: "0.75rem",
                textAlign: "left",
                fontSize: "0.7rem",
                lineHeight: 1.5,
                color: "#B91C1C",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
              {"\n"}
              {error.stack}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          )}

          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                background:
                  "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(249,115,22,0.25)",
              }}
            >
              Try Again
            </button>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "1.5px solid #F97316",
                color: "#F97316",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Go to Home
            </Link>
          </div>

          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "0.7rem",
              color: "#A8A29E",
            }}
          >
            🙏 We apologize for the inconvenience
          </p>
        </div>
      </body>
    </html>
  );
}
