import manta from "../services/manta";

async function fetchReceiptByField(field, value) {
  const response = await manta.fetchOneRecord({
    table: "batb-payments",
    where: {
      [field]: value,
    },
  });

  return response?.data?.data ?? null;
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
  } catch {
    // Try the record ID next.
  }

  try {
    return await fetchReceiptByField("id", receiptId);
  } catch {
    return null;
  }
}
