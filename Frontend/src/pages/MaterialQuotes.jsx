// src/pages/MaterialQuotes.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Inline Icons (kept small and local) ---
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

// demo fallback entry (used only if API returns empty)
const DEMO_ENTRY = {
  _id: "demo-1",
  recipientInfo: {
    toName: "Demo Customer",
    company: "Demo Builders",
    address: "123 Demo Lane",
  },
  status: "pending",
  totalValue: 12500,
  createdAt: new Date().toISOString(),
  materials: [
    {
      description: "Aluminium Channel 50x20",
      unit: "pcs",
      qty: 10,
      rate: 500,
      amount: 5000,
    },
    {
      description: "Glass 6mm",
      unit: "sqft",
      qty: 100,
      rate: 75,
      amount: 7500,
    },
  ],
};

// Robust customer name resolver
const getCustomerName = (doc) => {
  if (!doc) return "—";
  // look for common shapes
  if (doc.recipientInfo?.toName) return doc.recipientInfo.toName;
  if (doc.clientInfo?.clientName) return doc.clientInfo.clientName;
  if (doc.clientName) return doc.clientName;
  if (doc.customerName) return doc.customerName;
  if (doc.customer)
    return typeof doc.customer === "string"
      ? doc.customer
      : doc.customer.name || "—";
  // fallback id-based
  if (doc._id) return `#${doc._id}`;
  if (doc.id) return `#${doc.id}`;
  return "—";
};

export default function MaterialQuotes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
  });
  const navigate = useNavigate();

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/api/materials`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to fetch materials:", res.status, txt);
        // show demo entry if fetch fails
        setItems([DEMO_ENTRY]);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // expecting data.items or data.materials or an array directly
      const list =
        data.items || data.materials || (Array.isArray(data) ? data : []);
      if (!list || list.length === 0) {
        // show demo entry when API returns empty
        setItems([DEMO_ENTRY]);
      } else {
        setItems(list);
      }
    } catch (err) {
      console.error("Fetch materials error:", err);
      // show demo entry on network error
      setItems([DEMO_ENTRY]);
    } finally {
      setLoading(false);
    }
  };

  // helper: treat demo entries locally (no network call)
  const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

  const handleDelete = async (idToDelete) => {
    // demo: remove locally
    if (isDemoId(idToDelete)) {
      setItems((p) =>
        p.filter((it) => it._id !== idToDelete && it.id !== idToDelete)
      );
      setDeleteConfirmation({ isOpen: false, id: null });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/api/materials/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Failed to delete material quotation.");
        return;
      }
      setItems((p) =>
        p.filter((it) => it._id !== idToDelete && it.id !== idToDelete)
      );
      setDeleteConfirmation({ isOpen: false, id: null });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    // demo: update locally
    if (isDemoId(id)) {
      setItems((prev) =>
        prev.map((it) => (it._id === id ? { ...it, status: newStatus } : it))
      );
      setEditingStatus(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/api/materials/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Failed to update status.");
        return;
      }
      setItems((prev) =>
        prev.map((it) =>
          it._id === id || it.id === id ? { ...it, status: newStatus } : it
        )
      );
      setEditingStatus(null);
    } catch (err) {
      console.error("Status update error:", err);
      alert("Server error while updating status.");
    }
  };

  const openEdit = (doc) => {
    // navigate to material config page in edit mode
    navigate("/material-config", {
      state: {
        mode: "edit",
        materialId: doc._id || doc.id,
        materials: doc.materials || doc.items || doc.lines || [],
        recipientInfo: doc.recipientInfo || doc.clientInfo || {},
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-blue-500 rounded-full mb-2"></div>
          <span className="text-gray-500 font-medium">
            Loading material quotations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Material Quotations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your material delivery notes & quotations.
            </p>
          </div>

          <button
            onClick={() => navigate("/material-config")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Icons.Plus />
            Create Material Quote
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icons.Plus />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No material quotations
            </h3>
            <p className="mt-1 text-gray-500">
              Create one to start recording material deliveries.
            </p>
            <button
              onClick={() => navigate("/material-config")}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700"
            >
              Start a new material quotation &rarr;
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {items.map((doc) => {
                const id = doc._id || doc.id || doc.materialId;
                return (
                  <div
                    key={id}
                    className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Customer
                        </span>
                        <p className="text-lg font-medium text-gray-900 break-words">
                          {getCustomerName(doc)}
                        </p>
                      </div>
                      <div className="relative">
                        {editingStatus === id ? (
                          <select
                            value={doc.status || "pending"}
                            onChange={(e) =>
                              handleStatusChange(id, e.target.value)
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
                            onClick={() => setEditingStatus(id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              doc.status === "approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : doc.status === "rejected"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {(doc.status || "pending").charAt(0).toUpperCase() +
                              (doc.status || "pending").slice(1)}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-b border-gray-100 py-3 my-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Total Value
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          ₹
                          {(
                            doc.totalValue ||
                            doc.grandTotal ||
                            doc.total ||
                            0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => navigate(`/material-details/${id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100"
                      >
                        <Icons.Eye /> View
                      </button>
                      <button
                        onClick={() => openEdit(doc)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100"
                      >
                        <Icons.Edit /> Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmation({ isOpen: true, id })
                        }
                        className="flex-none flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100"
                        aria-label="Delete"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total Value</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((doc) => {
                    const id = doc._id || doc.id || doc.materialId;
                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getCustomerName(doc)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                            {editingStatus === id ? (
                              <select
                                value={doc.status || "pending"}
                                onChange={(e) =>
                                  handleStatusChange(id, e.target.value)
                                }
                                onBlur={() => setEditingStatus(null)}
                                autoFocus
                                className="block w-32 py-1 pl-2 pr-8 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingStatus(id)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-transform hover:scale-105 ${
                                  doc.status === "approved"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : doc.status === "rejected"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      doc.status === "approved"
                                        ? "bg-green-500"
                                        : doc.status === "rejected"
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                    }`}
                                  ></span>
                                  {(doc.status || "pending")
                                    .charAt(0)
                                    .toUpperCase() +
                                    (doc.status || "pending").slice(1)}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ₹
                          {(
                            doc.totalValue ||
                            doc.grandTotal ||
                            doc.total ||
                            0
                          ).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/material-details`)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Icons.Eye />
                            </button>
                            <button
                              onClick={() => openEdit(doc)}
                              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icons.Edit />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmation({ isOpen: true, id })
                              }
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
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

      {/* Delete confirmation modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Icons.Alert />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Delete material quote?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently remove the material quotation and its
                lines.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    setDeleteConfirmation({ isOpen: false, id: null })
                  }
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmation.id)}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
