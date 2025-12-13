// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// --- Inline Icons ---
const Icons = {
  Lock: () => (
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
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
  CheckCircle: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-500"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      // Using Native Fetch to avoid import errors
      // Adjust the path based on your routes (e.g., /api/users/resetPassword or /api/auth/resetPassword)
      const res = await fetch(
        `${apiBaseUrl}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, passwordConfirm }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* --- Left Side: Image (Added m-4 rounded-2xl overflow-hidden) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 m-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558465646-94a8c382af74?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Secure Your Account</h1>
          <p className="text-xl text-gray-200 max-w-md leading-relaxed">
            Create a new, strong password to get back to managing your
            architectural projects.
          </p>
        </div>
      </div>

      {/* --- Right Side: Form --- */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:w-1/2 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          {/* Success View */}
          {success ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="flex justify-center mb-4">
                <Icons.CheckCircle />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-600">
                Your password has been updated successfully. <br />
                Redirecting to login...
              </p>
            </div>
          ) : (
            /* Form View */
            <>
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your new credentials below
                </p>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Icons.Lock />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 sm:text-sm"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Icons.Lock />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 sm:text-sm"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Icons.Loader /> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
