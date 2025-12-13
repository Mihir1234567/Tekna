// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// --- Inline Icons ---
const Icons = {
  Mail: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Loader: () => (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-600"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // --- FIX IS HERE: Changed /api/users/ to /api/auth/ ---
      const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Something went wrong. Please try again."
        );
      }

      setMessage(data.message || "Password reset link sent to your email.");
    } catch (err) {
      console.error("Forgot password error:", err);
      // Handle HTML 404 responses gracefully
      if (err.message.includes("Unexpected token")) {
        setError(
          "Server error: The endpoint was not found (404). Please check backend routes."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* --- Left Side: Image (Added m-4 rounded-2xl overflow-hidden) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 m-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Account Recovery</h1>
          <p className="text-xl text-gray-200 max-w-md leading-relaxed">
            Don't worry, it happens. Enter your email and we'll help you get
            back into your Tekna workspace.
          </p>
        </div>
      </div>

      {/* --- Right Side: Form --- */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:w-1/2 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Forgot Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We'll send you a link to reset it.
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3 animate-fade-in">
              <Icons.CheckCircle />
              <div>
                <h3 className="text-sm font-bold text-green-800">
                  Check your inbox
                </h3>
                <p className="text-sm text-green-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Icons.Loader /> : "Send Reset Link"}
            </button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Remember your password?
              </span>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <Icons.ArrowLeft /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
