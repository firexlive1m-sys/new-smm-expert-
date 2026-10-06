import { Order, Plan, Service, WebsiteSettings } from '../types';
import { dbService } from './db';

const DEFAULT_API_URL = 'https://smmxpert.in/api/v2';

export interface ProviderBalanceResult {
  success: boolean;
  balance?: string;
  currency?: string;
  error?: string;
}

export interface ProviderOrderResult {
  success: boolean;
  providerOrderId?: string;
  error?: string;
}

export interface ProviderStatusResult {
  success: boolean;
  status?: string;
  charge?: string;
  start_count?: string;
  remains?: string;
  currency?: string;
  error?: string;
}

/**
 * Fetch live wallet balance from SMM Provider
 */
export async function fetchProviderBalance(
  apiUrl?: string,
  apiKey?: string
): Promise<ProviderBalanceResult> {
  try {
    const res = await fetch('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'balance',
        apiUrl: apiUrl || DEFAULT_API_URL,
        apiKey: apiKey || '',
      }),
    });

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        balance: data.balance || '0.00',
        currency: data.currency || 'USD',
      };
    }
    return { success: false, error: data.error || 'Failed to fetch balance' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching balance' };
  }
}

/**
 * Fetch services list from SMM Provider to assist admin in mapping
 */
export async function fetchProviderServices(
  apiUrl?: string,
  apiKey?: string
): Promise<{ success: boolean; services?: any[]; error?: string }> {
  try {
    const res = await fetch('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'services',
        apiUrl: apiUrl || DEFAULT_API_URL,
        apiKey: apiKey || '',
      }),
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.services)) {
      return { success: true, services: data.services };
    }
    return { success: false, error: data.error || 'Failed to fetch services' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching services' };
  }
}

/**
 * Automatically places an order on SMM Provider and updates Firestore
 */
export async function dispatchOrderToProvider(
  order: Order,
  plan?: Plan | null,
  settings?: WebsiteSettings,
  service?: Service | null
): Promise<ProviderOrderResult> {
  const targetSettings = settings || (await dbService.getSettings());
  const apiUrl = targetSettings.providerApiUrl || DEFAULT_API_URL;
  const apiKey = targetSettings.providerApiKey?.trim();

  if (!apiKey) {
    const errorMsg = 'Provider API Key is not configured in Admin Settings';
    await dbService.updateOrder(order.id, {
      providerError: errorMsg,
      adminNote: order.adminNote
        ? `${order.adminNote} | [Auto-Fulfill Skipped]: ${errorMsg}`
        : `[Auto-Fulfill Skipped]: ${errorMsg}`,
    });
    return { success: false, error: errorMsg };
  }

  // Determine provider service ID:
  // 1. Plan override (if specifically set on plan)
  // 2. Passed service object
  // 3. Or query Service from dbService using order.serviceId
  // 4. Or query Plan from dbService using order.planId
  let serviceId = plan?.providerServiceId?.trim();

  if (!serviceId && service?.providerServiceId?.trim()) {
    serviceId = service.providerServiceId.trim();
  }

  // If not found yet, check Service in DB first
  if (!serviceId && order.serviceId) {
    try {
      const allServices = await dbService.getServices(undefined, false);
      const matchedService = allServices.find(
        (s) => s.id === order.serviceId || s.name.toLowerCase() === order.serviceName?.toLowerCase()
      );
      if (matchedService?.providerServiceId?.trim()) {
        serviceId = matchedService.providerServiceId.trim();
      }
    } catch {}
  }

  // Fallback: check Plan in DB
  if (!serviceId && order.planId) {
    try {
      const allPlans = await dbService.getPlans(undefined, false);
      const matched = allPlans.find((p) => p.id === order.planId);
      if (matched?.providerServiceId?.trim()) {
        serviceId = matched.providerServiceId.trim();
      }
    } catch {}
  }

  if (!serviceId) {
    const errorMsg = 'No Provider Service ID is linked to this Service or Plan in Admin > Services / Plans';
    await dbService.updateOrder(order.id, {
      providerError: errorMsg,
      adminNote: order.adminNote
        ? `${order.adminNote} | [Manual Review]: ${errorMsg}`
        : `[Manual Review]: ${errorMsg}`,
    });
    return { success: false, error: errorMsg };
  }

  try {
    const res = await fetch('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        apiUrl,
        apiKey,
        service: serviceId,
        link: order.targetUrl,
        quantity: order.quantity || 100,
      }),
    });

    const data = await res.json();

    if (data.success && data.order) {
      const providerOrderId = String(data.order);
      const updates: Partial<Order> = {
        providerOrderId,
        providerStatus: 'In progress',
        providerError: '',
        orderStatus: 'Processing',
        providerLastSyncAt: new Date().toISOString(),
        adminNote: order.adminNote
          ? `${order.adminNote} | Auto-sent to smmxpert (ID #${providerOrderId})`
          : `Auto-sent to smmxpert (ID #${providerOrderId})`,
      };

      await dbService.updateOrder(order.id, updates);
      return { success: true, providerOrderId };
    } else {
      const errorMsg = data.error || 'Provider rejected order creation';
      await dbService.updateOrder(order.id, {
        providerError: errorMsg,
        adminNote: order.adminNote
          ? `${order.adminNote} | Provider Error: ${errorMsg}`
          : `Provider Error: ${errorMsg}`,
      });
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Network exception sending to provider';
    await dbService.updateOrder(order.id, {
      providerError: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Map raw provider status string to app OrderStatus
 */
export function mapProviderStatusToApp(rawStatus?: string): {
  appStatus: Order['orderStatus'];
  statusLabel: string;
} {
  const norm = (rawStatus || '').toLowerCase().trim();

  if (norm === 'completed') {
    return { appStatus: 'Completed', statusLabel: 'Completed' };
  }
  if (norm === 'in progress' || norm === 'inprogress' || norm === 'processing') {
    return { appStatus: 'Processing', statusLabel: 'In progress' };
  }
  if (norm === 'pending') {
    return { appStatus: 'Processing', statusLabel: 'Pending' };
  }
  if (norm === 'partial') {
    return { appStatus: 'Processing', statusLabel: 'Partial' };
  }
  if (norm === 'canceled' || norm === 'cancelled') {
    return { appStatus: 'Cancelled', statusLabel: 'Canceled' };
  }

  return { appStatus: 'Processing', statusLabel: rawStatus || 'Processing' };
}

/**
 * Check live status of an order from provider and update Firestore
 */
export async function syncSingleOrderStatus(
  order: Order,
  settings?: WebsiteSettings
): Promise<ProviderStatusResult> {
  if (!order.providerOrderId) {
    return { success: false, error: 'Order does not have a provider Order ID' };
  }

  const targetSettings = settings || (await dbService.getSettings());
  const apiUrl = targetSettings.providerApiUrl || DEFAULT_API_URL;
  const apiKey = targetSettings.providerApiKey?.trim();

  if (!apiKey) {
    return { success: false, error: 'Provider API key is missing in Admin Settings' };
  }

  try {
    const res = await fetch('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        apiUrl,
        apiKey,
        order: order.providerOrderId,
      }),
    });

    const data = await res.json();
    if (data.success) {
      const { appStatus } = mapProviderStatusToApp(data.status);
      const updates: Partial<Order> = {
        providerStatus: data.status,
        providerCharge: data.charge ? String(data.charge) : undefined,
        providerStartCount: data.start_count ? String(data.start_count) : undefined,
        providerRemains: data.remains ? String(data.remains) : undefined,
        orderStatus: appStatus,
        providerLastSyncAt: new Date().toISOString(),
      };

      if (appStatus === 'Completed' && !order.completionNote) {
        updates.completionNote = 'Successfully delivered by SMM provider';
      }

      await dbService.updateOrder(order.id, updates);

      return {
        success: true,
        status: data.status,
        charge: data.charge,
        start_count: data.start_count,
        remains: data.remains,
        currency: data.currency,
      };
    }

    return { success: false, error: data.error || 'Failed to get order status' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error checking order status' };
  }
}

/**
 * Sync statuses for multiple active orders simultaneously
 */
export async function syncMultipleOrdersStatus(
  orders: Order[],
  settings?: WebsiteSettings
): Promise<{ updatedCount: number; errors: string[] }> {
  const eligible = orders.filter((o) => Boolean(o.providerOrderId));
  if (eligible.length === 0) {
    return { updatedCount: 0, errors: [] };
  }

  const targetSettings = settings || (await dbService.getSettings());
  const apiUrl = targetSettings.providerApiUrl || DEFAULT_API_URL;
  const apiKey = targetSettings.providerApiKey?.trim();

  if (!apiKey) {
    return { updatedCount: 0, errors: ['Provider API key is missing'] };
  }

  const orderIds = eligible.map((o) => o.providerOrderId!).filter(Boolean);

  try {
    const res = await fetch('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'multi_status',
        apiUrl,
        apiKey,
        orders: orderIds,
      }),
    });

    const data = await res.json();
    let updatedCount = 0;
    const errors: string[] = [];

    if (data.success && data.statuses) {
      const statusesMap = data.statuses;

      for (const order of eligible) {
        const pId = order.providerOrderId!;
        const stat = statusesMap[pId];

        if (stat && typeof stat === 'object') {
          if (stat.error) {
            errors.push(`Order #${pId}: ${stat.error}`);
            continue;
          }

          const { appStatus } = mapProviderStatusToApp(stat.status);
          const updates: Partial<Order> = {
            providerStatus: stat.status,
            providerCharge: stat.charge ? String(stat.charge) : order.providerCharge,
            providerStartCount: stat.start_count ? String(stat.start_count) : order.providerStartCount,
            providerRemains: stat.remains ? String(stat.remains) : order.providerRemains,
            orderStatus: appStatus,
            providerLastSyncAt: new Date().toISOString(),
          };

          if (appStatus === 'Completed' && !order.completionNote) {
            updates.completionNote = 'Successfully delivered by SMM provider';
          }

          await dbService.updateOrder(order.id, updates);
          updatedCount++;
        }
      }

      return { updatedCount, errors };
    }

    return { updatedCount: 0, errors: [data.error || 'Failed to fetch batch statuses'] };
  } catch (err: any) {
    return { updatedCount: 0, errors: [err?.message || 'Batch sync network error'] };
  }
}
