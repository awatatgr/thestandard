import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-[0.2em] text-foreground">
            THE STANDARD
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Demo
          </span>
        </Link>
      </div>
    </header>
  );
}
