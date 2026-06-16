import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.resetPassword(token, password);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Task Tracker</h1>
        <h2>New Password</h2>
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
        {!token && (
          <div className="error">No reset token provided in URL.</div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            disabled={!token}
          />
          <button type="submit" disabled={loading || !token}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
