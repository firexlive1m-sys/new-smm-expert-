export default async function handler(req: any, res: any) {
  // Always accept GET to verify endpoint is live
  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 'ok',
      service: 'ZapUPI Webhook Endpoint for swiftSMM',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const body = req.body || {};
    const { order_id, txn_id, status, amount, utr, environment } = body;

    console.log('[ZapUPI Webhook Received]', {
      order_id,
      txn_id,
      status,
      amount,
      utr,
      environment,
    });

    // ZapUPI documentation requires:
    // Always return HTTP 200 + {"status":"ok"}
    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('[ZapUPI Webhook Error]', err);
    // Return 200 so ZapUPI doesn't keep hammering retries unnecessarily
    return res.status(200).json({ status: 'ok', error: err?.message || 'Handled' });
  }
}
