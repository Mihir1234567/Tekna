// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// --- Inline Icons ---
const Icons = {
  Plus: () => (
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),
  Clock: () => (
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
      className="text-yellow-600"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  FileText: () => (
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
      className="text-blue-600"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
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
  ArrowRight: () => (
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
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  ),
  Eye: () => (
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 });

  // --- NEW: State for Username ---
  const [userName, setUserName] = useState("User");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        // --- NEW: Get User Name from Local Storage ---
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Tries to find 'name' or 'username', defaults to 'User'
            setUserName(parsedUser.name || parsedUser.username || "User");
          } catch (e) {
            console.error("Error parsing user data", e);
          }
        }

        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch quotes and materials in parallel
        const [quotesRes, materialsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/quotes`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiBaseUrl}/api/materials`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // quotes
        if (quotesRes && quotesRes.ok) {
          const qData = await quotesRes.json();
          const qItems = qData.items || [];
          setRecentQuotes(qItems.slice(0, 5));
          setStats({
            pending: qItems.filter((q) => q.status === "pending").length,
            approved: qItems.filter((q) => q.status === "approved").length,
            total: qItems.length,
          });
        } else {
          setRecentQuotes([]);
        }

        // materials
        if (materialsRes && materialsRes.ok) {
          const mData = await materialsRes.json();
          // expect data.items or data.materials or array
          const mItems =
            mData.items ||
            mData.materials ||
            (Array.isArray(mData) ? mData : []);
          setRecentMaterials(mItems.slice(0, 5));
        } else {
          setRecentMaterials([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, apiBaseUrl]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  // helper to safely get customer name with fallbacks (quotes)
  const getCustomerName = (q) =>
    q?.customerName ||
    q?.customer ||
    q?.clientName ||
    q?.toName ||
    q?.name ||
    (q?.quoteId ? `#${q.quoteId}` : "Unknown");

  // helper for material docs (looks for recipientInfo.toName etc)
  const getMaterialCustomerName = (m) =>
    m?.recipientInfo?.toName ||
    m?.recipientInfo?.company ||
    m?.clientName ||
    m?.customerName ||
    m?.customer ||
    (m?._id ? `#${m._id}` : "Unknown");

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto bg-gray-50/50 min-h-screen">
      {/* --- Header Section --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {/* --- UPDATED: Display Dynamic User Name --- */}
          <h2 className="text-2xl font-bold text-gray-900">
            Hello, {userName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Here's what's happening with your quotes and material deliveries
            today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/configurator")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Icons.Plus />
            New Quote
          </button>
          <button
            onClick={() => navigate("/material-config")}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Icons.Plus />
            New Material
          </button>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Awaiting Approval
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {stats.pending}
            </h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Icons.Clock />
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Approved Quotes</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {stats.approved}
            </h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Icons.CheckCircle />
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Quotes</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icons.FileText />
          </div>
        </div>
      </div>

      {/* --- Recent Quotes Section --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-800">Recent Quotes</h3>
          <button
            onClick={() => navigate("/quotes")}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All <Icons.ArrowRight />
          </button>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recent quote activity found.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentQuotes.map((q, idx) => {
                const custName = getCustomerName(q);
                const key = q?.quoteId || q?._id || idx;
                return (
                  <div
                    key={key}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {custName}
                        </div>
                        {q?.quoteId && (
                          <div className="text-sm font-mono text-gray-500 mt-1">
                            #{q.quoteId}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(
                          q.status
                        )}`}
                      >
                        {q.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-900">
                        ₹{q.grandTotal?.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() =>
                          navigate(`/quote/${q.quoteId || q._id || ""}`)
                        }
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                      >
                        <Icons.Eye />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentQuotes.map((q, idx) => {
                    const custName = getCustomerName(q);
                    const key = q?.quoteId || q?._id || idx;
                    return (
                      <tr
                        key={key}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {custName}
                          </div>
                          {q?.quoteId && (
                            <div className="text-xs font-mono text-gray-500 mt-1">
                              #{q.quoteId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(
                              q.status
                            )}`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ₹{q.grandTotal?.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(`/quote/${q.quoteId || q._id || ""}`)
                            }
                            className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- Recent Material Quotes Section (NEW) --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-800">Recent Material Quotes</h3>
          <button
            onClick={() => navigate("/material-quotes")}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All <Icons.ArrowRight />
          </button>
        </div>

        {recentMaterials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recent material activity found.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentMaterials.map((m, idx) => {
                const custName = getMaterialCustomerName(m);
                const id = m?._id || m?.id || idx;
                return (
                  <div
                    key={id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {custName}
                        </div>
                        {m?.docNumber && (
                          <div className="text-sm font-mono text-gray-500 mt-1">
                            #{m.docNumber}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(
                          m.status
                        )}`}
                      >
                        {m.status || "pending"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-900">
                        ₹
                        {(
                          m.totalValue ||
                          m.grandTotal ||
                          m.total ||
                          0
                        ).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => navigate(`/material-details/${id}`)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                      >
                        <Icons.Eye />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentMaterials.map((m, idx) => {
                    const custName = getMaterialCustomerName(m);
                    const id = m?._id || m?.id || idx;
                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {custName}
                          </div>
                          {m?.docNumber && (
                            <div className="text-xs font-mono text-gray-500 mt-1">
                              #{m.docNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(
                              m.status
                            )}`}
                          >
                            {m.status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ₹
                          {(
                            m.totalValue ||
                            m.grandTotal ||
                            m.total ||
                            0
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/material-details/${id}`)}
                            className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
