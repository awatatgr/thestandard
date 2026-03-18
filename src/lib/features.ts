export function isAuthEnabled(): boolean {
  return !!import.meta.env.VITE_SUPABASE_URL;
}

export function isPaymentEnabled(): boolean {
  return import.meta.env.VITE_STRIPE_ENABLED === "true";
}

export function getAccessMode(): "public" | "auth_required" | "invite" {
  const mode = import.meta.env.VITE_ACCESS_MODE;
  if (mode === "auth_required" || mode === "invite") return mode;
  return "public";
}
