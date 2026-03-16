import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-[0.2em] text-foreground">
            THE STANDARD
          </span>
        </Link>
      </div>
    </header>
  );
}
