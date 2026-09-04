import { useState, useEffect } from "react";
import { LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DropdownUi from "../ui/DropdownUi";
import InputUi from "../ui/Input";
import { StyledH1 } from "../styles/CommonStyles";
import Button from "../ui/Button";
import createPayment from "../api/createPayment";
import { usePaystackPayment } from "react-paystack";

function getPaystackChargeDetails(baseAmount, platformFee) {
  const chargeBase = baseAmount + platformFee;
  let grossAmount = chargeBase;
  let iteration = 0;

  while (iteration < 20) {
    const paystackFee =
      Math.ceil(grossAmount * PAYSTACK_FEE_RATE) + PAYSTACK_FIXED_FEE;
    const nextGross = chargeBase + paystackFee;
    if (nextGross === grossAmount) {
      return { paystackFee, grossAmount };
    }
    grossAmount = nextGross;
    iteration += 1;
  }

  const paystackFee =
    Math.ceil(grossAmount * PAYSTACK_FEE_RATE) + PAYSTACK_FIXED_FEE;
  return { paystackFee, grossAmount };
}

import useAuth from "../hooks/useAuth";
import showToast from "../utils/showToast";
import supabase from "../services/supabase";
import verifyPayment from "../api/verifyPayment";

const PLATFORM_FEE = 100;
const PAYSTACK_FEE_RATE = 0.015;
const PAYSTACK_FIXED_FEE = 100;

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

const DEFAULT_AMOUNT = 5000;

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

function Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formattedAddress = [
    user?.housenumber ? `House ${user.housenumber}` : "",
    user?.apartment || "",
    user?.streetname || "",
  ]
    .filter(Boolean)
    .join(", ");

  const [fullName, setFullName] = useState(user?.fullname || "");
  const [address, setAddress] = useState(formattedAddress || user?.streetname || "");
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [currentBillId, setCurrentBillId] = useState(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFeeAndBill() {
      if (!user?.id) return;

      try {
        const { data: bill } = await supabase
          .from("bills")
          .select("id, amount, status")
          .eq("resident_id", user.id)
          .ilike("month", month)
          .eq("year", String(year))
          .maybeSingle();

        if (bill) {
          setCurrentBillId(bill.id);
          setAmount(bill.amount);
          return;
        }

        setCurrentBillId(null);

        if (user?.property_type_id) {
          const { data: pt } = await supabase
            .from("property_types")
            .select("fee")
            .eq("id", user.property_type_id)
            .maybeSingle();

          if (pt && pt.fee) {
            setAmount(pt.fee);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load fee/bill for resident:", err);
      }
    }

    loadFeeAndBill();
  }, [user?.id, user?.property_type_id, month, year]);

  const numericAmount = Number(String(amount).replace(/[^0-9.-]+/g, "")) || 0;
  const baseAmount = numericAmount;
  const platformFee = PLATFORM_FEE;
  const { grossAmount: paystackGrossAmount } =
    getPaystackChargeDetails(baseAmount, platformFee);
  const displayedTotalAmount = baseAmount + platformFee;
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const initializePayment = usePaystackPayment({
    publicKey: PAYSTACK_PUBLIC_KEY || "",
  });

  const amountKobo = Math.round(paystackGrossAmount * 100);

  async function handleSuccess(reference) {
    console.log("Paystack popup success, reference received:", reference);
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
      : displayedTotalAmount;

    const paymentRecord = {
      receiptid: refString,
      estate_id: user?.estate_id || null,
      resident_id: user?.id || null,
      bill_id: currentBillId || null,
      email:
        user?.email ||
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail"),
      fullname: fullName.trim(),
      address: address.trim(),
      amount: baseAmount,
      totalPaid: paystackAmount,
      month,
      year,
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
    navigate(`/receipts/${receiptKey}`);
  }

  function handleClose() {
    setIsSubmitting(false);
    showToast("info", "Payment window closed.");
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <StyledH1>Make Payment</StyledH1>

        <p className="text-brand-accent/80 mt-2">
          Pay for your selected billing period and keep a verified digital
          receipt for future reference.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <div className="border-b border-brand-accent/10 pb-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-brand-accent">
                  Payment Details
                </h2>
              </div>

              <p className="mt-2 text-sm text-brand-accent/55">
                Enter your waste collection payment amount for the selected
                billing period. Your receipt will be available immediately after
                payment confirmation.
              </p>
            </div>

            <form className="mt-6 space-y-4">
              <InputUi
                label="Full Name"
                type="text"
                className="mt-2 bg-white"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />

              <InputUi
                label="House Address"
                type="text"
                className="mt-2 bg-white"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />

              <InputUi
                label="Waste Bill Amount"
                type="number"
                className="mt-2 bg-white"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="5000"
              />

              <DropdownUi
                label="Month"
                className="mt-2"
                buttonClassName="bg-white"
                options={MONTH_OPTIONS}
                value={month}
                onChange={setMonth}
              />

              <DropdownUi
                label="Year"
                className="mt-2"
                buttonClassName="bg-white"
                options={YEAR_OPTIONS}
                value={year}
                onChange={setYear}
              />

              <div
                className="rounded-sm border border-brand-primary/15 px-4 py-4 text-sm text-brand-primary/85"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(90, 183, 118, 0.08), rgba(255, 255, 255, 1))",
                }}>
                This payment covers waste collection services for the selected
                month. The current base charge is fixed.
              </div>
            </form>
          </section>

          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <h2 className="text-2xl font-semibold text-brand-accent">
              Payment Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm text-brand-accent/70">
              <div className="flex items-center justify-between gap-4">
                <span>Base fee</span>
                <span className="font-medium text-brand-accent">
                  {formatNaira(baseAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Platform fee</span>
                <span className="font-medium text-brand-accent">
                  {formatNaira(platformFee)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-brand-accent/10 pt-5">
              <span className="text-2xl font-semibold text-brand-primary">
                Total Amount
              </span>
              <span className="text-3xl font-semibold text-brand-primary">
                {formatNaira(displayedTotalAmount)}
              </span>
            </div>
            <p className="mt-3 text-xs text-brand-accent/50">
              Total charge excludes Paystack gateway fees.
            </p>
          </section>

          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            {PAYSTACK_PUBLIC_KEY ? (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    if (
                      !fullName.trim() ||
                      !address.trim() ||
                      numericAmount <= 0
                    ) {
                      showToast(
                        "error",
                        "Please fill name, address, and a valid amount.",
                      );
                      return;
                    }

                    const receiptId = `RCT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    const paymentConfig = {
                      reference: receiptId,
                      email:
                        user?.email ||
                        localStorage.getItem("userEmail") ||
                        sessionStorage.getItem("userEmail") ||
                        "no-reply@example.com",
                      amount: amountKobo,
                      publicKey: PAYSTACK_PUBLIC_KEY,
                      metadata: {
                        custom_fields: [
                          {
                            display_name: "fullName",
                            variable_name: "fullName",
                            value: fullName,
                          },
                          {
                            display_name: "address",
                            variable_name: "address",
                            value: address,
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
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base">
                  <LockKeyhole size={18} />
                  {isSubmitting ? "Processing…" : "Proceed to Payment"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base">
                <LockKeyhole size={18} />
                Paystack not configured
              </Button>
            )}

            <div className="mt-5 flex items-center justify-center gap-3 text-sm text-brand-accent/50">
              <span>Secured by</span>
              <img src="/paystack-dark.svg" alt="Paystack" className="h-4" />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-brand-accent/10 bg-white p-6">
            <h2 className="text-2xl font-semibold text-brand-accent">
              Need Help?
            </h2>

            <p className="mt-4 text-sm leading-7 text-brand-accent/65">
              If you have any issues making payment, our support team is here to
              help.
            </p>

            <Link
              to="/support"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm border border-brand-accent/10 px-5 py-3 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/4">
              Contact Support
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Payment;
