import supabase from "../services/supabase";

export default async function createPayment(payment) {
  console.log("Creating payment in Supabase:", payment);

  if (payment.receiptid) {
    const { data: existing } = await supabase
      .from("payments")
      .select("*")
      .eq("receiptid", payment.receiptid)
      .maybeSingle();

    if (existing) {
      console.log("Payment already recorded:", existing);
      return existing;
    }
  }

  let estateId = payment.estate_id;
  let residentId = payment.resident_id;

  if ((!estateId || !residentId) && payment.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, estate_id")
      .eq("email", payment.email)
      .maybeSingle();

    if (profile) {
      estateId = estateId || profile.estate_id;
      residentId = residentId || profile.id;
    }
  }

  const recordToInsert = {
    receiptid: payment.receiptid,
    estate_id: estateId || null,
    resident_id: residentId || null,
    bill_id: payment.bill_id || null,
    email: payment.email,
    fullname: payment.fullname,
    address: payment.address,
    amount: payment.amount,
    totalPaid: payment.totalPaid ?? payment.amount,
    month: payment.month,
    year: payment.year,
    status: payment.status || "Successful",
    paymentMethod: payment.paymentMethod || "Paystack",
    reference: payment.reference || payment.receiptid,
    recorded_by: payment.recorded_by || "resident",
    createdat: payment.createdat || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("payments")
    .insert([recordToInsert])
    .select()
    .single();

  if (error) {
    console.error("Supabase payment persistence error:", error);
    throw new Error(`Payment persistence error: ${error.message}`);
  }

  if (data.status === "Successful") {
    try {
      if (data.bill_id) {
        await supabase
          .from("bills")
          .update({ status: "Paid", paid_at: new Date().toISOString() })
          .eq("id", data.bill_id);
      } else if (residentId) {
        await supabase
          .from("bills")
          .update({ status: "Paid", paid_at: new Date().toISOString() })
          .eq("resident_id", residentId)
          .ilike("month", payment.month)
          .eq("year", payment.year);
      }
    } catch (billErr) {
      console.warn("Could not mark bill as paid:", billErr);
    }
  }

  console.log("Payment created successfully:", data);
  return data;
}

