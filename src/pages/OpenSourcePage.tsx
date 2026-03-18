export default function OpenSourcePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <header className="border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider">THE STANDARD</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">OSS</span>
          </div>
          <a href="https://github.com/awatatgr/thestandard"
             target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">
            GitHub
          </a>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          マルチアングル動画ホスティングを、
          <br />
          <span className="text-primary">あなたのサービスに。</span>
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          THE STANDARD はオープンソースの動画ホスティングプラットフォーム。
          マルチアングル同期再生、管理ダッシュボード、Embed、決済連携を
          1つのパッケージで提供します。
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="https://github.com/awatatgr/thestandard"
             target="_blank" rel="noopener noreferrer"
             className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
            GitHub で見る
          </a>
          <a href="#setup"
             className="px-6 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors">
            セットアップ
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-center mb-12">主な機能</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "マルチアングル同期再生", desc: "最大4アングルの同期再生。メイン+サブ / 均等レイアウトを自由に切替。0.15秒以内の精度で同期。" },
            { title: "Embed (iframe)", desc: "リッチ版とシンプル版の2モード。レイアウト・チャプター・字幕コントロール付き。postMessage APIで外部制御。" },
            { title: "管理ダッシュボード", desc: "動画CRUD、サムネイル、ステータス管理（draft/published/archived）、検索・フィルター。" },
            { title: "チャプターナビ", desc: "エクササイズ単位のチャプター。クリックジャンプ、進捗ドット、サイドバータブ。" },
            { title: "認証 & 決済", desc: "Supabase Auth統合。Stripe決済はオプション — 環境変数でON/OFF。社内利用なら無料公開も可。" },
            { title: "セルフホスト", desc: "Cloudflare Pages + Supabase で完結。docker-composeでローカル開発。AGPL-3.0ライセンス。" },
          ].map((f) => (
            <div key={f.title} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-zinc-100 mb-2">{f.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-zinc-900/50 border-y border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h3 className="text-2xl font-bold text-center mb-12">ユースケース</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { title: "ジム・パーソナルトレーニング", desc: "トレーナーの指導をマルチアングルで記録。会員がいつでもフォームを確認できる。" },
              { title: "武道・ダンス教室", desc: "型やルーティンを正面・側面から撮影。自主練習のクオリティを向上。" },
              { title: "リハビリ・医療", desc: "患者の動作を記録し、回復過程を可視化。専門家間での共有にも。" },
              { title: "社内研修・教育", desc: "実技指導を動画化して全拠点に配信。新人教育のクオリティを均一化。" },
            ].map((u) => (
              <div key={u.title} className="flex gap-3">
                <div className="w-1 bg-primary rounded-full shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-1">{u.title}</h4>
                  <p className="text-xs text-zinc-500">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup */}
      <section id="setup" className="max-w-3xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-center mb-8">3ステップで始める</h3>
        <div className="space-y-6">
          {[
            { step: "1", title: "クローン", code: "git clone https://github.com/awatatgr/thestandard\ncd thestandard && npm install" },
            { step: "2", title: "設定", code: "cp .env.example .env\n# Supabase URL, Bunny CDN hostname を設定" },
            { step: "3", title: "起動", code: "npm run dev\n# → http://localhost:8080" },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {s.step}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-zinc-200 mb-2">{s.title}</h4>
                <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">
                  <code>{s.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo embed */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-center mb-8">デモ</h3>
        <div className="rounded-xl overflow-hidden border border-zinc-800/60">
          <iframe
            src="/embed/trainer-session"
            className="w-full aspect-video"
            allow="fullscreen"
            frameBorder="0"
          />
        </div>
        <p className="text-center text-xs text-zinc-500 mt-3">
          ↑ このプレイヤーは <code className="bg-zinc-800 px-1 rounded">&lt;iframe&gt;</code> で埋め込まれています
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-8">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-zinc-600">
          <span>THE STANDARD — AGPL-3.0 License</span>
          <a href="https://github.com/awatatgr/thestandard"
             target="_blank" rel="noopener noreferrer"
             className="hover:text-zinc-400 transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
