// src/pages/MaterialConfig.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function MaterialConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.mode === "edit";
  const loadedMaterials = location.state?.materials || [];
  const editingId = location.state?.materialDocId || null;

  // Client / recipient info
  const [recipientInfo, setRecipientInfo] = useState({
    toName: "",
    company: "",
    address: "",
    ref: "",
  });
  const [recipientErrors, setRecipientErrors] = useState({});

  // Material line form
  const emptyLine = {
    description: "",
    unit: "pcs",
    qty: 1,
    rate: "",
    amount: 0,
    notes: "",
  };
  const [lineForm, setLineForm] = useState(emptyLine);
  const [lineErrors, setLineErrors] = useState({});
  const [materials, setMaterials] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [bannerError, setBannerError] = useState("");

  useEffect(() => {
    if (editMode && Array.isArray(loadedMaterials) && loadedMaterials.length) {
      setMaterials(loadedMaterials);
    }
    if (editMode && location.state?.recipientInfo) {
      setRecipientInfo(location.state.recipientInfo);
    }
  }, [editMode, loadedMaterials, location.state]);

  const validateRecipient = () => {
    const errs = {};

    if (!String(recipientInfo.toName || "").trim()) errs.toName = "Required";
    if (!String(recipientInfo.company || "").trim()) errs.company = "Required";
    if (!String(recipientInfo.address || "").trim()) errs.address = "Required";
    if (!String(recipientInfo.ref || "").trim()) errs.ref = "Required";

    setRecipientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLine = () => {
    const errs = {};
    if (!lineForm.description || !lineForm.description.trim())
      errs.description = "Required";
    if (!lineForm.qty || Number(lineForm.qty) <= 0) errs.qty = "Required (>0)";
    const r = String(lineForm.rate || "").trim();
    if (!r || isNaN(Number(r)) || Number(r) < 0) errs.rate = "Required (>=0)";

    setLineErrors(errs);
    const ok = Object.keys(errs).length === 0;
    setBannerError(ok ? "" : "Please fix errors in material line.");
    return ok;
  };

  const recalcAmount = (lf) => {
    const q = Number(lf.qty || 0);
    const r = Number(lf.rate || 0);
    return Number((q * r).toFixed(2));
  };

  const handleAddOrUpdate = () => {
    if (!validateLine()) return;
    const computed = { ...lineForm, amount: recalcAmount(lineForm) };

    if (editIndex !== null) {
      const copy = [...materials];
      copy[editIndex] = computed;
      setMaterials(copy);
      setEditIndex(null);
    } else {
      setMaterials((p) => [...p, computed]);
    }
    resetLineForm();
  };

  const resetLineForm = () => {
    setLineForm(emptyLine);
    setLineErrors({});
    setBannerError("");
  };

  const editMaterial = (i) => {
    const m = materials[i];
    setLineForm({
      description: m.description,
      qty: m.qty,
      unit: m.unit,
      rate: m.rate,
      notes: m.notes || "",
      amount: m.amount,
    });
    setEditIndex(i);
  };

  const duplicateMaterial = (i) => {
    const m = materials[i];
    setLineForm({
      description: m.description,
      qty: m.qty,
      unit: m.unit,
      rate: m.rate,
      notes: m.notes || "",
      amount: 0,
    });
    setEditIndex(null);
  };

  const removeMaterial = (i) => {
    setMaterials((prev) => prev.filter((_, idx) => idx !== i));
    if (editIndex === i) setEditIndex(null);
  };

  // summary calculations
  const totalQty = materials.reduce((s, m) => s + Number(m.qty || 0), 0);
  const totalAmount = materials.reduce((s, m) => s + Number(m.amount || 0), 0);

  const handlePreview = () => {
    // Validate recipient info
    if (!validateRecipient()) {
      setBannerError("Please fill all required Recipient / Job Info fields.");
      return;
    }

    if (materials.length === 0) {
      setBannerError("Add at least one material line before preview.");
      return;
    }
    // navigate to material details / preview with state
    navigate("/material-details", {
      state: {
        materials,
        recipientInfo,
        materialDocId: editingId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-12 font-sans text-slate-800">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CENTER: List & preview */}
        <div className="lg:col-span-7 order-2 lg:order-2">
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Materials</h2>
              <div className="text-sm text-slate-500">
                {materials.length} items • ₹
                {Number(totalAmount).toLocaleString()}
              </div>
            </div>

            <div className="space-y-3">
              {materials.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center text-slate-400">
                  Your material list is empty.
                </div>
              ) : (
                materials.map((item, i) => (
                  <div
                    key={i}
                    className={`relative p-4 rounded-xl border transition-all duration-200 group hover:-translate-y-1 hover:shadow-md ${
                      editIndex === i
                        ? "border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-200"
                        : "border-slate-100 bg-white hover:border-indigo-200"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        Material
                      </span>

                      {/* Amount */}
                      <span className="text-sm font-bold px-2 py-0.5 rounded tabular-nums whitespace-nowrap">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="text-xs text-slate-500 space-y-1 pl-7 break-all">
                      <p className="font-medium text-slate-800">
                        {item.description}
                      </p>
                      <p>
                        Qty: {item.qty} {item.unit}{" "}
                        <span className="text-slate-300">|</span> ₹
                        {Number(item.rate).toLocaleString("en-IN")} each
                      </p>
                      {item.notes && <p className="italic">{item.notes}</p>}
                    </div>

                    {/* Action Buttons — SAME ANIMATION AS CONFIGURATOR */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => editMaterial(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => duplicateMaterial(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Copy
                      </button>

                      <button
                        onClick={() => removeMaterial(i)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer summary */}
            <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex justify-between sm:block">
                <div>
                  <div className="text-xs text-slate-500">Total Qty</div>
                  <div className="font-bold text-lg">{totalQty}</div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-xs text-slate-500">Total Amount</div>
                  <div className="font-bold text-2xl">
                    ₹{Number(totalAmount).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setMaterials([]);
                    resetLineForm();
                    setRecipientInfo({
                      toName: "",
                      company: "",
                      address: "",
                      ref: "",
                    });
                  }}
                  className="px-4 py-2 bg-white border rounded text-sm w-full sm:w-auto"
                >
                  Reset
                </button>

                <button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-emerald-500 text-white rounded text-sm font-bold w-full sm:w-auto"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEFT: Form */}
        <div className="lg:col-span-5 order-1 lg:order-1">
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 space-y-5">
            <h3 className="text-sm font-bold">Recipient / Job Info</h3>

            <div>
              <input
                type="text"
                placeholder="To (Name)"
                value={recipientInfo.toName}
                onChange={(e) =>
                  setRecipientInfo({ ...recipientInfo, toName: e.target.value })
                }
                className={`w-full p-2.5 rounded-lg border ${
                  recipientErrors.toName
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200"
                }`}
              />
              {recipientErrors.toName && (
                <div className="text-xs text-rose-500 mt-1">
                  {recipientErrors.toName}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Company / Project"
                value={recipientInfo.company}
                onChange={(e) =>
                  setRecipientInfo({
                    ...recipientInfo,
                    company: e.target.value,
                  })
                }
                className={`w-full p-2.5 rounded-lg border ${
                  recipientErrors.company
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200"
                }`}
              />
              {recipientErrors.company && (
                <div className="text-xs text-rose-500 mt-1">
                  {recipientErrors.company}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Address"
                value={recipientInfo.address}
                onChange={(e) =>
                  setRecipientInfo({
                    ...recipientInfo,
                    address: e.target.value,
                  })
                }
                className={`w-full p-2.5 rounded-lg border ${
                  recipientErrors.address
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200"
                }`}
              />
              {recipientErrors.address && (
                <div className="text-xs text-rose-500 mt-1">
                  {recipientErrors.address}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Ref / PO #"
                value={recipientInfo.ref}
                onChange={(e) =>
                  setRecipientInfo({ ...recipientInfo, ref: e.target.value })
                }
                className={`w-full p-2.5 rounded-lg border ${
                  recipientErrors.ref
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200"
                }`}
              />
              {recipientErrors.ref && (
                <div className="text-xs text-rose-500 mt-1">
                  {recipientErrors.ref}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100 mt-5 space-y-4">
            <h3 className="text-sm font-bold">
              {editIndex !== null ? "Edit Material" : "Add Material"}
            </h3>

            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <input
              type="text"
              value={lineForm.description}
              onChange={(e) =>
                setLineForm({ ...lineForm, description: e.target.value })
              }
              className={`w-full p-3 rounded-xl border ${
                lineErrors.description
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200"
              }`}
              placeholder="Material description, e.g. Aluminium Channel 50x20"
            />
            <label className="text-xs font-medium text-slate-600">
              Qty & Unit
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={lineForm.qty}
                onChange={(e) => {
                  const val = e.target.value;
                  setLineForm((s) => ({
                    ...s,
                    qty: val,
                    amount: recalcAmount({ ...s, qty: val }),
                  }));
                }}
                className={`w-1/2 p-3 rounded-xl border ${
                  lineErrors.qty
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200"
                }`}
              />
              <select
                value={lineForm.unit}
                onChange={(e) =>
                  setLineForm({ ...lineForm, unit: e.target.value })
                }
                className="w-1/2 p-3 rounded-xl border border-slate-200"
              >
                <option value="pcs">pcs</option>
                <option value="sqft">sqft</option>
                <option value="m">m</option>
                <option value="kg">kg</option>
              </select>
            </div>

            <label className="text-xs font-medium text-slate-600">
              Rate (per unit)
            </label>
            <input
              type="number"
              value={lineForm.rate}
              onChange={(e) => {
                const val = e.target.value;
                setLineForm((s) => ({
                  ...s,
                  rate: val,
                  amount: recalcAmount({ ...s, rate: val }),
                }));
              }}
              className={`w-full p-3 rounded-xl border ${
                lineErrors.rate
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200"
              }`}
              placeholder="Rate in ₹"
            />

            <label className="text-xs font-medium text-slate-600">
              Notes (optional)
            </label>
            <input
              type="text"
              value={lineForm.notes}
              onChange={(e) =>
                setLineForm({ ...lineForm, notes: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-slate-200"
              placeholder="Any extra info"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm text-slate-600">
                Amount:{" "}
                <span className="font-bold">
                  ₹{recalcAmount(lineForm).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                {editIndex !== null && (
                  <button
                    onClick={() => {
                      resetLineForm();
                      setEditIndex(null);
                    }}
                    className="px-4 py-2 bg-white border rounded"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleAddOrUpdate}
                  className={`px-4 py-2 rounded font-bold ${
                    editIndex !== null
                      ? "bg-amber-500 text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {editIndex !== null ? "Update" : "Add"}
                </button>
              </div>
            </div>

            {bannerError && (
              <div className="mt-3 text-rose-600 text-sm bg-rose-50 p-3 rounded border border-rose-100">
                {bannerError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
