// src/pages/MaterialDetails.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  RotateCcw,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Minus,
  Wand2,
  Printer,
  Save,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png";
import { getToken } from "../utils/auth";

const formatNumber = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ---------------- ManualSpacer ---------------- */
const ManualSpacer = ({ id, height, visible, pdfMode, updateHeight }) => {
  if (pdfMode)
    return height > 0 ? <div style={{ height: `${height}px` }} /> : null;
  if (!visible && height === 0) return null;
  if (!visible && height > 0) return <div style={{ height: `${height}px` }} />;

  const SMALL_STEP = 20;
  const BIG_STEP = 100;

  return (
    <div
      style={{ height: `${height}px` }}
      className="my-2 transition-all duration-200"
    >
      <div className="h-10 bg-indigo-50 border border-dashed border-indigo-300 rounded flex items-center justify-center gap-2 text-indigo-700 select-none">
        <div className="flex items-center bg-white rounded border border-indigo-200 overflow-hidden">
          <button
            onClick={() => updateHeight(id, Math.max(0, height - BIG_STEP))}
            className="p-1 border-r border-indigo-100"
          >
            <ChevronsUp size={14} />
          </button>
          <button
            onClick={() => updateHeight(id, Math.max(0, height - SMALL_STEP))}
            className="p-1"
          >
            <Minus size={14} />
          </button>
        </div>

        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-indigo-200">
          {height}px
        </span>

        <div className="flex items-center bg-white rounded border border-indigo-200 overflow-hidden">
          <button
            onClick={() => updateHeight(id, height + SMALL_STEP)}
            className="p-1 border-r border-indigo-100"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => updateHeight(id, height + BIG_STEP)}
            className="p-1"
          >
            <ChevronsDown size={14} />
          </button>
        </div>

        {height > 0 && (
          <button
            onClick={() => updateHeight(id, 0)}
            className="ml-2 text-red-500"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- MaterialTemplate (printable) ---------------- */
const MaterialTemplate = React.forwardRef(
  (
    {
      data,
      financials,
      actions,
      spacers,
      showSpacers,
      updateSpacer,
      isPDFMode,
      itemRefs,
    },
    ref
  ) => {
    const { materials = [], recipientInfo = {}, id } = data;
    const {
      applyGST,
      cgstPerc,
      sgstPerc,
      packingCharges,
      subtotal,
      totalQty,
      cgstAmount,
      sgstAmount,
      grandTotal,
    } = financials;

    const setRef = (key, el) => {
      if (itemRefs && itemRefs.current) itemRefs.current[key] = el;
    };

    return (
      <div
        ref={ref}
        style={{ width: "794px", minHeight: "1123px" }}
        className="bg-white p-10 mx-auto text-gray-900 shadow-lg"
      >
        {/* Header */}
        <header
          ref={(el) => setRef("header", el)}
          className="flex justify-between items-start pb-6 border-b-2 border-gray-200 mb-6"
        >
          <div className="w-2/3">
            <h1 className="text-3xl font-extrabold tracking-wide">
              TEKNA WINDOW SYSTEM
            </h1>
            <p className="text-sm text-gray-700">
              VAVDI INDUSTRY AREA · VAVDI MAIN ROAD
            </p>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <div>
                <strong>Mobile:</strong> 9825256525
              </div>
              <div>
                <strong>Email:</strong> TEKNAWIN01@GMAIL.COM
              </div>
              <div>
                <strong>GSTIN:</strong> 24AMIPS5762R1Z4
              </div>
            </div>
          </div>

          <div className="w-1/3 text-right">
            <div className="h-20 mb-2">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-full object-contain inline-block"
                />
              ) : (
                <div className="h-12 w-24 bg-slate-200 inline-flex items-center justify-center">
                  TWS
                </div>
              )}
            </div>
            <div className="mt-2 text-sm font-bold">MATERIAL DELIVERY</div>
            <div className="text-sm text-gray-500 mt-1">
              Date: {new Date().toLocaleDateString("en-IN")}
            </div>
            {id && <div className="text-xs text-gray-500 mt-1">Doc#: {id}</div>}
          </div>
        </header>

        {/* Recipient / Summary bar (responsive + safe wrapping) */}
        <section className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded border border-slate-200">
            {/* TO */}
            <div className="break-words whitespace-normal">
              <div className="text-xs text-slate-400 uppercase font-bold">
                To
              </div>
              <div className="font-bold text-gray-900 leading-tight">
                {recipientInfo.toName || "—"}
              </div>
              {recipientInfo.company && (
                <div className="text-sm text-gray-700 break-words whitespace-normal">
                  {recipientInfo.company}
                </div>
              )}
              {recipientInfo.address && (
                <div className="text-sm text-slate-500 mt-1 break-words whitespace-normal">
                  {recipientInfo.address}
                </div>
              )}
            </div>

            {/* REF / PO */}
            <div className="break-words whitespace-normal">
              <div className="text-xs text-slate-400 uppercase font-bold">
                Ref / PO
              </div>
              <div className="font-bold leading-tight">
                {recipientInfo.ref || "—"}
              </div>
            </div>

            {/* TOTAL ITEMS */}
            <div className="break-words whitespace-normal">
              <div className="text-xs text-slate-400 uppercase font-bold">
                Total Items
              </div>
              <div className="font-bold">{materials.length} items</div>
            </div>

            {/* TOTAL VALUE */}
            <div className="break-words whitespace-normal">
              <div className="text-xs text-slate-400 uppercase font-bold">
                Total Value
              </div>
              <div className="font-bold">₹{formatNumber(grandTotal)}</div>
            </div>
          </div>
        </section>

        {/* Materials list as proper table */}
        <section className="mb-8">
          <table className="w-full border-collapse text-sm mt-4">
            <thead>
              <tr className="bg-gray-100 border">
                <th className="border px-2 py-2 w-[50px] text-center">SR</th>
                <th className="border px-3 py-2 text-left">DESCRIPTION</th>
                <th className="border px-3 py-2 w-[70px] text-center">QTY</th>
                <th className="border px-3 py-2 w-[130px] text-right whitespace-nowrap">
                  RATE
                </th>
                <th className="border px-3 py-2 w-[160px] text-right whitespace-nowrap">
                  AMOUNT
                </th>
              </tr>
            </thead>

            <tbody>
              {materials.map((m, i) => (
                <tr key={i} className="border align-top">
                  {/* SR */}
                  <td className="border px-2 py-2 text-center font-bold">
                    {i + 1}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="border px-3 py-2">
                    <div className="font-semibold text-gray-900 break-all leading-snug">
                      {m.description}
                    </div>

                    {m.notes && (
                      <div className="text-xs text-gray-600 mt-1 break-all">
                        <span className="font-semibold">Note:</span> {m.notes}
                      </div>
                    )}
                  </td>

                  {/* QTY */}
                  <td className="border px-3 py-2 text-center font-semibold whitespace-nowrap">
                    {m.qty}
                  </td>

                  {/* RATE */}
                  <td className="border px-3 py-2 text-right font-medium whitespace-nowrap tabular-nums">
                    ₹{formatNumber(m.rate)}
                  </td>

                  {/* AMOUNT */}
                  <td className="border px-3 py-2 text-right font-bold whitespace-nowrap tabular-nums">
                    ₹{formatNumber(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <ManualSpacer
          id="spacer-totals"
          height={spacers["spacer-totals"] || 0}
          visible={showSpacers}
          pdfMode={isPDFMode}
          updateHeight={updateSpacer}
        />

        {/* Totals card */}
        <section
          ref={(el) => setRef("totals", el)}
          className="flex justify-end mb-8"
        >
          <div className="w-[360px] max-w-full border border-slate-900 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold uppercase">
              Delivery Summary
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Items</span>
                <span className="font-bold">{materials.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Qty</span>
                <span className="font-bold">{totalQty}</span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>₹{formatNumber(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Packing / Forwarding</span>
                {isPDFMode ? (
                  <span>₹{formatNumber(packingCharges)}</span>
                ) : (
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={packingCharges}
                      onChange={(e) =>
                        actions.setPackingCharges(Number(e.target.value || 0))
                      }
                      className="w-20 text-right outline-none bg-transparent font-semibold text-slate-700"
                    />
                    <span className="text-xs ml-2">Rs.</span>
                  </div>
                )}
              </div>

              {applyGST && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      {isPDFMode ? (
                        <span>CGST @ {cgstPerc}%</span>
                      ) : (
                        <div className="flex items-center">
                          <span>CGST @ </span>
                          <input
                            type="number"
                            value={cgstPerc}
                            onChange={(e) =>
                              actions.setCgstPerc(Number(e.target.value || 0))
                            }
                            className="w-10 text-center border-b border-slate-300 text-xs bg-transparent outline-none font-bold text-indigo-600"
                          />
                          %
                        </div>
                      )}
                    </div>
                    <span>₹{formatNumber(cgstAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      {isPDFMode ? (
                        <span>SGST @ {sgstPerc}%</span>
                      ) : (
                        <div className="flex items-center">
                          <span>SGST @ </span>
                          <input
                            type="number"
                            value={sgstPerc}
                            onChange={(e) =>
                              actions.setSgstPerc(Number(e.target.value || 0))
                            }
                            className="w-10 text-center border-b border-slate-300 text-xs bg-transparent outline-none font-bold text-indigo-600"
                          />
                          %
                        </div>
                      )}
                    </div>
                    <span>₹{formatNumber(sgstAmount)}</span>
                  </div>
                </>
              )}

              <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-lg whitespace-nowrap">
                  Grand Total&nbsp;:
                </span>
                <span className="font-bold text-[18px] text-indigo-700 tabular-nums break-all text-right block max-w-full">
                  ₹{formatNumber(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <ManualSpacer
          id="spacer-footer"
          height={spacers["spacer-footer"] || 0}
          visible={showSpacers}
          pdfMode={isPDFMode}
          updateHeight={updateSpacer}
        />

        {/* Footer with terms and bank details */}
        <section
          ref={(el) => setRef("footer", el)}
          className="break-inside-avoid pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 gap-8">
            <div className="text-[10px] text-gray-600 leading-relaxed">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1 uppercase">
                Terms & Condition:
              </h5>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  QUOTATION ARE VALID UPTO 1 WEEK(RATE MAY CHANGE DEPENDING ON
                  MATERIAL PRICE CHANGE).
                </li>
                <li>SIZE IS CALCULATED IN WIDTH AND HEIGHT IN 3 INCH STEPS.</li>
                <li>
                  THE DESIGN AND STYLE OF PRODUCT REMAINS UNCHANGED. THE
                  CUSTOMER WILL BE CHARGED FOR THAT.
                </li>
                <li>
                  THERE IS NO WARRANTY FOR GLASS ONCE INSTALLATION IS DONE.
                </li>
                <li>
                  FOR MANUFACTURING DEFECT, CLIENT HAS TO INFORM US WITHIN 48
                  HOURS AFTER INSTALLATION. AFTER THE TIME PERIOD, TEKNA WINDOW
                  SYSTEM WILL BE NOT LIABLE FOR ANY DEFECTS.
                </li>
                <li>
                  SCAFFOLDING/CRANE SERVICE, ELECTRICITY, STORAGE FOR MATERIAL
                  AND CLEANING OF GLASS & WINDOW WILL BE UNDER CUSTOMER'S SCOPE.
                </li>
                <li>
                  ANY DAMAGE OR BREACKAGE OF STONE WILL NOT BE OUR
                  RESPONSIBILITY.
                </li>
                <li>
                  AFTER HANDOVERING WINDOWS, IF ANY SERVICE REQUIRE RELATED TO
                  WINDOWS & DOORS, THAT SHOULD BE CHARGEABLE.
                </li>
                <li>
                  INSTALLATION TIME: 40-45 DAYS. (DELIVERY TIME WILL BE
                  SCHEDULED AT THE TIME OF ADVANCE PAYMENT RECEIVED).
                </li>
                <li>
                  PAYMENT TERMS: 70% ADVANCE TO CONFIRM ORDER. 20% AGAINST
                  MATERIAL AT READY TO DISPATCH. 10% AFTER SUCCESSFUL
                  INSTALLATION.
                </li>
                <li>
                  ALL DISPUTES SHALL BE SUBJECT RAJKOT CITY JURISDICTION ONLY.
                </li>
                <li>TRANSPORTATION AND GST EXTRA.</li>
              </ul>
            </div>

            <div>
              <div className="bg-slate-50 p-3 border border-slate-200 rounded mb-6 text-xs">
                <h5 className="font-bold text-gray-900 mb-2 border-b border-slate-200 pb-1 uppercase">
                  BANK DETAILS
                </h5>
                <div className="grid grid-cols-[110px_1fr] gap-y-1">
                  <span className="text-slate-500">BANK NAME :</span>
                  <span className="font-bold">STATE BANK OF INDIA</span>
                  <span className="text-slate-500">BRANCH :</span>
                  <span className="font-bold">CHANDRESH NAGAR, MAVDI PLOT</span>
                  <span className="text-slate-500">CURRENT A/C NO. :</span>
                  <span className="font-mono font-bold">34200993101</span>
                  <span className="text-slate-500">IFSC CODE :</span>
                  <span className="font-mono font-bold">SBIN0060314</span>
                </div>
              </div>

              <div className="text-[9px] font-bold text-gray-800 mb-4 leading-tight">
                I HEREBY ACCEPT THE ESTIMATE AS PER ABOVE MENTIONED PRICE AND
                SPECIFICATIONS. I HAVE READ AND UNDERSTOOD THE TERMS &
                CONDITIONS AND AGREE TO THEM.
              </div>

              <div className="flex justify-between items-end gap-4 text-xs font-bold text-center">
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>Authorised Signatory</p>
                </div>
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>Signature of Customer</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
);

/* ---------------- MaterialDetails page component ---------------- */
export default function MaterialDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // refs & layout helpers
  const mainRef = useRef(null);
  const mainRefPrint = useRef(null);
  const itemRefs = useRef({});

  const [materials, setMaterials] = useState([]);
  const [recipientInfo, setRecipientInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF / layout state
  const [isPDFMode, setIsPDFMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [spacers, setSpacers] = useState({});
  const [showSpacers, setShowSpacers] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [pageBreaks, setPageBreaks] = useState([]);

  // Financials
  const [applyGST, setApplyGST] = useState(true);
  const [cgstPerc, setCgstPerc] = useState(9);
  const [sgstPerc, setSgstPerc] = useState(9);
  const [packingCharges, setPackingCharges] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

  // totals - derived
  const subtotal = useMemo(
    () => materials.reduce((s, m) => s + Number(m.amount || 0), 0),
    [materials]
  );
  const totalQty = useMemo(
    () => materials.reduce((s, m) => s + Number(m.qty || 0), 0),
    [materials]
  );
  const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
  const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
  const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;

  // load data either from location.state or API by id
  useEffect(() => {
    const init = async () => {
      try {
        if (location.state?.materials) {
          setMaterials(location.state.materials || []);
          setRecipientInfo(location.state.recipientInfo || {});
          if (location.state.cgstPerc != null)
            setCgstPerc(location.state.cgstPerc);
          if (location.state.sgstPerc != null)
            setSgstPerc(location.state.sgstPerc);
          if (location.state.applyGST != null)
            setApplyGST(location.state.applyGST);
          if (location.state.packingCharges != null)
            setPackingCharges(location.state.packingCharges);
          setLoading(false);
        } else if (id) {
          const token = getToken();
          const res = await fetch(`${apiBaseUrl}/api/materials/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!res.ok) throw new Error("Failed to fetch material doc");
          const data = await res.json();
          setMaterials(data.materials || []);
          setRecipientInfo(data.recipientInfo || {});
          if (data.financials) {
            setApplyGST(data.financials.applyGST ?? applyGST);
            setCgstPerc(data.financials.cgstPerc ?? cgstPerc);
            setSgstPerc(data.financials.sgstPerc ?? sgstPerc);
            setPackingCharges(data.financials.packingCharges ?? packingCharges);
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load material details");
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  // autoscale preview based on container width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth - 32;
      const target = 794;
      setScale(w < target ? w / target : 1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // helper to update spacer values
  const updateSpacer = (key, val) => setSpacers((p) => ({ ...p, [key]: val }));

  // auto-layout algorithm (tries to insert spacers so items don't split across pages)
  const calculatePageBreaks = () => {
    if (!mainRef.current) return;
    const containerHeight = mainRef.current.scrollHeight;
    const pageHeightPx = 1123;
    const breaks = [];
    let currentH = pageHeightPx;
    while (currentH < containerHeight + pageHeightPx) {
      breaks.push(currentH);
      currentH += pageHeightPx;
    }
    setPageBreaks(breaks);
  };

  const handleAutoAdjust = (showUi = true) => {
    if (!mainRef.current) return;
    setIsAdjusting(true);
    if (showUi) setShowSpacers(true);
    setSpacers({});

    setTimeout(() => {
      const pageHeightPx = 1123;
      const newSpacers = {};
      let totalAdded = 0;
      const keys = [
        "header",
        ...materials.map((_, i) => `m-${i}`),
        "totals",
        "footer",
      ];

      keys.forEach((key) => {
        const el = itemRefs.current[key];
        if (!el) return;
        const naturalTop = el.offsetTop + totalAdded;
        const height = el.offsetHeight;
        const bottom = naturalTop + height;
        const startPage = Math.floor(naturalTop / pageHeightPx);
        const endPage = Math.floor(bottom / pageHeightPx);

        if (startPage !== endPage) {
          const nextPageStart = (startPage + 1) * pageHeightPx;
          const spaceNeeded = nextPageStart - naturalTop + 50;
          let spacerKey = key;
          if (key === "totals") spacerKey = "spacer-totals";
          if (key === "footer") spacerKey = "spacer-footer";
          if (key !== "header") {
            newSpacers[spacerKey] = Math.ceil(spaceNeeded);
            totalAdded += spaceNeeded;
          }
        }
      });

      setSpacers(newSpacers);
      setIsAdjusting(false);
      calculatePageBreaks();
    }, 200);
  };

  // PDF generation (uses html2canvas + jsPDF) - multi-page support
  const downloadPDF = async () => {
    const printNode = mainRefPrint.current;
    if (!printNode) return;

    setIsPDFMode(true);
    await new Promise((r) => setTimeout(r, 200));

    const originalDPR = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      writable: true,
      configurable: true,
      value: 1,
    });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(printNode, {
        scale: 2,
        width: 794,
        useCORS: true,
        scrollY: 0,
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pdfW) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgHeight);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        position += pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -position, pdfW, imgHeight);
        heightLeft -= pdfH;
      }

      pdf.save(`${recipientInfo.toName || "material_details"}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Failed to generate PDF");
    } finally {
      Object.defineProperty(window, "devicePixelRatio", {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
      setIsPDFMode(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!id) {
      alert(
        "No document id to save. Implement POST if you want server save for new docs."
      );
      return;
    }
    setIsSaving(true);
    try {
      const token = getToken();
      const payload = {
        materials,
        recipientInfo,
        financials: { applyGST, cgstPerc, sgstPerc, packingCharges },
      };
      const res = await fetch(`${apiBaseUrl}/api/materials/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Saved successfully");
    } catch (err) {
      console.error(err);
      alert("Error saving document");
    } finally {
      setIsSaving(false);
    }
  };

  // ready handlers & layout adjustments
  useLayoutEffect(() => {
    if (!loading && materials.length > 0)
      setTimeout(() => handleAutoAdjust(false), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, materials]);

  useEffect(() => {
    if (!loading) calculatePageBreaks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, spacers, scale]);

  // UI state: loading / error
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  // template props passed to printable template and print preview
  const templateProps = {
    data: { materials, recipientInfo, id },
    financials: {
      applyGST,
      cgstPerc,
      sgstPerc,
      packingCharges,
      subtotal,
      totalQty,
      cgstAmount,
      sgstAmount,
      grandTotal,
    },
    actions: { setApplyGST, setCgstPerc, setSgstPerc, setPackingCharges },
    spacers,
    showSpacers,
    updateSpacer,
    isPDFMode,
    itemRefs,
  };

  return (
    <div className="bg-gray-100 p-4 font-sans text-gray-800 min-h-screen">
      {/* --- TOOLBAR: Exact 2-row layout (pills row above, actions row below) --- */}
      <div className="max-w-[794px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">Preview</h1>
        <div className="flex flex-wrap justify-center gap-2 items-center">
          {/* Row 1: Pills (centered) */}
          <div className="flex justify-center items-center gap-3 mb-3">
            {/* Enable GST pill */}
            <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1 text-sm shadow-sm">
              <input
                type="checkbox"
                checked={applyGST}
                onChange={(e) => setApplyGST(e.target.checked)}
                className="w-4 h-4 rounded-sm"
              />
              <span className="select-none">Enable GST</span>
            </label>

            {/* Auto-Layout pill (purple outline) */}
            <button
              onClick={() => handleAutoAdjust(true)}
              disabled={isAdjusting}
              className="flex items-center gap-2 px-3 py-1 rounded-md text-sm border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-50 shadow-sm"
            >
              {isAdjusting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              <span>Auto-Layout</span>
            </button>
          </div>

          {/* Row 2: Action buttons (centered, larger) */}
          <div className="flex justify-center items-center gap-3">
            {/* Save (green) */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save</span>
            </button>

            {/* Download PDF (dark navy) */}
            <button
              onClick={downloadPDF}
              className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-900 flex items-center gap-2"
            >
              <Printer size={14} />
              <span>Download PDF</span>
            </button>

            {/* Back (light) */}
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-md bg-white border border-slate-200 text-sm shadow-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="relative">
            {showSpacers &&
              pageBreaks.map((y, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t-2 border-dashed border-red-300 z-50 opacity-60 pointer-events-none"
                  style={{ top: `${y}px` }}
                >
                  <span className="bg-red-300 text-white text-[10px] px-2 rounded-b absolute right-0">
                    Page {i + 2} Start
                  </span>
                </div>
              ))}

            <MaterialTemplate ref={mainRef} {...templateProps} />
          </div>
        </div>
      </div>

      {/* Hidden print node */}
      <div
        id="print-view"
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          width: "794px",
          overflow: "visible",
        }}
      >
        <MaterialTemplate
          ref={mainRefPrint}
          {...templateProps}
          isPDFMode={true}
          itemRefs={null}
        />
      </div>
    </div>
  );
}
