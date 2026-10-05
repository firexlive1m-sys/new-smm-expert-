export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  icon?: string;
  description?: string;
  active: boolean;
  sortOrder: number;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string; // e.g. "Followers", "Likes", "Views", "Comments", "Saves", "Shares"
  slug: string;
  description?: string;
  active: boolean;
  sortOrder: number;
  urlPlaceholder?: string;
  urlLabel?: string;
}

export interface Plan {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  quantityLabel: string; // e.g. "1K Followers" or "250 Likes"
  price: number; // e.g. 419
  comparePrice?: number; // e.g. 838
  discountPercent?: number; // e.g. 50
  showDiscount?: boolean; // toggle off cut price / competitor discount
  description?: string;
  deliveryTime?: string; // e.g. "Instant Delivery" or "Within 24 Hours"
  guaranteeText?: string; // e.g. "Real Non-Drop Guarantee"
  badge?: string; // e.g. "🔥 Most Popular"
  badgeColor?: string;
  active: boolean;
  featured?: boolean;
  sortOrder: number;
  providerServiceId?: string; // SMM Provider Service ID (e.g. from smmxpert.in)
}

export interface Offer {
  id: string;
  categoryId: string;
  categoryName?: string;
  serviceId?: string;
  planId?: string;
  title: string; // e.g. "Instagram Mega Growth Bundle"
  subtitle?: string; // e.g. "Real Indian Users"
  description?: string;
  isCustomCombo?: boolean;
  itemsIncluded?: string; // e.g. "1,000 Followers + 500 Likes + 2,000 Views"
  quantity?: number;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  badgeText?: string; // e.g. "🔥 SPECIAL COMBO OFFER"
  discountBadge?: string; // e.g. "50% OFF"
  buttonText?: string; // e.g. "Claim Deal"
  showButtonOnImage?: boolean;
  features?: string[];
  expiryDate?: string;
  active: boolean;
  priority: number;
}

export interface Banner {
  id: string;
  imageUrl?: string;
  badgeText?: string; // e.g. "LIMITED TIME OFFER"
  title: string; // e.g. "GROW YOUR SOCIAL MEDIA"
  subtitle: string; // e.g. "Real Users • Non-Drop • Instant Start"
  discountBadge?: string; // e.g. "UP TO 70% OFF"
  buttonText?: string; // e.g. "Get Started"
  buttonLink?: string; // e.g. "#services"
  redirectType?: 'category' | 'offer' | 'external' | 'none';
  targetCategoryId?: string;
  targetOfferId?: string;
  targetUrl?: string;
  active: boolean;
  sortOrder: number;
}

export type OrderStatus = 'Processing' | 'Pending' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

export interface Order {
  id: string;
  orderId: string; // e.g. "#SWF239485"
  customerName: string;
  mobileNumber: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  planId: string;
  quantity: number;
  targetUrl: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  isCustomOffer?: boolean;
  offerTitle?: string;
  itemsSummary?: string; // e.g. "1,000 Followers + 500 Likes + 2,000 Views"
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  adminNote?: string;
  completionNote?: string;
  paymentMethod?: string;
  paymentId?: string;
  utr?: string;
  // SMM Provider Integration fields
  providerOrderId?: string;
  providerStatus?: string;
  providerCharge?: string;
  providerStartCount?: string;
  providerRemains?: string;
  providerError?: string;
  providerLastSyncAt?: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface SupportTicket {
  id: string;
  ticketId: string; // e.g. "#TKT839245"
  customerName: string;
  mobileNumber: string;
  orderId?: string;
  problem: string;
  message: string;
  status: TicketStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSettings {
  id: string;
  websiteName: string;
  subtitle: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportWhatsAppNumber: string;
  supportWhatsAppLink: string;
  defaultCurrency: string;
  orderCompletionTimeText: string; // e.g. "within 24 hours"
  supportEmail?: string;
  supportText?: string;
  videoGuideUrl?: string;
  footerText?: string;
  maintenanceMode: boolean;
  bannerAutoSlideInterval: number; // in seconds
  // ZapUPI Gateway Settings
  zapUpiEnabled?: boolean;
  zapUpiKey?: string;
  zapUpiRemark?: string;
  paymentMode?: 'zapupi' | 'manual_qr' | 'both';
  // SMM Provider API Settings
  providerApiUrl?: string; // e.g. "https://smmxpert.in/api/v2"
  providerApiKey?: string;
  providerAutoOrder?: boolean;
  providerBalance?: string;
  providerCurrency?: string;
}
