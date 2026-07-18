"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavG from "@/components/NavG";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/threads";

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/threads-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || "Incorrect PIN");
        setPin("");
      }
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "relative", zIndex: 2, maxWidth: "420px", margin: "0 auto",
      padding: "120px clamp(20px, 5vw, 64px) 160px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", letterSpacing: "0.28em",
        color: "#c084fc", textTransform: "uppercase", marginBottom: "24px", opacity: 0.75,
      }}>
        private · pin required
      </div>

      <h1 className="void-title" style={{ fontSize: "clamp(40px, 8vw, 64px)" }}>Locked.</h1>

      <p className="void-lede" style={{ "--domain-color": "#c084fc", marginBottom: "40px" } as React.CSSProperties}>
        This part of the vault stays closed unless you have the PIN.
      </p>

      <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.035)",
            border: `1px solid ${error ? "#dc2626" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "4px",
            padding: "14px 18px",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "18px",
            letterSpacing: "0.4em",
            textAlign: "center",
            color: "#eae6f5",
            outline: "none",
            transition: "border-color 0.2s, background 0.2s",
          }}
        />

        {error && (
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px",
            letterSpacing: "0.1em", color: "#dc2626", textTransform: "uppercase",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || pin.length === 0}
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "14px 18px",
            border: "1px solid #c084fc",
            background: "rgba(192,132,252,0.08)",
            color: "#c084fc",
            cursor: submitting || pin.length === 0 ? "default" : "pointer",
            opacity: submitting || pin.length === 0 ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {submitting ? "checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function ThreadsLoginPage() {
  return (
    <>
      <NavG active="Threads" />
      <div className="void-page" style={{ "--domain-color": "#c084fc" } as React.CSSProperties}>
        <div className="void-ambient" />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
