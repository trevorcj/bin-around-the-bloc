import process from "node:process";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const reference = body?.reference;
  if (!reference) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Transaction reference is required' }));
    return;
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_e3acbcdab1bd0c27f079cdebd76ab6f80c04aea1';

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'User-Agent': 'BinAroundTheBloc/1.0',
      },
    });

    const data = await paystackRes.text();
    res.statusCode = paystackRes.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(data);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Paystack verification failed', details: err.message }));
  }
}
