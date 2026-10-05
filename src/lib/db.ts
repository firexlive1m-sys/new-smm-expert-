import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';
import {
  Category,
  Service,
  Plan,
  Offer,
  Banner,
  Order,
  SupportTicket,
  WebsiteSettings,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_PLANS,
  INITIAL_OFFERS,
  INITIAL_BANNERS,
  INITIAL_ORDERS,
  INITIAL_TICKETS,
  INITIAL_SETTINGS,
} from './seedData';

// Storage keys for local fallback
const STORAGE_KEYS = {
  CATEGORIES: 'swiftsmm_categories',
  SERVICES: 'swiftsmm_services',
  PLANS: 'swiftsmm_plans',
  OFFERS: 'swiftsmm_offers',
  BANNERS: 'swiftsmm_banners',
  ORDERS: 'swiftsmm_orders',
  TICKETS: 'swiftsmm_tickets',
  SETTINGS: 'swiftsmm_settings',
};

// Automatic one-time cleanup so previous demo data in browser localStorage is wiped clean
const DEMO_CLEARED_KEY = 'swiftsmm_demo_cleared_clean_v2';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(DEMO_CLEARED_KEY) !== 'true') {
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.PLANS);
      localStorage.removeItem(STORAGE_KEYS.OFFERS);
      localStorage.removeItem(STORAGE_KEYS.BANNERS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
      localStorage.setItem(DEMO_CLEARED_KEY, 'true');
    }
  } catch (e) {
    // Ignore storage errors
  }
}

// Event listener system for reactive local changes
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying listener:', e);
    }
  });
}

// Generate unique order ID: #SWF + 6 random digits
export function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `#SWF${num}`;
}

// Generate unique ticket ID: #TKT + 6 random digits
export function generateTicketId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `#TKT${num}`;
}

// Local storage helper
function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T, shouldNotify = true): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    if (shouldNotify) {
      notifyListeners();
    }
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// Normalize phone number for matching
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

// Normalize name for matching
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

// Strip undefined values so Firestore never throws invalid-argument errors
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
}

class DatabaseService {
  // Listen for local/global changes
  subscribe(callback: Listener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  // --- SETTINGS ---
  async getSettings(): Promise<WebsiteSettings> {
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDoc(doc(firestore, 'settings', 'global'));
        if (snap.exists() && snap.data()) {
          let data = { ...snap.data(), id: snap.id } as WebsiteSettings;
          if (data.websiteName === 'swiftSMM' || !data.logoUrl || data.logoUrl.includes('QF8CyjmY')) {
            data = {
              ...data,
              websiteName: 'SkyRocket',
              logoUrl: 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png',
              faviconUrl: 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png',
            };
            setDoc(doc(firestore, 'settings', 'global'), data, { merge: true }).catch(() => {});
          }
          setLocalItem(STORAGE_KEYS.SETTINGS, data, false);
          return data;
        } else {
          // Seed settings to Firestore
          const local = getLocalItem<WebsiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
          setDoc(doc(firestore, 'settings', 'global'), local).catch(() => {});
          return local;
        }
      } catch (err) {
        console.warn('Firestore getSettings error, using fallback:', err);
      }
    }
    const local = getLocalItem<WebsiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (local.websiteName === 'swiftSMM' || !local.logoUrl || local.logoUrl.includes('QF8CyjmY')) {
      local.websiteName = 'SkyRocket';
      local.logoUrl = 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png';
      local.faviconUrl = 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png';
      setLocalItem(STORAGE_KEYS.SETTINGS, local, false);
    }
    return local;
  }

  async updateSettings(settings: Partial<WebsiteSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setLocalItem(STORAGE_KEYS.SETTINGS, updated, true);

    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'settings', 'global'), updated, { merge: true });
      } catch (err) {
        console.error('Firestore updateSettings error:', err);
      }
    }
  }

  // --- CATEGORIES ---
  async getCategories(onlyActive = true): Promise<Category[]> {
    let list: Category[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'categories'));
        if (snap.docs.length > 0) {
          list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Category));
          setLocalItem(STORAGE_KEYS.CATEGORIES, list, false);
        } else {
          list = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
        }
      } catch (err) {
        console.warn('Firestore getCategories error:', err);
        list = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      }
    } else {
      list = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    }

    if (onlyActive) {
      list = list.filter((c) => c.active);
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveCategory(cat: Category): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'categories', cat.id), sanitizeForFirestore(cat), { merge: true });
      } catch (e) {
        console.error('Firestore saveCategory error:', e);
      }
    }

    const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const index = categories.findIndex((c) => c.id === cat.id);
    if (index >= 0) {
      categories[index] = cat;
    } else {
      categories.push(cat);
    }
    setLocalItem(STORAGE_KEYS.CATEGORIES, categories, true);
  }

  async deleteCategory(id: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'categories', id));
      } catch (e) {
        console.error('Firestore deleteCategory error:', e);
      }
    }

    const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, []).filter(
      (c) => c.id !== id
    );
    setLocalItem(STORAGE_KEYS.CATEGORIES, categories, true);
  }

  // --- SERVICES ---
  async getServices(categoryId?: string, onlyActive = true): Promise<Service[]> {
    let list: Service[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'services'));
        if (snap.docs.length > 0) {
          list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Service));
          setLocalItem(STORAGE_KEYS.SERVICES, list, false);
        } else {
          list = getLocalItem<Service[]>(STORAGE_KEYS.SERVICES, []);
        }
      } catch (err) {
        console.warn('Firestore getServices error:', err);
        list = getLocalItem<Service[]>(STORAGE_KEYS.SERVICES, []);
      }
    } else {
      list = getLocalItem<Service[]>(STORAGE_KEYS.SERVICES, []);
    }

    if (categoryId) {
      list = list.filter((s) => s.categoryId === categoryId);
    }
    if (onlyActive) {
      list = list.filter((s) => s.active);
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveService(service: Service): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'services', service.id), sanitizeForFirestore(service), { merge: true });
      } catch (e) {
        console.error('Firestore saveService error:', e);
      }
    }

    const list = getLocalItem<Service[]>(STORAGE_KEYS.SERVICES, []);
    const index = list.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      list[index] = service;
    } else {
      list.push(service);
    }
    setLocalItem(STORAGE_KEYS.SERVICES, list, true);
  }

  async deleteService(id: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'services', id));
      } catch (e) {
        console.error('Firestore deleteService error:', e);
      }
    }

    const list = getLocalItem<Service[]>(STORAGE_KEYS.SERVICES, []).filter((s) => s.id !== id);
    setLocalItem(STORAGE_KEYS.SERVICES, list, true);
  }

  // --- PLANS ---
  async getPlans(serviceId?: string, onlyActive = true): Promise<Plan[]> {
    let list: Plan[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'plans'));
        if (snap.docs.length > 0) {
          list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plan));
          setLocalItem(STORAGE_KEYS.PLANS, list, false);
        } else {
          list = getLocalItem<Plan[]>(STORAGE_KEYS.PLANS, []);
        }
      } catch (err) {
        console.warn('Firestore getPlans error:', err);
        list = getLocalItem<Plan[]>(STORAGE_KEYS.PLANS, []);
      }
    } else {
      list = getLocalItem<Plan[]>(STORAGE_KEYS.PLANS, []);
    }

    if (serviceId) {
      list = list.filter((p) => p.serviceId === serviceId);
    }
    if (onlyActive) {
      list = list.filter((p) => p.active);
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async savePlan(plan: Plan): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'plans', plan.id), sanitizeForFirestore(plan), { merge: true });
      } catch (e) {
        console.error('Firestore savePlan error:', e);
      }
    }

    const list = getLocalItem<Plan[]>(STORAGE_KEYS.PLANS, []);
    const index = list.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      list[index] = plan;
    } else {
      list.push(plan);
    }
    setLocalItem(STORAGE_KEYS.PLANS, list, true);
  }

  async deletePlan(id: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'plans', id));
      } catch (e) {
        console.error('Firestore deletePlan error:', e);
      }
    }

    const list = getLocalItem<Plan[]>(STORAGE_KEYS.PLANS, []).filter((p) => p.id !== id);
    setLocalItem(STORAGE_KEYS.PLANS, list, true);
  }

  // --- OFFERS ---
  async getOffers(categoryId?: string, onlyActive = true): Promise<Offer[]> {
    let list: Offer[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'offers'));
        if (snap.docs.length > 0) {
          list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Offer));
          setLocalItem(STORAGE_KEYS.OFFERS, list, false);
        } else {
          list = getLocalItem<Offer[]>(STORAGE_KEYS.OFFERS, []);
        }
      } catch (err) {
        console.warn('Firestore getOffers error:', err);
        list = getLocalItem<Offer[]>(STORAGE_KEYS.OFFERS, []);
      }
    } else {
      list = getLocalItem<Offer[]>(STORAGE_KEYS.OFFERS, []);
    }

    if (categoryId) {
      list = list.filter((o) => o.categoryId === categoryId);
    }
    if (onlyActive) {
      list = list.filter((o) => o.active);
    }
    return list.sort((a, b) => a.priority - b.priority);
  }

  async saveOffer(offer: Offer): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'offers', offer.id), sanitizeForFirestore(offer), { merge: true });
      } catch (e) {
        console.error('Firestore saveOffer error:', e);
      }
    }

    const list = getLocalItem<Offer[]>(STORAGE_KEYS.OFFERS, []);
    const index = list.findIndex((o) => o.id === offer.id);
    if (index >= 0) {
      list[index] = offer;
    } else {
      list.push(offer);
    }
    setLocalItem(STORAGE_KEYS.OFFERS, list, true);
  }

  async deleteOffer(id: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'offers', id));
      } catch (e) {
        console.error('Firestore deleteOffer error:', e);
      }
    }

    const list = getLocalItem<Offer[]>(STORAGE_KEYS.OFFERS, []).filter((o) => o.id !== id);
    setLocalItem(STORAGE_KEYS.OFFERS, list, true);
  }

  // --- BANNERS ---
  async getBanners(onlyActive = true): Promise<Banner[]> {
    let list: Banner[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'banners'));
        if (snap.docs.length > 0) {
          list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
          setLocalItem(STORAGE_KEYS.BANNERS, list, false);
        } else {
          list = getLocalItem<Banner[]>(STORAGE_KEYS.BANNERS, []);
        }
      } catch (err) {
        console.warn('Firestore getBanners error:', err);
        list = getLocalItem<Banner[]>(STORAGE_KEYS.BANNERS, []);
      }
    } else {
      list = getLocalItem<Banner[]>(STORAGE_KEYS.BANNERS, []);
    }

    if (onlyActive) {
      list = list.filter((b) => b.active);
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveBanner(banner: Banner): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'banners', banner.id), sanitizeForFirestore(banner), { merge: true });
      } catch (e) {
        console.error('Firestore saveBanner error:', e);
      }
    }

    const list = getLocalItem<Banner[]>(STORAGE_KEYS.BANNERS, []);
    const index = list.findIndex((b) => b.id === banner.id);
    if (index >= 0) {
      list[index] = banner;
    } else {
      list.push(banner);
    }
    setLocalItem(STORAGE_KEYS.BANNERS, list, true);
  }

  async deleteBanner(id: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'banners', id));
      } catch (e) {
        console.error('Firestore deleteBanner error:', e);
      }
    }

    const list = getLocalItem<Banner[]>(STORAGE_KEYS.BANNERS, []).filter((b) => b.id !== id);
    setLocalItem(STORAGE_KEYS.BANNERS, list, true);
  }

  // --- ORDERS ---
  async createOrder(data: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrderId = generateOrderId();
    const now = new Date().toISOString();
    const id = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cleanMobile = normalizePhone(data.mobileNumber);

    const newOrder: Order = {
      ...data,
      mobileNumber: cleanMobile || data.mobileNumber,
      id,
      orderId: newOrderId,
      createdAt: now,
      updatedAt: now,
      orderStatus: data.orderStatus || 'Processing',
      paymentStatus: data.paymentStatus || 'Paid',
      currency: data.currency || '₹',
      offerTitle: data.offerTitle || '',
      itemsSummary: data.itemsSummary || '',
      adminNote: data.adminNote || '',
      completionNote: data.completionNote || '',
    };

    const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    orders.unshift(newOrder);
    setLocalItem(STORAGE_KEYS.ORDERS, orders);

    if (isFirebaseConfigured && firestore) {
      try {
        const cleanDoc = sanitizeForFirestore(newOrder);
        await setDoc(doc(firestore, 'orders', id), cleanDoc);
        console.log('[Firestore] Order created and saved successfully:', id, newOrderId);
      } catch (e) {
        console.error('Firestore createOrder error:', e);
      }
    }

    return newOrder;
  }

  // Customer order tracking: strictly matches BOTH Name AND Mobile Number
  async getOrdersByCustomer(name: string, mobile: string): Promise<Order[]> {
    const cleanName = normalizeName(name);
    const cleanPhone = normalizePhone(mobile);

    if (!cleanName || cleanPhone.length < 5) {
      return [];
    }

    let allOrders: Order[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'orders'));
        if (!snap.empty) {
          allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          setLocalItem(STORAGE_KEYS.ORDERS, allOrders, false);
        } else {
          allOrders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        }
      } catch (err) {
        console.warn('Firestore customer order query error, using local fallback:', err);
        allOrders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      }
    } else {
      allOrders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }

    return allOrders.filter((o) => {
      const orderPhone = normalizePhone(o.mobileNumber || '');
      const orderName = normalizeName(o.customerName || '');

      // Both Phone and Name must match
      const phoneMatches = orderPhone.slice(-10) === cleanPhone.slice(-10);
      const nameMatches =
        orderName === cleanName ||
        orderName.includes(cleanName) ||
        cleanName.includes(orderName) ||
        orderName.split(' ')[0] === cleanName.split(' ')[0];

      return phoneMatches && nameMatches;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  // Admin get all orders
  async getAllOrders(): Promise<Order[]> {
    let orders: Order[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'orders'));
        if (snap.docs.length > 0) {
          orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          setLocalItem(STORAGE_KEYS.ORDERS, orders, false);
        } else {
          orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        }
      } catch (err) {
        console.warn('Firestore getAllOrders error:', err);
        orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      }
    } else {
      orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateOrderStatus(
    orderIdOrId: string,
    orderStatus: Order['orderStatus'],
    adminNote?: string,
    completionNote?: string
  ): Promise<void> {
    const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const index = orders.findIndex((o) => o.id === orderIdOrId || o.orderId === orderIdOrId);
    if (index >= 0) {
      orders[index].orderStatus = orderStatus;
      orders[index].updatedAt = new Date().toISOString();
      if (adminNote !== undefined) orders[index].adminNote = adminNote;
      if (completionNote !== undefined) orders[index].completionNote = completionNote;
      setLocalItem(STORAGE_KEYS.ORDERS, orders);

      if (isFirebaseConfigured && firestore) {
        try {
          await updateDoc(doc(firestore, 'orders', orders[index].id), {
            orderStatus,
            updatedAt: orders[index].updatedAt,
            ...(adminNote !== undefined && { adminNote }),
            ...(completionNote !== undefined && { completionNote }),
          });
        } catch (e) {
          console.error('Firestore updateOrderStatus error:', e);
        }
      }
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const index = orders.findIndex((o) => o.id === id);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
      setLocalItem(STORAGE_KEYS.ORDERS, orders);

      if (isFirebaseConfigured && firestore) {
        try {
          await updateDoc(doc(firestore, 'orders', id), {
            ...updates,
            updatedAt: orders[index].updatedAt,
          });
        } catch (e) {
          console.error('Firestore updateOrder error:', e);
        }
      }
    }
  }

  // --- SUPPORT TICKETS ---
  async createSupportTicket(
    data: Omit<SupportTicket, 'id' | 'ticketId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket> {
    const ticketId = generateTicketId();
    const now = new Date().toISOString();
    const id = `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newTicket: SupportTicket = {
      id,
      ticketId,
      status: 'Open',
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    tickets.unshift(newTicket);
    setLocalItem(STORAGE_KEYS.TICKETS, tickets);

    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, 'supportTickets', id), newTicket);
      } catch (e) {
        console.error('Firestore createSupportTicket error:', e);
      }
    }

    return newTicket;
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    let tickets: SupportTicket[] = [];
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'supportTickets'));
        if (snap.docs.length > 0) {
          tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
          setLocalItem(STORAGE_KEYS.TICKETS, tickets, false);
        } else {
          tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
        }
      } catch (err) {
        console.warn('Firestore getAllTickets error:', err);
        tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
      }
    } else {
      tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    }
    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<void> {
    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const index = tickets.findIndex((t) => t.id === id);
    if (index >= 0) {
      tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date().toISOString() };
      setLocalItem(STORAGE_KEYS.TICKETS, tickets);

      if (isFirebaseConfigured && firestore) {
        try {
          await updateDoc(doc(firestore, 'supportTickets', id), {
            ...updates,
            updatedAt: tickets[index].updatedAt,
          });
        } catch (e) {
          console.error('Firestore updateTicket error:', e);
        }
      }
    }
  }

  async deleteTicket(id: string): Promise<void> {
    const list = getLocalItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS).filter((t) => t.id !== id);
    setLocalItem(STORAGE_KEYS.TICKETS, list);

    if (isFirebaseConfigured && firestore) {
      try {
        await deleteDoc(doc(firestore, 'supportTickets', id));
      } catch (e) {
        console.error('Firestore deleteTicket error:', e);
      }
    }
  }

  // Clear all demo data across collections for 100% manual control
  async clearAllDemoData(): Promise<void> {
    setLocalItem(STORAGE_KEYS.CATEGORIES, []);
    setLocalItem(STORAGE_KEYS.SERVICES, []);
    setLocalItem(STORAGE_KEYS.PLANS, []);
    setLocalItem(STORAGE_KEYS.OFFERS, []);
    setLocalItem(STORAGE_KEYS.BANNERS, []);
    setLocalItem(STORAGE_KEYS.ORDERS, []);
    setLocalItem(STORAGE_KEYS.TICKETS, []);

    if (isFirebaseConfigured && firestore) {
      try {
        const collections = ['categories', 'services', 'plans', 'offers', 'banners', 'orders', 'supportTickets'];
        for (const colName of collections) {
          const snap = await getDocs(collection(firestore, colName));
          for (const d of snap.docs) {
            await deleteDoc(doc(firestore, colName, d.id)).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Error clearing Firestore demo data:', e);
      }
    }
    notifyListeners();
  }

  resetToSeed(): void {
    this.clearAllDemoData();
  }
}

export const dbService = new DatabaseService();
