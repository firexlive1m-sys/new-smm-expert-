export default async function handler(req: any, res: any) {
  // CORS configuration for client-side API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle health check via GET
  if (req.method === 'GET' && !req.query?.action) {
    return res.status(200).json({
      status: 'ok',
      service: 'SMM Provider Proxy API (v2 protocol)',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const payload = req.method === 'POST' ? req.body || {} : req.query || {};
    const action = payload.action;

    const apiUrl =
      (payload.apiUrl && String(payload.apiUrl).trim()) ||
      process.env.PROVIDER_API_URL ||
      'https://smmxpert.in/api/v2';

    const apiKey =
      (payload.apiKey && String(payload.apiKey).trim()) ||
      process.env.PROVIDER_API_KEY ||
      '';

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action',
      });
    }

    if (!apiKey && action !== 'cron_sync') {
      return res.status(400).json({
        success: false,
        error: 'Provider API Key is not configured. Please add it in Admin Settings.',
      });
    }

    // Helper to call SMM panel API v2 using standard application/x-www-form-urlencoded
    const callProvider = async (params: Record<string, string | number>) => {
      const formBody = new URLSearchParams();
      formBody.append('key', apiKey);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formBody.append(k, String(v));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (compatible; swiftSMM/1.0)',
          },
          body: formBody.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const rawText = await response.text();
        try {
          return JSON.parse(rawText);
        } catch {
          return { error: `Invalid response from provider: ${rawText.slice(0, 100)}` };
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return { error: 'Connection to SMM provider timed out after 12 seconds' };
        }
        return { error: err?.message || 'Failed to connect to SMM provider' };
      }
    };

    // 1. Check Wallet Balance
    if (action === 'balance') {
      const data = await callProvider({ action: 'balance' });
      if (data?.error) {
        return res.status(200).json({ success: false, error: data.error });
      }
      return res.status(200).json({
        success: true,
        balance: data?.balance ?? '0.00',
        currency: data?.currency ?? 'USD',
      });
    }

    // 2. Fetch Provider Services List
    if (action === 'services') {
      const data = await callProvider({ action: 'services' });
      if (Array.isArray(data)) {
        return res.status(200).json({ success: true, services: data });
      }
      if (data?.error) {
        return res.status(200).json({ success: false, error: data.error });
      }
      return res.status(200).json({ success: true, services: [] });
    }

    // 3. Place New Order
    if (action === 'add') {
      const { service, link, quantity, runs, interval, comments } = payload;
      if (!service || !link || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required order fields: service, link, and quantity are required',
        });
      }

      const params: Record<string, any> = {
        action: 'add',
        service: String(service).trim(),
        link: String(link).trim(),
        quantity: Number(quantity),
      };

      if (runs) params.runs = runs;
      if (interval) params.interval = interval;
      if (comments) params.comments = comments;

      const data = await callProvider(params);

      if (data?.error) {
        return res.status(200).json({
          success: false,
          error: data.error,
        });
      }

      if (data?.order) {
        return res.status(200).json({
          success: true,
          order: String(data.order),
        });
      }

      return res.status(200).json({
        success: false,
        error: 'Unexpected provider response during order placement',
        raw: data,
      });
    }

    // 4. Check Single Order Status
    if (action === 'status') {
      const { order } = payload;
      if (!order) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: order (provider order ID)',
        });
      }

      const data = await callProvider({
        action: 'status',
        order: String(order).trim(),
      });

      if (data?.error) {
        return res.status(200).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        status: data?.status || 'Unknown',
        charge: data?.charge,
        start_count: data?.start_count,
        remains: data?.remains,
        currency: data?.currency,
      });
    }

    // 5. Check Multi Order Status
    if (action === 'multi_status') {
      const { orders } = payload;
      if (!orders) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: orders (comma separated provider order IDs)',
        });
      }

      const ordersList = Array.isArray(orders) ? orders.join(',') : String(orders).trim();
      const data = await callProvider({
        action: 'status',
        orders: ordersList,
      });

      if (data?.error) {
        return res.status(200).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        statuses: data || {},
      });
    }

    return res.status(400).json({
      success: false,
      error: `Unsupported action: ${action}`,
    });
  } catch (err: any) {
    console.error('[Provider API Route Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while communicating with provider',
    });
  }
}
