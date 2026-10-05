/**
 * Meta Pixel Tracking Utility for SkyRocket SMM Panel
 * Pixel ID: 1599417212228759
 * Standard Events: PageView, ViewContent, InitiateCheckout, AddPaymentInfo, Purchase, Contact
 * Includes Advanced Matching (phone, name) and deduplication eventID
 */

export const META_PIXEL_ID = '1599417212228759';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

// Safe wrapper around window.fbq
export const fbq = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq(...args);
    } catch (err) {
      console.warn('Meta Pixel call warning:', err);
    }
  }
};

/**
 * Generate a unique Event ID for every event to prevent duplicate collisions
 * and provide clean identification in Meta Events Manager.
 */
export const generateEventId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

/**
 * 1. Track PageView (Fires on route/view changes with unique eventID)
 */
export const trackMetaPageView = () => {
  const eventId = generateEventId('pv');
  fbq('track', 'PageView', {}, { eventID: eventId });
  return eventId;
};

/**
 * 2. Track ViewContent (When viewing a social platform or service catalog)
 */
export const trackMetaViewContent = (params: {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) => {
  const eventId = generateEventId('vc');
  fbq(
    'track',
    'ViewContent',
    {
      content_name: params.content_name,
      content_category: params.content_category || 'Social Media Growth',
      content_ids: params.content_ids || [],
      content_type: 'product',
      value: params.value || 0,
      currency: params.currency || 'INR',
    },
    { eventID: eventId }
  );
  return eventId;
};

/**
 * 3. Track InitiateCheckout (When customer enters the Order Form page)
 */
export const trackMetaInitiateCheckout = (params: {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  value: number;
  currency?: string;
  num_items?: number;
}) => {
  const eventId = generateEventId('ic');
  fbq(
    'track',
    'InitiateCheckout',
    {
      content_name: params.content_name,
      content_category: params.content_category || 'Social Media Growth',
      content_ids: params.content_ids || [],
      content_type: 'product',
      value: params.value,
      currency: params.currency || 'INR',
      num_items: params.num_items || 1,
    },
    { eventID: eventId }
  );
  return eventId;
};

/**
 * 4. Track AddPaymentInfo (When customer submits name/mobile and initiates UPI payment)
 */
export const trackMetaAddPaymentInfo = (params: {
  content_name: string;
  value: number;
  currency?: string;
  customer?: {
    name?: string;
    phone?: string;
  };
}) => {
  // Pass customer details for Meta Advanced Matching (improves Event Match Quality)
  if (params.customer?.phone || params.customer?.name) {
    const cleanPhone = params.customer.phone ? params.customer.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
    fbq('setUserProperties', {
      ph: formattedPhone,
      fn: params.customer.name?.trim().split(' ')[0],
    });
  }

  const eventId = generateEventId('api');
  fbq(
    'track',
    'AddPaymentInfo',
    {
      content_name: params.content_name,
      content_type: 'product',
      value: params.value,
      currency: params.currency || 'INR',
    },
    { eventID: eventId }
  );
  return eventId;
};

/**
 * 5. Track Purchase (MOST CRITICAL EVENT - Fires when ZapUPI payment is verified)
 */
export const trackMetaPurchase = (params: {
  order_id: string;
  content_name: string;
  value: number;
  currency?: string;
  customer?: {
    name?: string;
    phone?: string;
  };
}) => {
  // Update Advanced Matching properties
  if (params.customer?.phone || params.customer?.name) {
    const cleanPhone = params.customer.phone ? params.customer.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
    fbq('setUserProperties', {
      ph: formattedPhone,
      fn: params.customer.name?.trim().split(' ')[0],
    });
  }

  // Unique Order-specific Event ID for deduplication
  const eventId = `pur_${params.order_id}`;
  fbq(
    'track',
    'Purchase',
    {
      content_name: params.content_name,
      content_type: 'product',
      content_ids: [params.order_id],
      value: params.value,
      currency: params.currency || 'INR',
      order_id: params.order_id,
    },
    {
      eventID: eventId,
    }
  );
  return eventId;
};

/**
 * 6. Track Contact (When customer clicks WhatsApp Support)
 */
export const trackMetaContact = (method: 'whatsapp' | 'support_ticket' = 'whatsapp') => {
  const eventId = generateEventId('cnt');
  fbq(
    'track',
    'Contact',
    {
      content_name: method === 'whatsapp' ? 'WhatsApp Support' : 'Support Ticket',
    },
    { eventID: eventId }
  );
  return eventId;
};
