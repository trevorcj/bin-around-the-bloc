import manta from "../services/manta";

export default async function createPayment(payment) {
  console.log("Creating payment:", payment);

  const response = await manta.createRecords({
    table: "batb-payments",
    data: [payment],
  });

  console.log("Manta createRecords response:", response);

  const createdResult = response?.data?.results?.[0];

  console.log("Created result:", createdResult);

  if (createdResult?.success) {
    console.log("Payment created:", createdResult.record);
    return createdResult.record;
  }

  const details =
    createdResult?.error ||
    response?.message ||
    "Failed to create payment record.";

  console.error("Payment persistence error:", details);

  throw new Error(`Payment persistence error: ${details}`);
}
