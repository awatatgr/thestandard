import { Navigate } from "react-router-dom";

// Magic link handles both login and signup — redirect to /login
export default function SignupPage() {
  return <Navigate to="/login" replace />;
}
