// src/pages/Configurator.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Window3D from "../components/Window3D";

// --- Inline Icons ---
const Icons = {
  RotateCcw: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  Trash: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
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
  Edit: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
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
  Copy: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  Alert: () => (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
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
  X: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 18 18" />
    </svg>
  ),
  Check: () => (
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function Configurator() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  // --- State ---
  const editMode = location.state?.mode === "edit";
  const loadedWindows = location.state?.windows || [];
  const editingQuoteId = location.state?.quoteId || null;

  // New State for Client Info
  const [clientInfo, setClientInfo] = useState({
    clientName: "",
    project: "",
    finish: "",
  });

  const [width, setWidth] = useState(36);
  const [height, setHeight] = useState(48);
  const [quantity, setQuantity] = useState(1);
  const [windowType, setWindowType] = useState("normal");
  const [windowList, setWindowList] = useState([]);

  // Form & Error State
  const [formData, setFormData] = useState({
    profileSystem: "",
    design: "",
    glassType: "",
    grill: "",
    locking: "",
    hardware: "",
    make: "",
    mess: "",
    pricePerFt: "",
  });
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  // --- Effects ---
  useEffect(() => {
    // If we were navigated with windows in state, prefer that.
    if (editMode && loadedWindows.length > 0) {
      setWindowList(loadedWindows);
    }

    // If client info passed in state (from previous navigation), use it
    if (editMode && location.state?.clientInfo) {
      setClientInfo(location.state.clientInfo);
    }

    // If in edit mode but clientInfo not provided, fetch the full quote from API
    // This ensures clientName/project/finish are populated when editing an existing quote.
    const fetchQuoteForEdit = async () => {
      if (!editMode || !editingQuoteId) return;

      // If client info already present, skip fetch
      const hasClientInfo =
        location.state?.clientInfo ||
        clientInfo.clientName ||
        clientInfo.project ||
        clientInfo.finish;
      if (hasClientInfo && loadedWindows.length > 0) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return; // user not logged in

        const res = await fetch(`${apiBaseUrl}/api/quotes/${editingQuoteId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.warn("Failed to fetch quote for edit:", res.status);
          return;
        }

        const data = await res.json();
        const quote = data.quote || data; // adapt to payload shape

        // populate windows if not already loaded from navigation state
        if ((!loadedWindows || loadedWindows.length === 0) && quote.windows) {
          setWindowList(quote.windows);
        }

        // Try multiple possible places for client info that backend might return
        const possibleClientInfo =
          quote.clientInfo ||
          quote.recipientInfo ||
          (quote.clientName || quote.project || quote.finish
            ? {
                clientName: quote.clientName || "",
                project: quote.project || "",
                finish: quote.finish || "",
              }
            : null) ||
          null;

        if (possibleClientInfo) {
          // unify structure
          setClientInfo({
            clientName:
              possibleClientInfo.clientName ||
              possibleClientInfo.toName ||
              possibleClientInfo.customerName ||
              possibleClientInfo.client ||
              "",
            project:
              possibleClientInfo.project ||
              possibleClientInfo.projectRef ||
              possibleClientInfo.projectName ||
              "",
            finish:
              possibleClientInfo.finish ||
              possibleClientInfo.finishType ||
              possibleClientInfo.surfaceFinish ||
              "",
          });
        }
      } catch (err) {
        console.error("Error fetching quote data:", err);
      }
    };

    fetchQuoteForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, loadedWindows, location.state, editingQuoteId]);

  // --- Handlers ---
  const requiredFields = [
    ["profileSystem", "Profile System"],
    ["design", "Design"],
    ["glassType", "Glass Type"],
    ["grill", "Grill"],
    ["locking", "Locking"],
    ["hardware", "Hardware"],
    ["make", "Make"],
    ["mess", "Mess"],
  ];

  const validateFields = () => {
    const newErrors = {};
    if (!height || Number(height) <= 0) newErrors.height = "Required";
    if (!width || Number(width) <= 0) newErrors.width = "Required";

    const priceStr = String(formData.pricePerFt || "").trim();
    const ppf = Number(priceStr);
    if (!priceStr || isNaN(ppf) || ppf <= 0)
      newErrors.pricePerFt = "Required (>0)";

    requiredFields.forEach(([key, label]) => {
      if (!formData[key]?.toString().trim()) newErrors[key] = "Required";
    });

    setErrors(newErrors);
    const ok = Object.keys(newErrors).length === 0;
    setBannerError(ok ? "" : "Please fill in all required fields.");
    return ok;
  };

  const handleAddOrUpdateWindow = () => {
    if (!validateFields()) return;

    const h = Number(height);
    const w = Number(width);
    const p = Number(formData.pricePerFt);
    const q = Number(quantity);
    const sqFt = (h / 12) * (w / 12);
    const amount = sqFt * p * q;

    const entry = {
      width: w,
      height: h,
      quantity: q,
      windowType,
      ...formData,
      pricePerFt: p,
      sqFt: Number(sqFt.toFixed(2)),
      amount: Number(amount.toFixed(2)),
    };

    if (editIndex !== null) {
      const updatedList = [...windowList];
      updatedList[editIndex] = entry;
      setWindowList(updatedList);
      setEditIndex(null);
    } else {
      setWindowList((prev) => [...prev, entry]);
    }
    resetForm();
  };

  const resetForm = () => {
    setWidth(36);
    setHeight(48);
    setQuantity(1);
    setWindowType("normal");
    setFormData({
      profileSystem: "",
      design: "",
      glassType: "",
      grill: "",
      locking: "",
      hardware: "",
      mess: "",
      pricePerFt: "",
    });
    setErrors({});
    setBannerError("");
  };

  const removeWindow = (i) => {
    setWindowList(windowList.filter((_, idx) => idx !== i));
    if (editIndex === i) cancelEdit();
  };

  const editWindow = (i) => {
    const w = windowList[i];
    setWidth(w.width);
    setHeight(w.height);
    setQuantity(w.quantity);
    setWindowType(w.windowType);
    setFormData({
      profileSystem: w.profileSystem,
      design: w.design,
      glassType: w.glassType,
      grill: w.grill,
      locking: w.locking,
      hardware: w.hardware,
      mess: w.mess || "",
      pricePerFt: w.pricePerFt,
    });
    setEditIndex(i);
    setBannerError("");
  };

  const duplicateWindow = (i) => {
    const w = windowList[i];
    setWidth(w.width);
    setHeight(w.height);
    setQuantity(w.quantity);
    setWindowType(w.windowType);
    setFormData({
      profileSystem: w.profileSystem,
      design: w.design,
      glassType: w.glassType,
      grill: w.grill,
      locking: w.locking,
      hardware: w.hardware,
      mess: w.mess || "",
      pricePerFt: w.pricePerFt,
    });
    setEditIndex(null);
    setBannerError("");
  };

  const cancelEdit = () => {
    resetForm();
    setEditIndex(null);
  };

  const handleGenerateQuote = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (windowList.length === 0) {
      setBannerError("Please add at least one window.");
      return;
    }

    // Include Client Details in Payload
    const payload = {
      windows: windowList,
      clientName: clientInfo.clientName,
      project: clientInfo.project,
      finish: clientInfo.finish,
      // Default financial values for new quotes (can be edited in Preview)
      applyGST: true,
      cgstPerc: 9,
      sgstPerc: 9,
      packingCharges: 0,
    };

    try {
      let res;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (editMode && editingQuoteId) {
        res = await fetch(`${apiBaseUrl}/api/quotes/${editingQuoteId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${apiBaseUrl}/api/quotes`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");

      // Navigate to Preview
      navigate(`/quote/${data.quote.quoteId}`);
    } catch (error) {
      console.error("Quote saving failed:", error);
      setBannerError(error.message || "Something went wrong.");
    }
  };

  // Calculations
  const totalSqFt = windowList
    .reduce((sum, w) => sum + w.sqFt * w.quantity, 0)
    .toFixed(2);
  const totalAmount = windowList
    .reduce((sum, w) => sum + w.amount, 0)
    .toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 pb-32 lg:pb-6 font-sans text-slate-800">
      <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* --- CENTER PANEL (3D Preview) --- */}
        <div className="lg:col-span-6 lg:col-start-4 order-1 lg:order-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 h-[45vh] min-h-[320px] lg:h-[calc(100vh-5rem)] flex flex-col overflow-hidden border border-slate-100 sticky top-4">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Live Preview
                </span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-mono">
                {width}" <span className="text-slate-400">x</span> {height}"
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-50 to-slate-200 flex items-center justify-center w-full h-full overflow-hidden">
              {/* Subtle Grid Background */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              ></div>

              <div className="w-full h-full flex items-center justify-center z-0">
                <Window3D
                  width={width || 0}
                  height={height || 0}
                  windowType={windowType}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- LEFT PANEL (Controls) --- */}
        <div className="lg:col-span-3 lg:col-start-1 order-2 lg:order-1 space-y-5">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 md:p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-slate-800 text-xl tracking-tight">
                {editIndex !== null ? "Edit Configuration" : "Configure Window"}
              </h2>
              {editIndex !== null && (
                <button
                  onClick={cancelEdit}
                  className="text-xs text-rose-500 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full font-medium transition-colors"
                >
                  <Icons.X /> Cancel
                </button>
              )}
            </div>

            {/* Window Type Segmented Control */}
            <div className="mb-6 p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1">
              {["normal", "slider"].map((type) => (
                <button
                  key={type}
                  onClick={() => setWindowType(type)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
                    windowType === type
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Width (in)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className={`w-full p-3 rounded-xl bg-slate-50 border-2 text-slate-900 font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                    errors.width
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-transparent hover:border-slate-200 focus:border-indigo-500"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Height (in)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={`w-full p-3 rounded-xl bg-slate-50 border-2 text-slate-900 font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                    errors.height
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-transparent hover:border-slate-200 focus:border-indigo-500"
                  }`}
                />
              </div>
            </div>

            {/* Specs Grid */}
            <div className="space-y-4 mb-6">
              {requiredFields.map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                    {label}
                  </label>
                  {key === "make" ? (
                    <select
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [key]: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-transparent text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer ${
                        errors[key]
                          ? "border-rose-400 bg-rose-50"
                          : "hover:border-slate-200"
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "36px",
                      }}
                    >
                      <option value="">Select {label}...</option>
                      <option value="normal">normal</option>
                      <option value="slider">slider</option>
                      <option value="fix open {left, right}">fix open {"{left, right}"}</option>
                      <option value="fix partition door">fix partition door</option>
                      <option value="fix sliding">fix sliding</option>
                      <option value="trak sliding">trak sliding</option>
                      <option value="3-trak sliding">3-trak sliding</option>
                      <option value="door">door</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [key]: e.target.value,
                        })
                      }
                      placeholder={`Select ${label}...`}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-transparent text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 ${
                        errors[key]
                          ? "border-rose-400 bg-rose-50"
                          : "hover:border-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}

              {/* Price per Ft */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                  Price / sq.ft
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-serif italic">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.pricePerFt}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerFt: e.target.value,
                      })
                    }
                    className={`w-full pl-9 px-4 py-2.5 rounded-xl bg-slate-50 border border-transparent text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                      errors.pricePerFt
                        ? "border-rose-400 bg-rose-50"
                        : "hover:border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Quantity & Add Button */}
            <div className="flex gap-4 items-stretch pt-2">
              <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                  Quantity
                </label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 h-[46px]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full hover:bg-white hover:text-indigo-600 rounded-l-xl text-slate-400 transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="text-base font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full hover:bg-white hover:text-indigo-600 rounded-r-xl text-slate-400 transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <button
                  onClick={handleAddOrUpdateWindow}
                  className={`w-full h-[46px] rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                    editIndex !== null
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-orange-200"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700"
                  }`}
                >
                  {editIndex !== null ? <Icons.Check /> : <Icons.Plus />}
                  {editIndex !== null ? "Update" : "Add to List"}
                </button>
              </div>
            </div>

            {bannerError && (
              <div className="mt-4 flex items-start gap-3 text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                <div className="mt-0.5">
                  <Icons.Alert />
                </div>
                <span className="font-medium">{bannerError}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT PANEL (List & Summary) --- */}
        <div className="lg:col-span-3 lg:col-start-10 order-3 space-y-5 pb-20 md:pb-0">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 md:p-6 flex flex-col h-full lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 border border-slate-100">
            {/* --- CLIENT INFO CARD --- */}
            <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Client Details
              </h3>
              <input
                type="text"
                placeholder="Client Name"
                value={clientInfo.clientName}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    clientName: e.target.value,
                  })
                }
                className="w-full bg-white p-2.5 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              />
              <input
                type="text"
                placeholder="Project Reference"
                value={clientInfo.project}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    project: e.target.value,
                  })
                }
                className="w-full bg-white p-2.5 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              />
              <input
                type="text"
                placeholder="Finish Type"
                value={clientInfo.finish}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    finish: e.target.value,
                  })
                }
                className="w-full bg-white p-2.5 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-lg">Windows</h2>
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                {windowList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 min-h-[200px] max-h-[400px] lg:max-h-none custom-scrollbar">
              {windowList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl p-8 bg-slate-50/50">
                  <div className="scale-150 mb-3 opacity-50">
                    <Icons.Plus />
                  </div>
                  <span className="font-medium text-sm">
                    Your list is empty
                  </span>
                </div>
              ) : (
                windowList.map((w, i) => (
                  <div
                    key={i}
                    className={`relative p-4 rounded-xl border transition-all duration-200 group hover:-translate-y-1 hover:shadow-md ${
                      editIndex === i
                        ? "border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-200"
                        : "border-slate-100 bg-white hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        Window
                      </span>
                      <span className="text-sm font-bold px-2 py-0.5 rounded">
                        ₹{w.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 pl-7">
                      <p className="font-medium text-slate-600">
                        {w.width}" x {w.height}"{" "}
                        <span className="text-slate-300">|</span> {w.windowType}
                      </p>
                      <p>
                        Qty: {w.quantity}{" "}
                        <span className="text-slate-300">|</span> {w.sqFt} sq.ft
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => editWindow(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Icons.Edit /> Edit
                      </button>
                      <button
                        onClick={() => duplicateWindow(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Icons.Copy /> Copy
                      </button>
                      <button
                        onClick={() => removeWindow(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <Icons.Trash /> Del
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Summary Footer */}
            <div className="hidden lg:block border-t border-dashed border-slate-200 pt-5 bg-white mt-auto">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Total Area</span>
                  <span className="text-slate-800">{totalSqFt} sq.ft</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-800">
                    Grand Total
                  </span>
                  <span className="text-2xl font-bold text-indigo-600 tracking-tight">
                    ₹{Number(totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGenerateQuote}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Icons.Check /> Generate Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE STICKY FOOTER (Glassmorphism) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 pb-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] lg:hidden z-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Grand Total
            </p>
            <p className="text-xl font-bold text-slate-900">
              ₹{Number(totalAmount).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Area
            </p>
            <p className="text-sm font-bold text-slate-600">
              {totalSqFt}{" "}
              <span className="text-[10px] font-normal text-slate-400">
                sq.ft
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateQuote}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Icons.Check /> Generate ({windowList.length})
        </button>
      </div>
    </div>
  );
}
