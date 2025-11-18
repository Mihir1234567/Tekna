// src/pages/Configurator.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Window3D from "../components/Window3D"; // Restored import
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
        import.meta.env.REACT_APP_API_BASE || "https://tekna-ryyc.onrender.com";

    // --- State ---
    const editMode = location.state?.mode === "edit";
    const loadedWindows = location.state?.windows || [];
    const editingQuoteId = location.state?.quoteId || null;

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
        mess: "", // Field Added
        pricePerFt: "",
    });
    const [errors, setErrors] = useState({});
    const [bannerError, setBannerError] = useState("");
    const [editIndex, setEditIndex] = useState(null);

    // --- Effects ---
    useEffect(() => {
        if (editMode && loadedWindows.length > 0) {
            setWindowList(loadedWindows);
        }
    }, [editMode, loadedWindows]);

    // --- Handlers ---
    const requiredFields = [
        ["profileSystem", "Profile System"],
        ["design", "Design"],
        ["glassType", "Glass Type"],
        ["grill", "Grill"],
        ["locking", "Locking"],
        ["hardware", "Hardware"],
        ["mess", "Mess"], // Field Added
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

    // --- DUPLICATE HANDLER ---
    const duplicateWindow = (i) => {
        const w = windowList[i];
        // Fill the form with the selected window's data
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
        // Ensure we are in "Add" mode (not edit mode) so we create a new entry
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

        const payload = {
            windows: windowList,
            applyGST: true,
            cgstPerc: 9,
            sgstPerc: 9,
        };

        try {
            let res;
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            if (editMode && editingQuoteId) {
                res = await fetch(
                    `${apiBaseUrl}/api/quotes/${editingQuoteId}`,
                    {
                        method: "PUT",
                        headers,
                        body: JSON.stringify(payload),
                    }
                );
            } else {
                res = await fetch(`${apiBaseUrl}/api/quotes`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Operation failed");
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
        <div className="min-h-screen bg-gray-50 p-4 pb-24 lg:pb-4">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* --- CENTER PANEL (3D Preview) --- */}
                <div className="lg:col-span-6 lg:col-start-4 order-1 lg:order-2">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-[350px] lg:h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live Preview
                            </h2>
                            <span className="text-xs text-gray-400 font-mono">
                                {width}" x {height}"
                            </span>
                        </div>

                        {/* 3D PREVIEW CONTAINER */}
                        <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-100 flex items-center justify-center w-full h-full">
                            <div className="w-full h-full">
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
                <div className="lg:col-span-3 lg:col-start-1 order-2 lg:order-1 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-gray-800">
                                {editIndex !== null
                                    ? "Edit Configuration"
                                    : "New Window"}
                            </h2>
                            {editIndex !== null && (
                                <button
                                    onClick={cancelEdit}
                                    className="text-xs text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded"
                                >
                                    <Icons.X /> Cancel
                                </button>
                            )}
                        </div>

                        {/* Window Type */}
                        <div className="mb-5 p-1 bg-gray-100 rounded-lg grid grid-cols-2 gap-1">
                            {["normal", "slider"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setWindowType(type)}
                                    className={`py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
                                        windowType === type
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Width (in)
                                </label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    className={`w-full p-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        errors.width
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-200"
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Height (in)
                                </label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className={`w-full p-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        errors.height
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-200"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="space-y-3 mb-6">
                            {requiredFields.map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        {label}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[key]}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                [key]: e.target.value,
                                            })
                                        }
                                        placeholder={`Enter ${label}`}
                                        className={`w-full p-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                                            errors[key]
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200"
                                        }`}
                                    />
                                </div>
                            ))}
                            {/* Price per Ft */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Price / sq.ft
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 text-sm">
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
                                        className={`w-full pl-7 p-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                                            errors.pricePerFt
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200"
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quantity & Add Button */}
                        <div className="flex gap-3 items-end">
                            <div className="w-1/3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Qty
                                </label>
                                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        className="px-2 py-2 hover:bg-gray-50 text-gray-500"
                                    >
                                        -
                                    </button>
                                    <span className="flex-1 text-center text-sm font-medium">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        className="px-2 py-2 hover:bg-gray-50 text-gray-500"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleAddOrUpdateWindow}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-2 transition-all ${
                                    editIndex !== null
                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                {editIndex !== null ? (
                                    <Icons.Check />
                                ) : (
                                    <Icons.Plus />
                                )}
                                {editIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>

                        {bannerError && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                <Icons.Alert /> {bannerError}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL (List & Summary) --- */}
                <div className="lg:col-span-3 lg:col-start-10 order-3 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-full max-h-[calc(100vh-5rem)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800">
                                Window List
                            </h2>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-mono">
                                {windowList.length} Items
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 min-h-[200px]">
                            {windowList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl p-8">
                                    <Icons.Plus />
                                    <span className="mt-2">
                                        No windows added
                                    </span>
                                </div>
                            ) : (
                                windowList.map((w, i) => (
                                    <div
                                        key={i}
                                        className={`group relative p-3 rounded-lg border transition-all ${
                                            editIndex === i
                                                ? "border-amber-400 bg-amber-50 shadow-sm"
                                                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-bold text-gray-700">
                                                Window {i + 1}
                                            </span>
                                            <span className="text-xs font-bold text-gray-900">
                                                ₹{w.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                            <p>
                                                {w.width}" x {w.height}" •{" "}
                                                {w.windowType}
                                            </p>
                                            <p>
                                                Qty: {w.quantity} • {w.sqFt}{" "}
                                                sq.ft
                                            </p>
                                        </div>

                                        {/* ACTIONS (With Dupe Button) */}
                                        <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => editWindow(i)}
                                                className="flex items-center justify-center gap-1 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                            >
                                                <Icons.Edit /> Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    duplicateWindow(i)
                                                }
                                                className="flex items-center justify-center gap-1 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                            >
                                                <Icons.Copy /> Dupe
                                            </button>
                                            <button
                                                onClick={() => removeWindow(i)}
                                                className="flex items-center justify-center gap-1 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                                            >
                                                <Icons.Trash /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-gray-100 pt-4 bg-white">
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Total Sq.Ft</span>
                                    <span>{totalSqFt}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>Grand Total</span>
                                    <span>
                                        ₹{Number(totalAmount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateQuote}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Icons.Check /> Generate Quote
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
