import { useState, useEffect } from "react";
import { LockKeyhole, CheckCircle2, ArrowUpRight, Building2, UserCheck, MapPin, Tag, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DropdownUi from "../ui/DropdownUi";
import { StyledH1 } from "../styles/CommonStyles";
import Button from "../ui/Button";
import createPayment from "../api/createPayment";
import { usePaystackPayment } from "react-paystack";
import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";
import supabase from "../services/supabase";
import verifyPayment from "../api/verifyPayment";

const MONTH_OPTIONS = [
  { label: "January", value: "january" },
  { label: "February", value: "february" },
  { label: "March", value: "march" },
  { label: "April", value: "april" },
  { label: "May", value: "may" },
  { label: "June", value: "june" },
  { label: "July", value: "july" },
  { label: "August", value: "august" },
  { label: "September", value: "september" },
  { label: "October", value: "october" },
  { label: "November", value: "november" },
  { label: "December", value: "december" },
];

const YEAR_OPTIONS = [
  { label: "2026", value: "2026" },
  { label: "2027", value: "2027" },
  { label: "2028", value: "2028" },
  { label: "2029", value: "2029" },
  { label: "2030", value: "2030" },
];

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
}

function Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [month, setMonth] = useState(() => {
    const currentMonth = new Date().getMonth();
    return MONTH_OPTIONS[currentMonth]?.value || MONTH_OPTIONS[0].value;
  });
  const [year, setYear] = useState(() => {
    const currentYear = new Date().getFullYear().toString();
    return YEAR_OPTIONS.some((option) => option.value === currentYear)
      ? currentYear
      : YEAR_OPTIONS[0].value;
  });

  const [currentBillId, setCurrentBillId] = useState(null);
  const [effectiveAmount, setEffectiveAmount] = useState(5000);
  const [isPaid, setIsPaid] = useState(false);
  const [paidReceiptId, setPaidReceiptId] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estatePayout, setEstatePayout] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(true);

  useEffect(() => {
    async function loadEstatePayout() {
      if (!user?.estate_id) {
        setIsLoadingPayout(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("estates")
          .select("id, name, paystack_subaccount_code, payout_account_status")
          .eq("id", user.estate_id)
          .maybeSingle();

        if (data) {
          setEstatePayout(data);
        }
      } catch (err) {
        console.warn("Could not load estate payout status:", err);
      } finally {
        setIsLoadingPayout(false);
      }
    }

    loadEstatePayout();
  }, [user?.estate_id]);

  useEffect(() => {
    async function loadPeriodBilling() {
      if (!user?.id) return;
      setIsLoadingDetails(true);

      try {
        let baseFee = 5000;

        if (user?.property_type_id) {
          const { data: pt } = await supabase
            .from("property_types")
            .select("id, name, fee")
            .eq("id", user.property_type_id)
            .maybeSingle();

          if (pt?.fee) {
            baseFee = Number(pt.fee);
          }
        } else if (user?.estate_id) {
          const { data: estatePts } = await supabase
            .from("property_types")
            .select("id, name, fee")
            .eq("estate_id", user.estate_id)
            .eq("is_archived", false)
            .order("fee", { ascending: true });

          if (estatePts && estatePts.length > 0) {
            const matched = estatePts.find(
              (p) => p.name?.toLowerCase() === user?.property_type_name?.toLowerCase()
            );
            baseFee = matched?.fee || estatePts[0]?.fee || 5000;
          }
        }

        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id, receiptid, amount, status")
          .eq("resident_id", user.id)
          .ilike("month", month)
          .eq("year", String(year))
          .eq("status", "Successful")
          .maybeSingle();

        if (existingPayment) {
          setIsPaid(true);
          setPaidReceiptId(existingPayment.receiptid || existingPayment.id);
          setEffectiveAmount(Number(existingPayment.amount) || baseFee);
          setIsLoadingDetails(false);
          return;
        }

        const { data: bill } = await supabase
          .from("bills")
          .select("id, amount, status")
          .eq("resident_id", user.id)
          .ilike("month", month)
          .eq("year", String(year))
          .maybeSingle();

        if (bill) {
          setCurrentBillId(bill.id);
          setEffectiveAmount(Number(bill.amount) || baseFee);
          if (bill.status === "Paid") {
            setIsPaid(true);
            setPaidReceiptId(null);
          } else {
            setIsPaid(false);
            setPaidReceiptId(null);
          }
        } else {
          setCurrentBillId(null);
          setEffectiveAmount(baseFee);
          setIsPaid(false);
          setPaidReceiptId(null);
        }
      } catch (err) {
        console.warn("Could not load period billing info:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadPeriodBilling();
  }, [user?.id, user?.property_type_id, user?.estate_id, user?.property_type_name, month, year]);

  const PAYSTACK_PUBLIC_KEY =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    "pk_test_314f8bf58f6e9504596192895c41207003bc263a";
  const initializePayment = usePaystackPayment({
    publicKey: PAYSTACK_PUBLIC_KEY || "",
  });

  const amountKobo = Math.round(Number(effectiveAmount) * 100);
  const hasPayoutAccount = Boolean(estatePayout?.paystack_subaccount_code);

  async function handleSuccess(reference) {
    setIsSubmitting(true);

    const refString = reference?.reference || reference?.trxref || `RCT-${Date.now()}`;

    let verificationResult;
    try {
      verificationResult = await verifyPayment(refString);
    } catch (verErr) {
      console.warn("Backend verification notice:", verErr);
    }

    if (!verificationResult?.verified) {
      showToast("error", "Transaction could not be verified by Paystack.");
      setIsSubmitting(false);
      return;
    }

    const verifiedChannel = verificationResult?.channel || reference?.channel || "card";
    const paystackAmount = reference?.amount
      ? Number(reference.amount) / 100
      : effectiveAmount;

    const fullAddress = [
      user?.housenumber ? `House ${user.housenumber}` : "",
      user?.apartment || "",
      user?.streetname || "",
    ]
      .filter(Boolean)
      .join(", ");

    const paymentRecord = {
      receiptid: refString,
      estate_id: user?.estate_id || null,
      resident_id: user?.id || null,
      bill_id: currentBillId || null,
      email:
        user?.email ||
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail"),
      fullname: user?.fullname || "Resident",
      address: fullAddress || "Estate Property",
      amount: effectiveAmount,
      totalPaid: paystackAmount,
      month: month.toLowerCase(),
      year: String(year),
      status: "Successful",
      paymentMethod: verifiedChannel,
      reference: refString,
      recorded_by: "resident",
      createdat: new Date().toISOString(),
    };

    let createdPayment;

    try {
      createdPayment = await createPayment(paymentRecord);
      showToast("success", "Payment verified and recorded successfully.");
    } catch (err) {
      console.error("createPayment failed:", err);
      const message = err?.message || "Could not log payment.";
      showToast(
        "error",
        `Payment succeeded but could not be logged: ${message}`,
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    const receiptKey =
      createdPayment?.receiptid || createdPayment?.id || refString;
    navigate(`/app/receipts/${receiptKey}`);
  }

  function handleClose() {
    setIsSubmitting(false);
    showToast("info", "Payment window closed.");
  }

  function handleInitiatePayment() {
    if (!hasPayoutAccount) {
      showToast(
        "error",
        "Online payments are currently unavailable for this estate. Please contact your estate administrator."
      );
      return;
    }

    if (isPaid) {
      showToast("info", "This billing period is already paid.");
      return;
    }

    if (!effectiveAmount || effectiveAmount <= 0) {
      showToast("error", "No valid waste fee found for this property.");
      return;
    }

    const receiptId = `RCT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const fullAddress = [
      user?.housenumber ? `House ${user.housenumber}` : "",
      user?.apartment || "",
      user?.streetname || "",
    ]
      .filter(Boolean)
      .join(", ");

    const paymentConfig = {
      reference: receiptId,
      email:
        user?.email ||
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail") ||
        "no-reply@example.com",
      amount: amountKobo,
      publicKey: PAYSTACK_PUBLIC_KEY,
      subaccount: estatePayout.paystack_subaccount_code,
      metadata: {
        custom_fields: [
          {
            display_name: "fullName",
            variable_name: "fullName",
            value: user?.fullname || "Resident",
          },
          {
            display_name: "address",
            variable_name: "address",
            value: fullAddress || "Estate Property",
          },
          {
            display_name: "estate",
            variable_name: "estate",
            value: user?.estate?.name || "Estate",
          },
          {
            display_name: "month",
            variable_name: "month",
            value: month,
          },
          {
            display_name: "year",
            variable_name: "year",
            value: String(year),
          },
        ],
      },
    };

    setIsSubmitting(true);
    initializePayment({
      config: paymentConfig,
      onSuccess: handleSuccess,
      onClose: handleClose,
    });
  }

  const estateName = user?.estate?.name || "Estate Residence";
  const propertyAddress = [
    user?.housenumber ? `House ${user.housenumber}` : "",
    user?.apartment || "",
    user?.streetname || "",
  ]
    .filter(Boolean)
    .join(", ") || "Assigned Property";
  const propertyCategory = user?.property_type_name || "Standard";

  return (
    <div className="space-y-6 pb-8">
      <div>
        <StyledH1>Make Payment</StyledH1>
        <p className="text-brand-accent/80 mt-2">
          Review your verified estate property billing details and complete your monthly payment.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <div className="border-b border-brand-accent/10 pb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Verified Resident Account
              </span>
              <h2 className="text-2xl font-semibold text-brand-accent mt-1">
                Property & Rate Details
              </h2>
              <p className="mt-1 text-sm text-brand-accent/60">
                These details are linked to your estate registration and configured by your estate administrator.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 rounded-sm border border-brand-accent/8 bg-brand-accent/[0.02] p-3.5">
                <Building2 className="size-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-brand-accent/50 font-medium">Estate Name</p>
                  <p className="font-semibold text-brand-accent text-sm truncate mt-0.5">{estateName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-brand-accent/8 bg-brand-accent/[0.02] p-3.5">
                <UserCheck className="size-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-brand-accent/50 font-medium">Resident</p>
                  <p className="font-semibold text-brand-accent text-sm truncate mt-0.5">{user?.fullname || "Resident"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-brand-accent/8 bg-brand-accent/[0.02] p-3.5">
                <MapPin className="size-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-brand-accent/50 font-medium">Assigned Property</p>
                  <p className="font-semibold text-brand-accent text-sm truncate mt-0.5">{propertyAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-brand-accent/8 bg-brand-accent/[0.02] p-3.5">
                <Tag className="size-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-brand-accent/50 font-medium">Property Category</p>
                  <p className="font-semibold text-brand-accent text-sm truncate mt-0.5">{propertyCategory}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-brand-accent/10 bg-white p-6 space-y-4">
            <div className="border-b border-brand-accent/10 pb-4">
              <h3 className="text-lg font-semibold text-brand-accent">
                Billing Period
              </h3>
              <p className="text-xs text-brand-accent/60 mt-1">
                Choose the month and year you wish to settle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DropdownUi
                label="Billing Month"
                options={MONTH_OPTIONS}
                value={month}
                onChange={setMonth}
                buttonClassName="bg-white"
              />

              <DropdownUi
                label="Billing Year"
                options={YEAR_OPTIONS}
                value={year}
                onChange={setYear}
                buttonClassName="bg-white"
              />
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center p-6 text-sm text-brand-accent/60">
                Checking billing records...
              </div>
            ) : isPaid ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-status-success/30 bg-status-success/10 p-4 text-sm text-status-success">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bill Already Settled</p>
                    <p className="text-xs text-status-success/80 mt-0.5">
                      The waste collection bill for {month.charAt(0).toUpperCase() + month.slice(1)} {year} is paid and verified.
                    </p>
                  </div>
                </div>

                <Link
                  to={paidReceiptId ? `/app/receipts/${paidReceiptId}` : "/app/receipts"}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-white text-brand-accent font-semibold text-xs border border-brand-accent/10 hover:bg-stone-50 transition-colors shadow-xs self-start sm:self-auto">
                  View Receipt <ArrowUpRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="rounded-sm border border-brand-primary/20 bg-brand-primary/[0.04] p-4 text-xs text-brand-accent/80 flex items-center justify-between">
                <span>
                  Standard fee for <strong>{propertyCategory}</strong> in <strong>{estateName}</strong>.
                </span>
                <span className="font-semibold text-brand-primary text-sm">
                  {formatNaira(effectiveAmount)}
                </span>
              </div>
            )}

            {!isLoadingPayout && !hasPayoutAccount && (
              <div className="flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <AlertTriangle className="size-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Online Payments Unavailable</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Online payments are currently unavailable for this estate. Please contact your estate administrator.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <h2 className="text-xl font-semibold text-brand-accent">
              Payment Summary
            </h2>

            <div className="mt-5 space-y-3 text-sm text-brand-accent/70">
              <div className="flex items-center justify-between">
                <span>Billing Period</span>
                <span className="font-medium text-brand-accent">
                  {month.charAt(0).toUpperCase() + month.slice(1)} {year}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Property Category</span>
                <span className="font-medium text-brand-accent">
                  {propertyCategory}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Waste Collection Fee</span>
                <span className="font-medium text-brand-accent">
                  {formatNaira(effectiveAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-brand-accent/10 pt-4 mt-2">
                <span className="text-lg font-semibold text-brand-accent">
                  Total Due
                </span>
                <span className="text-2xl font-bold text-brand-primary">
                  {formatNaira(effectiveAmount)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {isPaid ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-12 rounded-sm bg-stone-200 text-stone-500 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Paid for this Period
                </button>
              ) : !isLoadingPayout && !hasPayoutAccount ? (
                <Button
                  type="button"
                  disabled
                  className="w-full h-12 inline-flex items-center justify-center gap-2 text-sm opacity-60 cursor-not-allowed">
                  <LockKeyhole size={18} />
                  Online Payments Unavailable
                </Button>
              ) : PAYSTACK_PUBLIC_KEY ? (
                <Button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isSubmitting || isLoadingDetails || effectiveAmount <= 0}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 text-base">
                  <LockKeyhole size={18} />
                  {isSubmitting
                    ? "Processing Payment..."
                    : `Pay ${formatNaira(effectiveAmount)}`}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled
                  className="w-full h-12 inline-flex items-center justify-center gap-2 text-base">
                  <LockKeyhole size={18} />
                  Paystack not configured
                </Button>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2.5 text-xs text-brand-accent/50">
              <span>Secured by</span>
              <img src="/paystack-dark.svg" alt="Paystack" className="h-3.5" />
            </div>
          </section>

          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <h3 className="text-base font-semibold text-brand-accent">
              Need Help?
            </h3>
            <p className="mt-2 text-xs leading-5 text-brand-accent/65">
              Contact your estate administrator or support team if your assigned property tier or fee schedule is incorrect.
            </p>
            <Link
              to="/app/support"
              className="mt-4 inline-flex w-full items-center justify-center rounded-sm border border-brand-accent/10 px-4 py-2.5 text-xs font-semibold text-brand-accent transition-colors hover:bg-brand-accent/4">
              Contact Support
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Payment;
