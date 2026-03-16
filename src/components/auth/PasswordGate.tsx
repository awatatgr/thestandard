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
        <div className="text-center space-y-3">
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-foreground">
              THE STANDARD
            </h1>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Demo Preview
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            このサイトは開発中のデモ版です<br />関係者限定でのプレビュー公開中
          </p>
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
