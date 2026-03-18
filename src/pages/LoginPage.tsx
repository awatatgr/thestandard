import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithMagicLink, user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <Mail className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-3">メールを確認してください</h1>
          <p className="text-sm text-zinc-400 mb-2">
            <span className="text-zinc-200 font-medium">{email}</span> にログインリンクを送信しました。
          </p>
          <p className="text-xs text-zinc-600 mb-6">
            メール内のリンクをクリックするとログインできます。
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-primary text-sm hover:underline"
          >
            別のメールアドレスを使う
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-zinc-100 tracking-wider">THE STANDARD</h1>
          <p className="text-sm text-zinc-500 mt-1">メールアドレスでログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-xs text-zinc-400 mb-1 block">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "送信中..." : "ログインリンクを送信"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          パスワード不要 — メールに届くリンクをクリックするだけ
        </p>
      </div>
    </div>
  );
}
