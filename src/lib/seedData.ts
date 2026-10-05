import { Category, Service, Plan, Offer, Banner, Order, SupportTicket, WebsiteSettings } from '../types';

export const INITIAL_SETTINGS: WebsiteSettings = {
  id: 'global-settings',
  websiteName: 'SkyRocket',
  subtitle: 'SOCIAL GROWTH PANEL',
  logoUrl: 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png',
  faviconUrl: 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png',
  supportWhatsAppNumber: '+919876543210',
  supportWhatsAppLink: 'https://wa.me/919876543210?text=Hi%20Support%2C%20I%20need%20help%20with%20my%20order',
  defaultCurrency: '₹',
  orderCompletionTimeText: 'within 24 hours',
  supportEmail: 'support@skyrocket.com',
  supportText: 'Get instant 24x7 help from our friendly social media growth specialists.',
  videoGuideUrl: 'https://youtube.com/shorts/ooX_6PNNEh0?si=PaJ1mv6RTF9FZYSz',
  footerText: '© 2026 SkyRocket. All rights reserved. The premier social media growth panel.',
  maintenanceMode: false,
  bannerAutoSlideInterval: 4,
  zapUpiEnabled: true,
  zapUpiKey: '',
  zapUpiRemark: 'Social Service',
  paymentMode: 'zapupi',
};

// All demo catalog arrays initialized empty so admin has 100% control
export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_SERVICES: Service[] = [];

export const INITIAL_PLANS: Plan[] = [];

export const INITIAL_OFFERS: Offer[] = [];

export const INITIAL_BANNERS: Banner[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TICKETS: SupportTicket[] = [];
