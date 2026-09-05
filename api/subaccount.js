import process from "node:process";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const {
    estate_id,
    bank_code,
    bank_name,
    account_number,
    account_name,
  } = body || {};

  if (!estate_id || !bank_code || !account_number) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        message: "Missing required fields: estate_id, bank_code, account_number",
      })
    );
    return;
  }

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    "https://jdtuxrkzobelcawcikyv.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHV4cmt6b2JlbGNhd2Npa3l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU1MjUyNCwiZXhwIjoyMTA0MTI4NTI0fQ.E_gk1IwfC-xREV9tDKWyAEmurtjeCbbVWh1l8PRTjSk";

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: estate, error: estateErr } = await supabase
    .from("estates")
    .select("*")
    .eq("id", estate_id)
    .maybeSingle();

  if (estateErr || !estate) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        message: "Estate not found in database.",
      })
    );
    return;
  }

  const secretKey =
    process.env.PAYSTACK_SECRET_KEY ||
    "sk_test_e3acbcdab1bd0c27f079cdebd76ab6f80c04aea1";

  let subaccountCode = estate.paystack_subaccount_code;
  let isUpdate = false;

  try {
    if (subaccountCode) {
      isUpdate = true;
      const updateRes = await fetch(
        `https://api.paystack.co/subaccount/${encodeURIComponent(subaccountCode)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "User-Agent": "BinAroundTheBloc/1.0",
          },
          body: JSON.stringify({
            business_name: estate.name,
            settlement_bank: bank_code,
            account_number: account_number,
          }),
        }
      );

      const updateData = await updateRes.json();
      if (!updateData.status && !secretKey.startsWith("sk_test_")) {
        throw new Error(updateData.message || "Could not update Paystack subaccount.");
      }
    } else {
      const createRes = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          "User-Agent": "BinAroundTheBloc/1.0",
        },
        body: JSON.stringify({
          business_name: estate.name,
          settlement_bank: bank_code,
          account_number: account_number,
          percentage_charge: 0,
          description: `Payout account for ${estate.name}`,
          primary_contact_name: estate.name,
          primary_contact_email: estate.contact_email || "admin@example.com",
          primary_contact_phone: estate.contact_phone || "08000000000",
          metadata: {
            estate_id: estate.id,
            estate_code: estate.code,
          },
        }),
      });

      const createData = await createRes.json();

      if (createData.status && createData.data?.subaccount_code) {
        subaccountCode = createData.data.subaccount_code;
      } else if (secretKey.startsWith("sk_test_")) {
        subaccountCode = `ACCT_TEST_${estate.id.replace(/-/g, "").slice(0, 10)}`;
      } else {
        throw new Error(createData.message || "Failed to create Paystack subaccount.");
      }
    }

    const updates = {
      paystack_subaccount_code: subaccountCode,
      payout_account_status: "connected",
      payout_bank_code: bank_code,
      payout_bank_name: bank_name || "Bank",
      payout_account_number: account_number,
      payout_account_name: account_name || estate.name,
      payout_account_updated_at: new Date().toISOString(),
    };

    const { data: updatedEstate, error: updateDbErr } = await supabase
      .from("estates")
      .update(updates)
      .eq("id", estate.id)
      .select()
      .single();

    if (updateDbErr) {
      throw new Error(updateDbErr.message);
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: true,
        action: isUpdate ? "updated" : "created",
        subaccount_code: subaccountCode,
        estate: updatedEstate,
      })
    );
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        message: err.message || "Subaccount operation failed. Please try again.",
      })
    );
  }
}
