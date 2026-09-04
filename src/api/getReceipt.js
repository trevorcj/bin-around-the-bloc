import supabase from "../services/supabase";

async function fetchReceiptByField(field, value) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, estates(name, code)")
    .eq(field, value)
    .maybeSingle();

  if (error) {
    console.warn(`Error querying receipt by ${field}:`, error.message);
    return null;
  }

  return data ?? null;
}

export default async function getReceipt(receiptId) {
  if (!receiptId) {
    return null;
  }

  try {
    const byReceiptId = await fetchReceiptByField("receiptid", receiptId);
    if (byReceiptId) {
      return byReceiptId;
    }
  } catch (err) {
    void err;
  }

  try {
    return await fetchReceiptByField("id", receiptId);
  } catch {
    return null;
  }
}

