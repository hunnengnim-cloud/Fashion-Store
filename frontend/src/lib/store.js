/* ============================================================
   FASHION STORE — React Shared State, API & Sync Utilities
   ============================================================ */

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin && window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/v1`
    : 'http://127.0.0.1:8000/api/v1');

export const KEYS = {
  TOKEN: 'cs_token',
  USER: 'cs_user',
  THEME: 'cs_theme',
  LANG: 'fs_lang',
  PRODUCTS: 'cs_admin_products',
  CATALOG_VERSION: 'cs_catalog_version',
  LAYOUT: 'cs_storefront_layout',
  CART: 'cs_cart',
  WISHLIST: 'cs_wishlist',
  ORDERS: 'cs_orders',
  INVENTORY_MOVEMENTS: 'cs_inventory_movements',
};

export function getLang() {
  try {
    return localStorage.getItem('fs_lang') || 'km';
  } catch {
    return 'km';
  }
}

export function saveLang(newLang) {
  try {
    const validLang = newLang === 'en' ? 'en' : 'km';
    localStorage.setItem('fs_lang', validLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLang;
      if (validLang === 'km') {
        document.body.classList.add('lang-km');
      } else {
        document.body.classList.remove('lang-km');
      }
    }
    window.dispatchEvent(new CustomEvent('fashionstore:lang', { detail: validLang }));
  } catch {
    // ignore
  }
}

const ADMIN_ROLES = ['super_admin', 'shop_admin', 'inventory_manager', 'order_manager', 'admin'];

export const formatUSD = (n) => `$${Number(n || 0).toFixed(2)}`;
export const formatKHR = (usd) => `${Math.round(Number(usd || 0) * 4100).toLocaleString('en-US')} ៛`;

export function normalizeProductCat(item) {
  if (!item) return '';
  if (item.category) return String(item.category).toLowerCase().trim();
  const c = String(item.cat || '').toLowerCase();
  if (c.includes('men') && !c.includes('women')) return 'men';
  if (c.includes('women')) return 'women';
  if (c.includes('kid')) return 'kids';
  if (c.includes('shoe') || c.includes('foot')) return 'shoes';
  if (c.includes('acc') || c.includes('bag')) return 'accessories';
  return c.replace(/[^a-z]/g, '');
}

/* ── Toast Event Bus ─────────────────────────────────────── */
export function notify(message, type = 'default', duration = 3200) {
  window.dispatchEvent(new CustomEvent('fashionstore:toast', { detail: { message, type, duration } }));
}

/* ── Auth Helpers ────────────────────────────────────────── */
export function getToken() {
  return localStorage.getItem(KEYS.TOKEN);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USER));
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(KEYS.TOKEN, token);
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  window.dispatchEvent(new Event('fashionstore:auth'));
}

export function clearAuth() {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.USER);
  window.dispatchEvent(new Event('fashionstore:auth'));
}

export function isAdminUser(user = getUser()) {
  if (!user) return false;
  const email = String(user.email || '').toLowerCase().trim();
  const name = String(user.name || '').toLowerCase().trim();
  if (
    email === 'adminstore@clothingshop.com' ||
    email === 'admin@clothingshop.com' ||
    email === 'admin@fashionstore.com' ||
    email === 'adminstore@fashionstore.com' ||
    name === 'adminstore' ||
    name === 'admin'
  ) {
    return true;
  }
  if (user.role && ADMIN_ROLES.includes(String(user.role).toLowerCase())) return true;
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles.some((r) => ADMIN_ROLES.includes(typeof r === 'string' ? r.toLowerCase() : r?.name?.toLowerCase() || ''));
  }
  return false;
}

/* ── API Client ──────────────────────────────────────────── */
export const api = {
  async request(method, path, body, auth = true) {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    const token = getToken();
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { message: 'Cannot connect to server.' } };
    }
  },
  get: (path) => api.request('GET', path),
  post: (path, body, auth = true) => api.request('POST', path, body, auth),
  patch: (path, body) => api.request('PATCH', path, body),
  delete: (path) => api.request('DELETE', path),
  async upload(path, formData) {
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { message: 'Upload failed.' } };
    }
  },
};

/* ── Catalog Storage (syncs with ProductCatalog) ─────────── */
export function getProducts() {
  const catalog = typeof ProductCatalog !== 'undefined' ? ProductCatalog : window.ProductCatalog;
  if (catalog?.getAll) {
    return catalog.getAll();
  }
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProducts(list) {
  const catalog = typeof ProductCatalog !== 'undefined' ? ProductCatalog : window.ProductCatalog;
  if (catalog?.saveAll) {
    catalog.saveAll(list);
    return;
  }
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: { products: list } }));
  } catch {
    // ignore storage quota errors
  }
}

/* ── Storefront Product Box Layout ───────────────────────── */
export const DEFAULT_LAYOUT = {
  showScrollBox: true,
  showNormalGrid: true,
  scrollEyebrow: 'Featured Collection',
  scrollTitle: 'New Arrivals',
  normalEyebrow: 'Complete Catalog',
  normalTitle: 'All Products',
  order: 'scroll_first',
};

export function getStorefrontLayout() {
  const layoutHelper = typeof StorefrontLayout !== 'undefined' ? StorefrontLayout : window.StorefrontLayout;
  if (layoutHelper?.get) {
    return layoutHelper.get();
  }
  try {
    const raw = localStorage.getItem(KEYS.LAYOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_LAYOUT, ...parsed };
    }
  } catch {
    // fallback default
  }
  return { ...DEFAULT_LAYOUT };
}

export function saveStorefrontLayout(cfg) {
  const layoutHelper = typeof StorefrontLayout !== 'undefined' ? StorefrontLayout : window.StorefrontLayout;
  if (layoutHelper?.save) {
    return layoutHelper.save(cfg);
  }
  const merged = { ...DEFAULT_LAYOUT, ...(cfg || {}) };
  try {
    localStorage.setItem(KEYS.LAYOUT, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('storefrontLayoutUpdated', { detail: { layout: merged } }));
  } catch {
    // ignore
  }
  return merged;
}

export function resetStorefrontLayout() {
  return saveStorefrontLayout({ ...DEFAULT_LAYOUT });
}

export function isInScrollBox(product) {
  if (!product) return false;
  if (typeof product.inScrollBox === 'boolean') return product.inScrollBox;
  return Boolean(product.isNew || product.featured);
}

export function isInNormalGrid(product) {
  if (!product) return false;
  if (typeof product.inNormalGrid === 'boolean') return product.inNormalGrid;
  return true;
}

/* ── Cart & Wishlist Storage ─────────────────────────────── */
export function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.CART) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(KEYS.CART, JSON.stringify(items));
  window.dispatchEvent(new Event('fashionstore:cart'));
}

export function addToCart(product, qty = 1, size = 'M', color = 'Default') {
  const items = getCart();
  const pid = product.id ?? product.sku;
  const idx = items.findIndex((i) => i.id === pid && i.size === size && i.color === color);
  if (idx > -1) {
    items[idx] = { ...items[idx], qty: (items[idx].qty || 1) + qty };
  } else {
    items.push({
      id: pid,
      sku: product.sku,
      name: product.name,
      brand: product.brand || 'Fashion Store KH',
      price: product.price,
      sale_price: product.sale_price,
      image: product.image,
      category: product.category || normalizeProductCat(product),
      qty,
      size,
      color,
    });
  }
  saveCart(items);
  return items;
}

export function getWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.WISHLIST) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWishlist(items) {
  localStorage.setItem(KEYS.WISHLIST, JSON.stringify(items));
  window.dispatchEvent(new Event('fashionstore:wishlist'));
}

export function toggleWishlistItem(product) {
  const pid = product.id ?? product.sku;
  const items = getWishlist();
  const exists = items.some((i) => i.id == pid || (i.sku && i.sku === product.sku));
  const next = exists
    ? items.filter((i) => !(i.id == pid || (i.sku && i.sku === product.sku)))
    : [...items, { id: pid, sku: product.sku, name: product.name, brand: product.brand, price: product.price, sale_price: product.sale_price, image: product.image, sizes: product.sizes, colors: product.colors }];
  saveWishlist(next);
  return !exists;
}

/* ── Cambodia Couriers ───────────────────────────────────── */
export const CAMBODIA_COURIERS = [
  { id: 'jt', name: 'J&T Express 🚚', prefix: 'JT' },
  { id: 'vet', name: 'Virak Buntham (VET) 🚌', prefix: 'VET' },
  { id: 'capitol', name: 'Capitol Express 📦', prefix: 'CAP' },
  { id: 'grab', name: 'Grab Express 🛵', prefix: 'GRB' },
  { id: 'internal', name: 'ហាងដឹកផ្ទាល់ (Store Courier) 🛵', prefix: 'FSH' },
];

/* ── Orders Storage ──────────────────────────────────────── */
export const DEFAULT_ORDERS = [];

const CLEANED_ORDERS_MIGRATION_KEY = 'fs_cleaned_mock_orders_v2';

export function getOrders() {
  try {
    // One-time automatic cleanup of legacy mock orders from localStorage
    if (typeof localStorage !== 'undefined' && localStorage.getItem(CLEANED_ORDERS_MIGRATION_KEY) !== 'true') {
      localStorage.setItem(CLEANED_ORDERS_MIGRATION_KEY, 'true');
      localStorage.removeItem(KEYS.ORDERS);
      return [];
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEYS.ORDERS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy dummy mock orders if any slip through
        const cleaned = parsed.filter(
          (o) => o && o.num !== 'ORD-20261018-0001' && o.num !== 'ORD-20261018-0002' && o.num !== 'ORD-20261102-8821' && o.num !== 'ORD-20261102-9412'
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(KEYS.ORDERS, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveOrders(list) {
  try {
    const validList = Array.isArray(list) ? list : [];
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(validList));
    window.dispatchEvent(new Event('fashionstore:orders'));
  } catch {
    // ignore
  }
}

export function deleteOrder(orderNum) {
  const list = getOrders().filter((o) => o && o.num !== orderNum);
  saveOrders(list);
  return list;
}

export function clearOrders() {
  saveOrders([]);
}

/* ── Inventory Movements Storage (Stock In, Stock Out, Transfer, Return) ── */
export const DEFAULT_INVENTORY_MOVEMENTS = [
  {
    id: 'MOV-1732620100',
    type: 'stock_in',
    sku: 'CS-MSH-001',
    productName: 'Essential Linen Shirt',
    productImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&q=80',
    qty: 20,
    stockBefore: 16,
    stockAfter: 36,
    reference: 'PO-202611-081',
    location: 'Central Warehouse (Phnom Penh)',
    reason: 'New Season Restock (ការនាំចូលស្តុកថ្មី)',
    timestamp: '2026-11-26T08:30:00.000Z',
    dateStr: 'Nov 26, 2026 · 08:30 AM',
    user: 'AdminStore',
  },
  {
    id: 'MOV-1732615400',
    type: 'transfer',
    sku: 'CS-MPN-005',
    productName: 'Slim Chino Pants',
    productImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=120&q=80',
    qty: 10,
    stockBefore: 38,
    stockAfter: 28,
    reference: 'TR-202611-042',
    fromLocation: 'Central Warehouse',
    toLocation: 'BKK1 Flagship Store',
    location: 'Central Warehouse → BKK1 Flagship Store',
    reason: 'Store Display Restock (ផ្ទេរទៅសាខាបឹងកេងកង)',
    timestamp: '2026-11-25T15:20:00.000Z',
    dateStr: 'Nov 25, 2026 · 03:20 PM',
    user: 'AdminStore',
  },
  {
    id: 'MOV-1732608100',
    type: 'return',
    sku: 'CS-MBL-009',
    productName: 'Tailored Wool Blazer',
    productImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&q=80',
    qty: 1,
    stockBefore: 11,
    stockAfter: 12,
    reference: 'RET-202611-018',
    location: 'Customer Return → Store Shelf',
    reason: 'Size Exchange (ប្តូរទំហំ Size M មក L)',
    condition: 'Perfect / Like New (គុណភាពល្អឥតខ្ចោះ)',
    timestamp: '2026-11-25T10:15:00.000Z',
    dateStr: 'Nov 25, 2026 · 10:15 AM',
    user: 'AdminStore',
  },
  {
    id: 'MOV-1732599000',
    type: 'stock_out',
    sku: 'CS-MJK-003',
    productName: 'Classic Denim Jacket',
    productImage: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=120&q=80',
    qty: 2,
    stockBefore: 17,
    stockAfter: 15,
    reference: 'SO-202611-009',
    location: 'Store Front',
    reason: 'Mannequin Display Sample (តាំងបង្ហាញលើរូប)',
    timestamp: '2026-11-24T14:40:00.000Z',
    dateStr: 'Nov 24, 2026 · 02:40 PM',
    user: 'AdminStore',
  },
];

export function getInventoryMovements() {
  try {
    const raw = localStorage.getItem(KEYS.INVENTORY_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_INVENTORY_MOVEMENTS;
}

export function saveInventoryMovements(list) {
  try {
    const validList = Array.isArray(list) ? list : [];
    localStorage.setItem(KEYS.INVENTORY_MOVEMENTS, JSON.stringify(validList));
    window.dispatchEvent(new CustomEvent('fashionstore:inventoryMovements', { detail: { movements: validList } }));
  } catch {
    // ignore
  }
}

export function recordInventoryMovement(movement) {
  const current = getInventoryMovements();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newRecord = {
    id: `MOV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: now.toISOString(),
    dateStr,
    ...movement,
  };
  const updated = [newRecord, ...current].slice(0, 500);
  saveInventoryMovements(updated);
  return updated;
}

export const CATEGORY_HEROES = {
  all: {
    eyebrow: 'New Collection 2026',
    titleLine1: 'Dress with',
    titleEmphasis: 'confidence',
    titleLine2: 'every day.',
    desc: "Discover Cambodia's finest curated fashion. From everyday essentials to statement pieces — all in one place.",
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85',
    imgPosition: 'center top',
    badgeNum: '500+',
    badgeLabel: 'New arrivals this season',
    btnText: 'Shop All Arrivals',
    pageTitle: 'Fashion Store — Fashion for Every Story',
    scrollTitle: 'New Arrivals',
    catalogTitle: 'All Products',
  },
  men: {
    eyebrow: "Men's Collection 2026",
    titleLine1: 'Sharp Tailoring &',
    titleEmphasis: 'Everyday Ease',
    titleLine2: '.',
    desc: 'Crafted for tropical comfort and confident refinement. Breathable linen shirts, vintage denim, chinos, and tailored blazers.',
    img: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=1600&q=85',
    imgPosition: 'center 15%',
    badgeNum: '180+',
    badgeLabel: "Men's curated essentials",
    btnText: "Explore Men's",
    pageTitle: "Men's Fashion & Tailoring — Fashion Store",
    scrollTitle: "Men's Highlights",
    catalogTitle: "Men's Collection",
  },
  women: {
    eyebrow: "Women's Collection 2026",
    titleLine1: 'Effortless Silhouettes &',
    titleEmphasis: 'Summer Grace',
    titleLine2: '.',
    desc: 'Breezy wrap dresses, pure silk blouses, and bohemian tiered skirts designed for sunny strolls and elegant Phnom Penh evenings.',
    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=85',
    imgPosition: 'center top',
    badgeNum: '240+',
    badgeLabel: "Women's styles this season",
    btnText: "Shop Women's",
    pageTitle: "Women's Summer Styles & Dresses — Fashion Store",
    scrollTitle: "Women's Highlights",
    catalogTitle: "Women's Collection",
  },
  kids: {
    eyebrow: 'Kids Collection 2026',
    titleLine1: 'Playful Comfort &',
    titleEmphasis: 'Organic Cotton',
    titleLine2: '.',
    desc: 'Ultra-soft hypoallergenic sets, durable washed denim overalls, and breathable summer essentials for active boys and girls.',
    img: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=1600&q=85',
    imgPosition: 'center top',
    badgeNum: '95+',
    badgeLabel: 'Gentle kids apparel',
    btnText: 'Shop Kids',
    pageTitle: 'Kids Comfort & Organic Cotton — Fashion Store',
    scrollTitle: 'Kids Highlights',
    catalogTitle: 'Kids Collection',
  },
  shoes: {
    eyebrow: 'Footwear Collection 2026',
    titleLine1: 'Step Ahead with',
    titleEmphasis: 'Craft & Comfort',
    titleLine2: '.',
    desc: 'From minimalist street sneakers and cushioned performance runners to oiled leather Chelsea boots built to last.',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85',
    imgPosition: 'center center',
    badgeNum: '60+',
    badgeLabel: 'Pairs of premium footwear',
    btnText: 'Explore Footwear',
    pageTitle: 'Shoes & Footwear Collection — Fashion Store',
    scrollTitle: 'Footwear Highlights',
    catalogTitle: 'Footwear Collection',
  },
  accessories: {
    eyebrow: 'Accessories & Bags 2026',
    titleLine1: 'Finishing Touches That',
    titleEmphasis: 'Define Your Look',
    titleLine2: '.',
    desc: 'Saddle leather crossbodies, heavy organic canvas totes, woven sun hats, and handcrafted leather goods to complete your outfit.',
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1600&q=85',
    imgPosition: 'center center',
    badgeNum: '75+',
    badgeLabel: 'Curated accessories & bags',
    btnText: 'Shop Accessories',
    pageTitle: 'Accessories & Handcrafted Bags — Fashion Store',
    scrollTitle: 'Accessories & Bags',
    catalogTitle: 'Accessories & Bags',
  },
  sale: {
    eyebrow: 'Summer Sale 2026 🔥 Up to 40% OFF',
    titleLine1: 'Summer Deals &',
    titleEmphasis: 'Exclusive Markdowns',
    titleLine2: '.',
    desc: 'Limited-time special prices on signature dresses, shirts, jackets, shoes, and bags. Pay with Bakong KHQR for instant checkouts.',
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&q=85',
    imgPosition: 'center center',
    badgeNum: '40% OFF',
    badgeLabel: 'Selected seasonal styles',
    btnText: 'Grab Sale Items',
    pageTitle: 'Summer Sale 🔥 Up to 40% OFF — Fashion Store',
    scrollTitle: 'Top Markdowns 🔥',
    catalogTitle: 'Summer Sale & Markdowns 🔥',
  },
};

export const CATEGORY_HEROES_KM = {
  all: {
    ...CATEGORY_HEROES.all,
    eyebrow: 'រដូវកាលថ្មី ២០២៦',
    titleLine1: 'ស្លៀកពាក់ដោយ',
    titleEmphasis: 'ទំនុកចិត្តខ្ពស់',
    titleLine2: 'ជារៀងរាល់ថ្ងៃ។',
    desc: 'ស្វែងរកម៉ូដសម្លៀកបំពាក់ដ៏ប្រណីត និងទាន់សម័យបំផុតនៅកម្ពុជា។ ចាប់ពីសម្លៀកបំពាក់ប្រចាំថ្ងៃ រហូតដល់ឈុតកាលីបពិសេសៗ — ទាំងអស់នៅកន្លែងតែមួយ។',
    badgeLabel: 'ទំនិញមកដល់ថ្មីក្នុងរដូវកាលនេះ',
    btnText: 'ទិញទំនិញទាំងអស់',
    pageTitle: 'Fashion Store — ម៉ូដទាន់សម័យសម្រាប់មនុស្សគ្រប់រូប',
    scrollTitle: 'ទំនិញមកដល់ថ្មីៗ',
    catalogTitle: 'ផលិតផលទាំងអស់',
  },
  men: {
    ...CATEGORY_HEROES.men,
    eyebrow: 'ការប្រមូលម៉ូដបុរស ២០២៦',
    titleLine1: 'ភាពទាន់សម័យ និង',
    titleEmphasis: 'ផាសុកភាពបុរស',
    titleLine2: '។',
    desc: 'ផលិតឡើងសម្រាប់អាកាសធាតុក្ដៅបែបត្រូពិក និងភាពថ្លៃថ្នូរ។ អាវសាច់ក្រណាត់លីណិន ខោខូវប៊យ ខោជើងវែង និងអាវធំ Blazer។',
    badgeLabel: 'ម៉ូដសំខាន់ៗសម្រាប់សុភាពបុរស',
    btnText: 'ទិញម៉ូដបុរស',
    pageTitle: 'ម៉ូដសម្លៀកបំពាក់បុរស — Fashion Store',
    scrollTitle: 'ទំនិញបុរសពិសេស',
    catalogTitle: 'កាតាឡុកបុរស',
  },
  women: {
    ...CATEGORY_HEROES.women,
    eyebrow: 'ការប្រមូលម៉ូដនារី ២០២៦',
    titleLine1: 'សម្រស់ស្រស់សោភា និង',
    titleEmphasis: 'ភាពទន់ភ្លន់នារី',
    titleLine2: '។',
    desc: 'រ៉ូបវែងដ៏ស្រស់ស្អាត អាវសូត្រធម្មជាតិ និងសំពត់រលាស់ទាន់សម័យ ស័ក្តិសមសម្រាប់ដើរលេង និងកម្មវិធីពេលរាត្រីនៅភ្នំពេញ។',
    badgeLabel: 'ស្ទាយម៉ូដនារីប្រចាំរដូវកាល',
    btnText: 'ទិញម៉ូដនារី',
    pageTitle: 'ម៉ូដសម្លៀកបំពាក់នារី & រ៉ូប — Fashion Store',
    scrollTitle: 'ទំនិញនារីពិសេស',
    catalogTitle: 'កាតាឡុកនារី',
  },
  kids: {
    ...CATEGORY_HEROES.kids,
    eyebrow: 'ការប្រមូលសម្លៀកបំពាក់កុមារ ២០២៦',
    titleLine1: 'ផាសុកភាពរីករាយ និង',
    titleEmphasis: 'កប្បាសធម្មជាតិ',
    titleLine2: '។',
    desc: 'សាច់ក្រណាត់ទន់ល្មើយ មិនរោលស្បែក ខោខូវប៊យជាប់ធន់ និងអាវយឺតស្រាលស្រួលពាក់សម្រាប់កុមារារ និងកុមារី។',
    badgeLabel: 'សម្លៀកបំពាក់កុមារទន់ស្រួលពាក់',
    btnText: 'ទិញម៉ូដកុមារ',
    pageTitle: 'សម្លៀកបំពាក់កុមារផាសុកភាព — Fashion Store',
    scrollTitle: 'ទំនិញកុមារពិសេស',
    catalogTitle: 'កាតាឡុកកុមារ',
  },
  shoes: {
    ...CATEGORY_HEROES.shoes,
    eyebrow: 'ការប្រមូលស្បែកជើង ២០២៦',
    titleLine1: 'បោះជំហានប្រកបដោយ',
    titleEmphasis: 'គុណភាព & ផាសុកភាព',
    titleLine2: '។',
    desc: 'ស្បែកជើងស្នៀកឃ័រទាន់សម័យ ស្បែកជើងកីឡាស្រាលស្រួលរត់ និងស្បែកជើងប៊ូតស្បែកពិតជាប់ធន់យូរអង្វែង។',
    badgeLabel: 'ស្បែកជើងកម្រិតប្រណីត',
    btnText: 'ទិញស្បែកជើង',
    pageTitle: 'ការប្រមូលស្បែកជើងគ្រប់ប្រភេទ — Fashion Store',
    scrollTitle: 'ស្បែកជើងលេចធ្លោ',
    catalogTitle: 'កាតាឡុកស្បែកជើង',
  },
  accessories: {
    ...CATEGORY_HEROES.accessories,
    eyebrow: 'គ្រឿងតុបតែង & កាបូប ២០២៦',
    titleLine1: 'ភាពទាក់ទាញបន្ថែម',
    titleEmphasis: 'លើកសម្រស់អ្នក',
    titleLine2: '។',
    desc: 'កាបូបស្បែកស្ពាយចំហៀង កាបូបក្រណាត់កានវ៉ាស មួកការពារកម្ដៅថ្ងៃ និងខ្សែក្រវ៉ាត់ស្បែកពិតគុណភាពខ្ពស់។',
    badgeLabel: 'គ្រឿងតុបតែង & កាបូបជ្រើសរើសពិសេស',
    btnText: 'ទិញគ្រឿងតុបតែង',
    pageTitle: 'គ្រឿងតុបតែង & កាបូបដៃ — Fashion Store',
    scrollTitle: 'គ្រឿងតុបតែងពិសេស',
    catalogTitle: 'កាតាឡុកគ្រឿងតុបតែង',
  },
  sale: {
    ...CATEGORY_HEROES.sale,
    eyebrow: 'ប្រូម៉ូសិនរដូវក្ដៅ ២០២៦ 🔥 បញ្ចុះតម្លៃរហូតដល់ ៤០%',
    titleLine1: 'ឱកាសចំណេញច្រើន និង',
    titleEmphasis: 'តម្លៃបញ្ចុះពិសេស',
    titleLine2: '។',
    desc: 'តម្លៃពិសេសសម្រាប់រ៉ូប អាវ អាវរងា ស្បែកជើង និងកាបូប។ គាំទ្រការទូទាត់តាម Bakong KHQR និង COD ភ្លាមៗ។',
    badgeNum: 'ចុះ ៤០%',
    badgeLabel: 'ម៉ូដជ្រើសរើសពិសេសប្រចាំរដូវកាល',
    btnText: 'ទិញទំនិញបញ្ចុះតម្លៃ',
    pageTitle: 'ប្រូម៉ូសិនបញ្ចុះតម្លៃរហូតដល់ ៤០% — Fashion Store',
    scrollTitle: 'ទំនិញបញ្ចុះតម្លៃច្រើនជាងគេ 🔥',
    catalogTitle: 'កាតាឡុកបញ្ចុះតម្លៃ',
  },
};

export function getCategoryHero(cat = 'all', lang = 'km') {
  const normalized = (cat || 'all').toLowerCase();
  const pool = lang === 'en' ? CATEGORY_HEROES : CATEGORY_HEROES_KM;
  return pool[normalized] || pool.all;
}
