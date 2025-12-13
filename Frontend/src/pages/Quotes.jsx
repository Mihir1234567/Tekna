// src/pages/Quotes.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";

// --- Inline Icons to avoid external dependencies ---
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
  Edit: () => (
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
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  Trash: () => (
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  Alert: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-600"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
};

/**
 * Helper to robustly find a customer name inside a quote object.
 * Tries common property names used in the app:
 * - recipientInfo?.toName (used in Material/Quote details)
 * - toName
 * - customerName
 * - clientName
 * - customer
 * Falls back to `#<quoteId>` if none are present.
 */
const getCustomerName = (q) => {
  if (!q) return "";
  // try nested recipientInfo.toName
  if (q.recipientInfo?.toName) return q.recipientInfo.toName;
  if (q.toName) return q.toName;
  if (q.customerName) return q.customerName;
  if (q.clientName) return q.clientName;
  if (q.customer) return q.customer;
  // sometimes contact info may be under client or recipient
  if (q.recipient) {
    if (typeof q.recipient === "string") return q.recipient;
    if (q.recipient.name) return q.recipient.name;
  }
  // fallback: show quoteId so the UI never appears empty
  return q.quoteId ? `#${q.quoteId}` : "—";
};

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    quoteId: null,
  });
  const [editingStatus, setEditingStatus] = useState(null);
  const navigate = useNavigate();

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await apiGet("/quotes", token);

      if (data && data.items) {
        setQuotes(data.items);
      } else {
        toast.error(data.message || "Failed to load quotes.");
      }
    } catch (err) {
      console.error("Fetch quotes error:", err);
      toast.error("Server error while fetching quotes.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (quoteId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBaseUrl}/api/quotes/${quoteId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.quote) {
        toast.error("Could not load quote for editing");
        return;
      }
      navigate("/configurator", {
        state: {
          mode: "edit",
          quoteId: data.quote.quoteId,
          windows: data.quote.windows,
          status: data.quote.status,
        },
      });
    } catch (error) {
      console.error("Edit load error:", error);
      toast.error("Server error loading quote for edit.");
    }
  };

  const handleDelete = async (quoteIdToDelete) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBaseUrl}/api/quotes/${quoteIdToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to delete quote.");
        return;
      }
      setQuotes((prevQuotes) =>
        prevQuotes.filter((q) => q.quoteId !== quoteIdToDelete)
      );
      setDeleteConfirmation({ isOpen: false, quoteId: null });
      toast.success("Quote deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Server error while deleting quote.");
    }
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBaseUrl}/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update status.");
        return;
      }
      setQuotes((prevQuotes) =>
        prevQuotes.map((q) =>
          q.quoteId === quoteId ? { ...q, status: newStatus } : q
        )
      );
      setEditingStatus(null);
    } catch (error) {
      console.error("Status change error:", error);
      toast.error("Server error while changing status.");
    }
  };

  // --- Visual Helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-blue-500 rounded-full mb-2"></div>
          <span className="text-gray-500 font-medium">Loading quotes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Quotes</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track your window quotations.
            </p>
          </div>
          <button
            onClick={() => navigate("/configurator")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Icons.Plus />
            Create Quote
          </button>
        </div>

        {quotes.length === 0 ? (
          // Empty State
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icons.Plus />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No quotes created yet
            </h3>
            <p className="mt-1 text-gray-500">
              Get started by creating your first configuration.
            </p>
            <button
              onClick={() => navigate("/configurator")}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              Start a new quote &rarr;
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards (Visible on small screens) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {quotes.map((q) => (
                <div
                  key={q._id}
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Customer
                      </span>
                      <p className="text-lg font-medium text-gray-900 break-words">
                        {getCustomerName(q)}
                      </p>
                    </div>
                    <div className="relative">
                      {editingStatus === q.quoteId ? (
                        <select
                          value={q.status}
                          onChange={(e) =>
                            handleStatusChange(q.quoteId, e.target.value)
                          }
                          onBlur={() => setEditingStatus(null)}
                          autoFocus
                          className="text-xs py-1 pl-2 pr-7 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingStatus(q.quoteId)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            q.status
                          )}`}
                        >
                          {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-b border-gray-100 py-3 my-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Grand Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        ₹{q.grandTotal?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => navigate(`/quote/${q.quoteId}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100"
                    >
                      <Icons.Eye /> View
                    </button>
                    <button
                      onClick={() => handleEdit(q.quoteId)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100"
                    >
                      <Icons.Edit /> Edit
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirmation({
                          isOpen: true,
                          quoteId: q.quoteId,
                        })
                      }
                      className="flex-none flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100"
                      aria-label="Delete"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (Visible on medium+ screens) */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.map((q) => (
                    <tr
                      key={q._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getCustomerName(q)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          {editingStatus === q.quoteId ? (
                            <select
                              value={q.status}
                              onChange={(e) =>
                                handleStatusChange(q.quoteId, e.target.value)
                              }
                              onBlur={() => setEditingStatus(null)}
                              autoFocus
                              className="block w-32 py-1 pl-2 pr-8 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingStatus(q.quoteId)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-transform hover:scale-105 ${getStatusColor(
                                q.status
                              )}`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    q.status === "approved"
                                      ? "bg-green-500"
                                      : q.status === "rejected"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                  }`}
                                ></span>
                                {q.status.charAt(0).toUpperCase() +
                                  q.status.slice(1)}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{q.grandTotal?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/quote/${q.quoteId}`)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            onClick={() => handleEdit(q.quoteId)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Configuration"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                quoteId: q.quoteId,
                              })
                            }
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Quote"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, quoteId: null })}
        onConfirm={() => handleDelete(deleteConfirmation.quoteId)}
        title={`Delete Quote ${
          deleteConfirmation.quoteId ? `#${deleteConfirmation.quoteId}` : ""
        }?`}
        message="Are you sure you want to delete this quote? This action cannot be undone and all associated data will be lost."
        confirmText="Delete Quote"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
