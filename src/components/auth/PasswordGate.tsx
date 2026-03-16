import { useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "thestandard_auth";

function check(input: string): boolean {
  return input === "REDACTED_PASSWORD";
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (check(value)) {
        setAuthed(true);
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
      } else {
        setError(true);
        setTimeout(() => setError(false), 1500);
      }
    },
    [value],
  );

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-[0.2em] text-foreground">
            THE STANDARD
          </h1>
          <p className="text-sm text-muted-foreground">パスワードを入力してください</p>
        </div>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-3 rounded-lg bg-card border text-foreground text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
            error ? "border-destructive ring-2 ring-destructive" : "border-border"
          }`}
        />
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Enter
        </button>
        {error && (
          <p className="text-center text-sm text-destructive">パスワードが正しくありません</p>
        )}
      </form>
    </div>
  );
}
