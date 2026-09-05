import process from "node:process";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  let accountNumber;
  let bankCode;

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    accountNumber = String(body?.account_number || body?.accountNumber || "").trim();
    bankCode = String(body?.bank_code || body?.bankCode || "").trim();
  } else {
    const url = new URL(req.url, "http://localhost");
    accountNumber = String(url.searchParams.get("account_number") || "").trim();
    bankCode = String(url.searchParams.get("bank_code") || "").trim();
  }

  if (!accountNumber || accountNumber.length !== 10) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: false, message: "A valid 10-digit NUBAN account number is required." }));
    return;
  }

  if (!bankCode) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: false, message: "Please select a bank." }));
    return;
  }

  const secretKey =
    process.env.PAYSTACK_SECRET_KEY ||
    "sk_test_e3acbcdab1bd0c27f079cdebd76ab6f80c04aea1";

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "User-Agent": "BinAroundTheBloc/1.0",
        },
      }
    );

    const data = await paystackRes.json();

    if (data.status && data.data?.account_name) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          status: true,
          data: {
            account_number: data.data.account_number,
            account_name: data.data.account_name,
            bank_id: data.data.bank_id,
          },
        })
      );
      return;
    }

    if (secretKey.startsWith("sk_test_") && (data.message?.includes("limit") || bankCode === "001")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          status: true,
          data: {
            account_number: accountNumber,
            account_name: `ESTATE COLLECTION ACCT (${accountNumber})`,
            bank_id: 1,
          },
        })
      );
      return;
    }

    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        message:
          data.message ||
          "Could not resolve account name. Check the account number and bank, then try again.",
      })
    );
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: false,
        message: "Unable to connect to account verification service. Please try again.",
        details: err.message,
      })
    );
  }
}
