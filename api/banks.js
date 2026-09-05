import process from "node:process";

let cachedBanks = null;
let cacheTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const now = Date.now();
  if (cachedBanks && now - cacheTime < CACHE_TTL_MS) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: true, data: cachedBanks }));
    return;
  }

  const secretKey =
    process.env.PAYSTACK_SECRET_KEY ||
    "sk_test_e3acbcdab1bd0c27f079cdebd76ab6f80c04aea1";

  try {
    const paystackRes = await fetch(
      "https://api.paystack.co/bank?country=nigeria&perPage=200",
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "User-Agent": "BinAroundTheBloc/1.0",
        },
      }
    );

    const data = await paystackRes.json();

    if (!data.status) {
      throw new Error(data.message || "Failed to fetch banks from Paystack");
    }

    const banks = (data.data || []).map((b) => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
      id: b.id,
    }));

    if (secretKey.startsWith("sk_test_")) {
      const hasTestBank = banks.some((b) => b.code === "001");
      if (!hasTestBank) {
        banks.unshift({
          name: "Test Bank (Paystack Simulator)",
          code: "001",
          slug: "test-bank",
          id: 24,
        });
      }
    }

    cachedBanks = banks;
    cacheTime = now;

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: true, data: banks }));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        error: "Unable to load banks list",
        details: err.message,
      })
    );
  }
}
