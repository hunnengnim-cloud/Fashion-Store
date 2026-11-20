/* ============================================================
   FASHION STORE — Global JS (API client + utilities)
   ============================================================ */

const API   = (typeof window !== 'undefined' && window.location.origin && window.location.protocol.startsWith('http'))
  ? `${window.location.origin}/api/v1`
  : 'http://localhost:8000/api/v1';
const TOKEN = 'cs_token';
const USER  = 'cs_user';

/* ── Auth helpers ─────────────────────────────────────────── */
const Auth = {
  token:    () => localStorage.getItem(TOKEN),
  user:     () => { try { return JSON.parse(localStorage.getItem(USER)); } catch { return null; } },
  set:      (token, user) => {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  clear:    () => { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); },
  loggedIn: () => !!localStorage.getItem(TOKEN),
  isAdmin:  () => {
    const u = Auth.user();
    if (!u) return false;
    const adminRoles = ['super_admin', 'shop_admin', 'inventory_manager', 'order_manager', 'admin'];
    if (u.role && adminRoles.includes(u.role)) return true;
    if (Array.isArray(u.roles)) {
      return u.roles.some(r => {
        const name = typeof r === 'string' ? r : (r?.name || '');
        return adminRoles.includes(name);
      });
    }
    return false;
  },
  isCustomer: () => {
    return Auth.loggedIn() && !Auth.isAdmin();
  },
  canBuy: () => {
    // Only registered customer accounts can buy products; guests and admins cannot buy.
    return Auth.loggedIn() && !Auth.isAdmin();
  },
};

/* ── API client ───────────────────────────────────────────── */
const api = {
  async request(method, path, body, auth = true) {
    if (typeof TopLoader !== 'undefined') TopLoader.start();
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (auth && Auth.token()) headers['Authorization'] = `Bearer ${Auth.token()}`;
    try {
      const res  = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (typeof TopLoader !== 'undefined') TopLoader.done();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      if (typeof TopLoader !== 'undefined') TopLoader.done();
      return { ok: false, status: 0, data: { message: 'Cannot connect to the server.' } };
    }
  },
  get:        (path)       => api.request('GET',    path),
  post:       (path, body) => api.request('POST',   path, body),
  patch:      (path, body) => api.request('PATCH',  path, body),
  delete:     (path)       => api.request('DELETE', path),
  postPublic: (path, body) => api.request('POST',   path, body, false),
  async upload(path, formData) {
    if (typeof TopLoader !== 'undefined') TopLoader.start();
    const headers = { 'Accept': 'application/json' };
    if (Auth.token()) headers['Authorization'] = `Bearer ${Auth.token()}`;
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (typeof TopLoader !== 'undefined') TopLoader.done();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      if (typeof TopLoader !== 'undefined') TopLoader.done();
      return { ok: false, status: 0, data: { message: 'Upload failed or cannot connect.' } };
    }
  },
};


/* ── Toast notifications ──────────────────────────────────── */
function toast(msg, type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const icons = { default: '✦', success: '✓', error: '✕' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.setAttribute('role', 'alert');
  t.innerHTML = `<span class="toast-icon">${icons[type] || '✦'}</span><span class="toast-text">${msg}</span><button type="button" class="toast-close" aria-label="Dismiss notification" title="Dismiss">✕</button>`;

  let isDismissed = false;
  let timer = null;

  const dismiss = () => {
    if (isDismissed) return;
    isDismissed = true;
    if (timer) clearTimeout(timer);
    t.style.cssText += 'opacity:0;transform:translateX(35px) scale(0.95);transition:all .25s cubic-bezier(0.4, 0, 0.2, 1);pointer-events:none;';
    setTimeout(() => {
      try { t.remove(); } catch (_) {}
    }, 280);
  };

  const closeBtn = t.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
  }
  t.addEventListener('click', dismiss);

  container.appendChild(t);
  timer = setTimeout(dismiss, duration);
}

/* ── Button loading state ─────────────────────────────────── */
function btnLoading(btn, on) {
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}

/* ── Form error helpers ───────────────────────────────────── */
function clearErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.classList.remove('is-error');
    } else {
      el.textContent = '';
      el.classList.remove('show');
    }
  });
}

function showFieldError(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.add('is-error');
  const e = document.getElementById(errId);
  if (e) { e.textContent = msg; e.classList.add('show'); }
}

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<span>${msg}</span>`;
  el.classList.add('show');
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('show'); el.innerHTML = ''; }
}

/* ── Password visibility toggle ──────────────────────────── */
function togglePw(inputId, iconEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPw = inp.type === 'password';
  inp.type = isPw ? 'text' : 'password';
  if (iconEl) {
    iconEl.innerHTML = isPw
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}

/* ── Master Product Catalog (Shared between Admin & Storefront) ── */
const ProductCatalog = {
  KEY: 'cs_admin_products',
  DEFAULT_PRODUCTS: [
    // Men (7 items)
    { id:1, sku:'CS-MSH-001', name:'Essential Linen Shirt', brand:'Studio KH', cat:"Men's", category:'men', price:34.99, sale_price:24.99, stock:42, status:'active', sales:128, image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:42, desc:'Crafted from 100% natural breathable European linen. Tailored regular fit designed for comfortable tropical elegance.', description:'Crafted from 100% natural breathable European linen. Tailored regular fit designed for comfortable tropical elegance.', sizes:['S','M','L','XL'], colors:['White','Navy','Olive','Beige'] },
    { id:3, sku:'CS-MJK-003', name:'Classic Denim Jacket', brand:'Indigo Co.', cat:"Men's", category:'men', price:89.99, sale_price:null, stock:15, status:'active', sales:64, image:'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80', isNew:false, featured:true, rating:5.0, reviews:64, desc:'Vintage washed heavy-duty 12oz denim jacket with signature bronze hardware and reinforced double-needle stitching.', description:'Vintage washed heavy-duty 12oz denim jacket with signature bronze hardware and reinforced double-needle stitching.', sizes:['M','L','XL','XXL'], colors:['Classic Indigo','Light Wash','Washed Black'] },
    { id:5, sku:'CS-MPN-005', name:'Slim Chino Pants', brand:'Studio KH', cat:"Men's", category:'men', price:49.99, sale_price:39.99, stock:28, status:'active', sales:19, image:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80', isNew:false, featured:false, rating:4.6, reviews:19, desc:'Stretch cotton twill trousers tailored with a clean tapered leg, angled side pockets, and durable button-tab closure.', description:'Stretch cotton twill trousers tailored with a clean tapered leg, angled side pockets, and durable button-tab closure.', sizes:['30','32','34','36'], colors:['Khaki','Charcoal','Navy'] },
    { id:9, sku:'CS-MBL-009', name:'Tailored Wool Blazer', brand:'Studio KH', cat:"Men's", category:'men', price:119.00, sale_price:89.00, stock:12, status:'active', sales:31, image:'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=600&q=80', isNew:false, featured:true, rating:4.9, reviews:31, desc:'Modern notch-lapel unstructured blazer made with fine breathable tropical wool. Suitable for conferences and evenings.', description:'Modern notch-lapel unstructured blazer made with fine breathable tropical wool. Suitable for conferences and evenings.', sizes:['38R','40R','42R','44R'], colors:['Charcoal Gray','Deep Navy','Sand'] },
    { id:14, sku:'CS-MSW-014', name:'Knit Crewneck Sweater', brand:'Studio KH', cat:"Men's", category:'men', price:48.00, sale_price:36.00, stock:22, status:'active', sales:26, image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', isNew:false, featured:false, rating:4.8, reviews:26, desc:'Fine gauge organic cotton crewneck pullover with ribbed cuffs and hem. The essential year-round layer.', description:'Fine gauge organic cotton crewneck pullover with ribbed cuffs and hem. The essential year-round layer.', sizes:['S','M','L','XL'], colors:['Oatmeal','Navy','Olive Heather'] },
    { id:17, sku:'CS-MSH-017', name:'Oxford Cotton Shirt', brand:'Studio KH', cat:"Men's", category:'men', price:42.00, sale_price:29.99, stock:35, status:'active', sales:18, image:'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80', isNew:true, featured:true, rating:4.8, reviews:18, desc:'Crisp, durable garment-washed Oxford cotton shirt with button-down collar and mother-of-pearl buttons.', description:'Crisp, durable garment-washed Oxford cotton shirt with button-down collar and mother-of-pearl buttons.', sizes:['S','M','L','XL'], colors:['Light Blue','White','Pink'] },
    { id:18, sku:'CS-MSH-018', name:'Casual Linen Shorts', brand:'Studio KH', cat:"Men's", category:'men', price:36.00, sale_price:26.00, stock:19, status:'active', sales:14, image:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80', isNew:true, featured:false, rating:4.7, reviews:14, desc:'Lightweight drawstring linen shorts for effortless warm-weather style and coastal weekend relaxation.', description:'Lightweight drawstring linen shorts for effortless warm-weather style and coastal weekend relaxation.', sizes:['S','M','L','XL'], colors:['Sand','Navy','Sage'] },

    // Women (6 items)
    { id:2, sku:'CS-WDR-002', name:'Floral Wrap Dress', brand:'Bloom KH', cat:"Women's", category:'women', price:59.99, sale_price:42.00, stock:24, status:'active', sales:94, image:'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80', isNew:true, featured:true, rating:4.8, reviews:38, desc:'A breezy wrap dress adorned with delicate tropical botanicals. Features an adjustable waist tie and flowy midi hem.', description:'A breezy wrap dress adorned with delicate tropical botanicals. Features an adjustable waist tie and flowy midi hem.', sizes:['XS','S','M','L'], colors:['Floral Multi','Pastel Pink','Sage'] },
    { id:4, sku:'CS-WBL-004', name:'Silk Blouse', brand:'Bloom KH', cat:"Women's", category:'women', price:45.00, sale_price:33.00, stock:18, status:'active', sales:54, image:'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80', isNew:false, featured:false, rating:4.7, reviews:21, desc:'Sumptuous lightweight silk satin with subtle pearl sheen. Perfectly complements tailored trousers or weekend denim.', description:'Sumptuous lightweight silk satin with subtle pearl sheen. Perfectly complements tailored trousers or weekend denim.', sizes:['XS','S','M','L'], colors:['Ivory','Champagne','Blush'] },
    { id:8, sku:'CS-WSK-008', name:'Boho Maxi Skirt', brand:'Bloom KH', cat:"Women's", category:'women', price:52.00, sale_price:38.00, stock:16, status:'active', sales:29, image:'https://images.unsplash.com/photo-1583496661160-fb5218afa9a1?w=600&q=80', isNew:true, featured:false, rating:4.8, reviews:29, desc:'Tiered lightweight cotton-viscose blend maxi skirt with elastic smocked waist and playful ruffled hemline.', description:'Tiered lightweight cotton-viscose blend maxi skirt with elastic smocked waist and playful ruffled hemline.', sizes:['S','M','L'], colors:['Terracotta','Cream Bohemian','Midnight Flora'] },
    { id:10, sku:'CS-WDR-010', name:'Pleated Midi Dress', brand:'Bloom KH', cat:"Women's", category:'women', price:64.99, sale_price:49.99, stock:20, status:'active', sales:22, image:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:22, desc:'Sophisticated accordion-pleated sleeveless dress featuring a high neckline and matching gold-accent belt.', description:'Sophisticated accordion-pleated sleeveless dress featuring a high neckline and matching gold-accent belt.', sizes:['XS','S','M','L'], colors:['Emerald Green','Champagne Gold','Royal Blue'] },
    { id:19, sku:'CS-WTR-019', name:'Linen Wide-Leg Trousers', brand:'Bloom KH', cat:"Women's", category:'women', price:55.00, sale_price:39.00, stock:26, status:'active', sales:33, image:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:33, desc:'High-rise wide-leg linen pants with tailored front pleats and concealed zip for breezy summer refinement.', description:'High-rise wide-leg linen pants with tailored front pleats and concealed zip for breezy summer refinement.', sizes:['XS','S','M','L'], colors:['Flax Ecru','Soft Olive','Charcoal'] },
    { id:20, sku:'CS-WSD-020', name:'Summer Tiered Sundress', brand:'Bloom KH', cat:"Women's", category:'women', price:58.00, sale_price:44.00, stock:14, status:'active', sales:19, image:'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80', isNew:false, featured:false, rating:4.8, reviews:19, desc:'A-line tiered cotton sundress with tie shoulder straps and sweet-heart neckline. Ideal for tropical daytime escapes.', description:'A-line tiered cotton sundress with tie shoulder straps and sweet-heart neckline. Ideal for tropical daytime escapes.', sizes:['XS','S','M','L'], colors:['Sunshine Yellow','Lavender','Coral'] },

    // Kids (5 items)
    { id:6, sku:'CS-KST-006', name:'Kids Cotton Set', brand:'Little Stars', cat:"Kids", category:'kids', price:29.99, sale_price:19.99, stock:32, status:'active', sales:110, image:'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:15, desc:'Ultra-soft hypoallergenic 100% organic cotton tee and shorts set. Designed for everyday adventures and gentle wash cycles.', description:'Ultra-soft hypoallergenic 100% organic cotton tee and shorts set. Designed for everyday adventures and gentle wash cycles.', sizes:['2-3Y','4-5Y','6-7Y','8-9Y'], colors:['Sky Blue','Sunny Yellow','Pastel Mint'] },
    { id:13, sku:'CS-KDO-013', name:'Kids Denim Overalls', brand:'Little Stars', cat:"Kids", category:'kids', price:32.00, sale_price:24.00, stock:18, status:'active', sales:12, image:'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80', isNew:false, featured:false, rating:4.7, reviews:12, desc:'Durable washed denim dungarees with adjustable shoulder buckles, functional bib pocket, and relaxed play fit.', description:'Durable washed denim dungarees with adjustable shoulder buckles, functional bib pocket, and relaxed play fit.', sizes:['3-4Y','5-6Y','7-8Y'], colors:['Medium Denim','Light Vintage'] },
    { id:21, sku:'CS-KST-021', name:'Kids Striped Sailor Tee', brand:'Little Stars', cat:"Kids", category:'kids', price:18.00, sale_price:12.99, stock:45, status:'active', sales:27, image:'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:27, desc:'Classic nautical Breton striped t-shirt woven from soft combed cotton with reinforced neckline ribbing.', description:'Classic nautical Breton striped t-shirt woven from soft combed cotton with reinforced neckline ribbing.', sizes:['2-3Y','4-5Y','6-7Y','8-9Y'], colors:['Navy/White','Red/White'] },
    { id:22, sku:'CS-KRM-022', name:'Kids Summer Romper', brand:'Little Stars', cat:"Kids", category:'kids', price:26.00, sale_price:18.00, stock:21, status:'active', sales:16, image:'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80', isNew:true, featured:false, rating:4.8, reviews:16, desc:'Breathable lightweight linen-blend romper with snap buttons at the bottom for quick and easy changing.', description:'Breathable lightweight linen-blend romper with snap buttons at the bottom for quick and easy changing.', sizes:['1-2Y','2-3Y','3-4Y'], colors:['Peach','Pale Blue','Natural Linen'] },
    { id:23, sku:'CS-KHD-023', name:'Kids Fleece Zip Hoodie', brand:'Little Stars', cat:"Kids", category:'kids', price:34.00, sale_price:25.00, stock:25, status:'active', sales:20, image:'https://images.unsplash.com/photo-1471286174890-9c112ffca564?w=600&q=80', isNew:false, featured:false, rating:4.7, reviews:20, desc:'Cosy brushed-back cotton fleece hoodie with smooth kangaroo pockets and safety zip guard.', description:'Cosy brushed-back cotton fleece hoodie with smooth kangaroo pockets and safety zip guard.', sizes:['3-4Y','5-6Y','7-8Y','9-10Y'], colors:['Heather Grey','Navy Blue','Blush'] },

    // Shoes (5 items)
    { id:7, sku:'CS-SHS-007', name:'White Sneakers', brand:'Street KH', cat:"Shoes", category:'shoes', price:79.99, sale_price:59.99, stock:25, status:'active', sales:142, image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', isNew:false, featured:true, rating:4.9, reviews:53, desc:'Minimalist low-top street sneakers with padded memory foam insole and vulcanized non-slip rubber outsole.', description:'Minimalist low-top street sneakers with padded memory foam insole and vulcanized non-slip rubber outsole.', sizes:['39','40','41','42','43','44'], colors:['Crisp White','Triple Black'] },
    { id:11, sku:'CS-SBT-011', name:'Leather Chelsea Boots', brand:'Street KH', cat:"Shoes", category:'shoes', price:99.99, sale_price:79.99, stock:14, status:'active', sales:44, image:'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&q=80', isNew:false, featured:true, rating:5.0, reviews:44, desc:'Full-grain oiled leather chelsea boots with elastic side gussets and pull loops. Built to age with character.', description:'Full-grain oiled leather chelsea boots with elastic side gussets and pull loops. Built to age with character.', sizes:['40','41','42','43','44'], colors:['Cognac Brown','Matte Black'] },
    { id:16, sku:'CS-SRN-016', name:'Running Sport Sneakers', brand:'Street KH', cat:"Shoes", category:'shoes', price:85.00, sale_price:65.00, stock:30, status:'active', sales:35, image:'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80', isNew:true, featured:false, rating:4.7, reviews:35, desc:'Engineered mesh upper for maximum airflow, paired with shock-absorbing EVA foam midsole cushioning.', description:'Engineered mesh upper for maximum airflow, paired with shock-absorbing EVA foam midsole cushioning.', sizes:['39','40','41','42','43','44'], colors:['Steel Gray','Neon Accent','Pure White'] },
    { id:24, sku:'CS-SSD-024', name:'Woven Leather Sandals', brand:'Street KH', cat:"Shoes", category:'shoes', price:49.00, sale_price:35.00, stock:17, status:'active', sales:21, image:'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=600&q=80', isNew:true, featured:true, rating:4.8, reviews:21, desc:'Handwoven artisanal leather slide sandals with cushioned footbed and durable non-marking rubber soles.', description:'Handwoven artisanal leather slide sandals with cushioned footbed and durable non-marking rubber soles.', sizes:['38','39','40','41','42'], colors:['Tan Brown','Espresso Black'] },
    { id:25, sku:'CS-SLF-025', name:'Classic Suede Loafers', brand:'Street KH', cat:"Shoes", category:'shoes', price:89.00, sale_price:69.00, stock:19, status:'active', sales:29, image:'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80', isNew:false, featured:true, rating:4.9, reviews:29, desc:'Supple Italian suede driving loafers with penny keeper strap and flexible rubber pebble driving sole.', description:'Supple Italian suede driving loafers with penny keeper strap and flexible rubber pebble driving sole.', sizes:['40','41','42','43','44'], colors:['Sand Suede','Navy Suede','Dark Brown'] },

    // Accessories (5 items)
    { id:12, sku:'CS-BAG-012', name:'Leather Crossbody Bag', brand:'Urban Lux', cat:"Accessories", category:'accessories', price:54.00, sale_price:39.99, stock:14, status:'active', sales:88, image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', isNew:true, featured:true, rating:4.8, reviews:17, desc:'Compact everyday saddle silhouette bag with magnetic flap, custom brass hardware, and adjustable strap.', description:'Compact everyday saddle silhouette bag with magnetic flap, custom brass hardware, and adjustable strap.', sizes:['One Size'], colors:['Caramel','Black','Wine Red'] },
    { id:15, sku:'CS-ACC-015', name:'Minimalist Canvas Tote', brand:'Studio KH', cat:"Accessories", category:'accessories', price:24.00, sale_price:16.00, stock:50, status:'active', sales:60, image:'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', isNew:true, featured:false, rating:4.9, reviews:60, desc:'Heavyweight 16oz natural cotton canvas tote with interior zip organizer pocket and reinforced shoulder straps.', description:'Heavyweight 16oz natural cotton canvas tote with interior zip organizer pocket and reinforced shoulder straps.', sizes:['One Size'], colors:['Natural Ecru','Washed Black'] },
    { id:26, sku:'CS-ACC-026', name:'Handcrafted Straw Sun Hat', brand:'Urban Lux', cat:"Accessories", category:'accessories', price:28.00, sale_price:19.99, stock:22, status:'active', sales:24, image:'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80', isNew:true, featured:true, rating:4.8, reviews:24, desc:'Woven natural toquilla straw fedora hat featuring an interior sweatband and grosgrain band accent.', description:'Woven natural toquilla straw fedora hat featuring an interior sweatband and grosgrain band accent.', sizes:['Medium','Large'], colors:['Natural Straw','Warm Honey'] },
    { id:27, sku:'CS-ACC-027', name:'Leather Minimalist Belt', brand:'Studio KH', cat:"Accessories", category:'accessories', price:32.00, sale_price:22.00, stock:38, status:'active', sales:15, image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', isNew:false, featured:false, rating:4.7, reviews:15, desc:'Full-grain vegetable-tanned leather belt finished with brushed antique brass pin buckle.', description:'Full-grain vegetable-tanned leather belt finished with brushed antique brass pin buckle.', sizes:['32','34','36','38'], colors:['Cognac','Black'] },
    { id:28, sku:'CS-ACC-028', name:'Classic Polarized Sunglasses', brand:'Urban Lux', cat:"Accessories", category:'accessories', price:35.00, sale_price:25.00, stock:40, status:'active', sales:38, image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80', isNew:true, featured:true, rating:4.9, reviews:38, desc:'Acetate handcrafted sunglasses with UV400 polarized anti-glare scratch-resistant lenses.', description:'Acetate handcrafted sunglasses with UV400 polarized anti-glare scratch-resistant lenses.', sizes:['One Size'], colors:['Tortoise','Glossy Black','Amber'] }
  ],
  VERSION_KEY: 'cs_catalog_version',
  VERSION: 'v2_29',
  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const curVer = localStorage.getItem(this.VERSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If storage is from previous version (e.g. old demo), merge missing items and stamp version
          if (curVer !== this.VERSION) {
            const merged = [...parsed];
            this.DEFAULT_PRODUCTS.forEach(def => {
              const existingIdx = merged.findIndex(m => (m.sku && m.sku === def.sku) || (m.id && m.id === def.id));
              if (existingIdx === -1) {
                merged.push(def);
              } else {
                merged[existingIdx] = {
                  ...def,
                  ...merged[existingIdx],
                  image: def.sku === 'CS-MBL-009' ? def.image : (merged[existingIdx].image || def.image),
                  id: merged[existingIdx].id || def.id,
                  category: merged[existingIdx].category || def.category,
                  cat: merged[existingIdx].cat || def.cat,
                  desc: merged[existingIdx].desc || merged[existingIdx].description || def.desc,
                  description: merged[existingIdx].description || merged[existingIdx].desc || def.description
                };
              }
            });
            localStorage.setItem(this.VERSION_KEY, this.VERSION);
            this.saveAll(merged);
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {}
    try { localStorage.setItem(this.VERSION_KEY, this.VERSION); } catch (e) {}
    this.saveAll(this.DEFAULT_PRODUCTS);
    return [...this.DEFAULT_PRODUCTS];
  },
  saveAll(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: { products: list } }));
    } catch (e) {}
  }
};

/* ── Storefront Product Box Layout Sync ───────────────────── */
const StorefrontLayout = {
  KEY: 'cs_storefront_layout',
  DEFAULT: {
    showScrollBox: true,
    showNormalGrid: true,
    scrollEyebrow: 'Featured Collection',
    scrollTitle: 'New Arrivals',
    normalEyebrow: 'Complete Catalog',
    normalTitle: 'All Products',
    order: 'scroll_first'
  },
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...this.DEFAULT, ...parsed };
        }
      }
    } catch (e) {}
    return { ...this.DEFAULT };
  },
  save(cfg) {
    const merged = { ...this.DEFAULT, ...(cfg || {}) };
    try {
      localStorage.setItem(this.KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('storefrontLayoutUpdated', { detail: { layout: merged } }));
    } catch (e) {}
    return merged;
  },
  reset() {
    return this.save({ ...this.DEFAULT });
  },
  isInScrollBox(product) {
    if (!product) return false;
    if (typeof product.inScrollBox === 'boolean') return product.inScrollBox;
    return Boolean(product.isNew || product.featured);
  },
  isInNormalGrid(product) {
    if (!product) return false;
    if (typeof product.inNormalGrid === 'boolean') return product.inNormalGrid;
    return true;
  }
};

/* ── Cart & Wishlist storage helpers ──────────────────────── */
const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('cs_cart')) || []; } catch { return []; } },
  set: (items) => { localStorage.setItem('cs_cart', JSON.stringify(items)); updateBadges(); },
  count: () => Cart.get().reduce((sum, item) => sum + (item.qty || 1), 0),
  add: (product, qty = 1, size = 'M', color = 'Default') => {
    const items = Cart.get();
    const idx = items.findIndex(i => i.id === product.id && i.size === size && i.color === color);
    if (idx > -1) {
      items[idx].qty += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        sale_price: product.sale_price,
        image: product.image,
        category: product.category,
        size,
        color,
        qty
      });
    }
    Cart.set(items);
  },
  remove: (id, size, color) => {
    let items = Cart.get();
    items = items.filter(i => !(i.id === id && (!size || i.size === size) && (!color || i.color === color)));
    Cart.set(items);
  },
  updateQty: (id, size, color, delta) => {
    const items = Cart.get();
    const item = items.find(i => i.id === id && (!size || i.size === size) && (!color || i.color === color));
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        Cart.remove(id, size, color);
        return;
      }
    }
    Cart.set(items);
  },
  clear: () => { localStorage.removeItem('cs_cart'); updateBadges(); }
};

const Wishlist = {
  get: () => { try { return JSON.parse(localStorage.getItem('cs_wishlist')) || []; } catch { return []; } },
  set: (items) => { localStorage.setItem('cs_wishlist', JSON.stringify(items)); updateBadges(); },
  has: (id) => Wishlist.get().some(i => i.id == id || (i.sku && i.sku == id)),
  toggle: (product) => {
    let items = Wishlist.get();
    const pid = product.id;
    const psku = product.sku;
    const exists = items.some(i => i.id == pid || (psku && i.sku == psku));
    if (exists) {
      items = items.filter(i => !(i.id == pid || (psku && i.sku == psku)));
      Wishlist.set(items);
      return false;
    } else {
      items.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        price: product.price,
        sale_price: product.sale_price,
        image: product.image,
        category: product.category
      });
      Wishlist.set(items);
      return true;
    }
  },
  count: () => Wishlist.get().length,
  clear: () => { localStorage.removeItem('cs_wishlist'); updateBadges(); }
};

function updateBadges() {
  const cartBadge = document.getElementById('cartCount');
  if (cartBadge) {
    const c = Cart.count();
    cartBadge.textContent = c;
    cartBadge.classList.add('badge-bounce');
    setTimeout(() => cartBadge.classList.remove('badge-bounce'), 300);
  }
  const wishBadge = document.getElementById('wishlistCount');
  if (wishBadge) {
    const w = Wishlist.count();
    wishBadge.textContent = w;
  }
}

/* ── User dropdown toggler ────────────────────────────────── */
function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.querySelector('.user-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('nav-user');
  const dropdown = document.querySelector('.user-dropdown');
  if (userMenu && dropdown && !userMenu.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

/* ── Navigation state ─────────────────────────────────────── */
function updateNav() {
  const user     = Auth.user();
  const loggedIn = Auth.loggedIn();
  const navAuth  = document.getElementById('nav-auth');
  const navUser  = document.getElementById('nav-user');

  updateBadges();

  if (!navAuth || !navUser) return;

  if (loggedIn && user) {
    navAuth.style.display = 'none';
    navUser.style.display = 'flex';

    const initial     = document.getElementById('nav-initial');
    const nameEl      = document.getElementById('nav-name');
    const dropName    = document.getElementById('nav-dropdown-name');
    const dropEmail   = document.getElementById('nav-dropdown-email');
    const dropRole    = document.getElementById('nav-dropdown-role');
    const adminLink   = document.getElementById('adminLink');
    const switchAdmin = document.getElementById('navSwitchAdmin');

    const firstChar   = (user.name || '?').charAt(0).toUpperCase();
    const avatarUrl   = user.avatar_url || user.avatar;
    if (nameEl)    nameEl.textContent  = user.name.split(' ')[0];
    if (dropName)  dropName.textContent = user.name;
    if (dropEmail) dropEmail.textContent = user.email;

    const isAdmin = Auth.isAdmin();
    if (initial) {
      if (avatarUrl) {
        initial.innerHTML = `<img src="${avatarUrl}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
        initial.style.background = 'transparent';
        initial.style.padding = '0';
      } else {
        initial.innerHTML = '';
        initial.textContent = firstChar;
        initial.style.background = isAdmin
          ? 'linear-gradient(135deg, #c9a96e, #9e7d3b)'
          : 'var(--black)';
      }
      initial.title = isAdmin ? `${user.name} (Admin)` : user.name;
    }

    const dropAvatar  = document.getElementById('nav-dropdown-avatar');
    if (dropAvatar) {
      if (avatarUrl) {
        dropAvatar.innerHTML = `<img src="${avatarUrl}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
        dropAvatar.style.background = 'transparent';
      } else {
        dropAvatar.innerHTML = '';
        dropAvatar.textContent = firstChar;
        dropAvatar.style.background = isAdmin
          ? 'linear-gradient(135deg, #c9a96e, #9e7d3b)'
          : 'var(--black)';
      }
    }

    if (dropRole) {
      dropRole.textContent = isAdmin ? 'Admin' : 'Customer';
      dropRole.className   = isAdmin ? 'dropdown-role-tag role-admin' : 'dropdown-role-tag role-customer';
    }

    if (adminLink) {
      adminLink.style.display = isAdmin ? 'flex' : 'none';
    }

    if (switchAdmin) {
      switchAdmin.style.display = 'none';
    }
  } else {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
  }
}

/* ── Quick Switch to Admin (Demo Helper) ──────────────────── */
async function switchToAdmin() {
  toast('Switching to Admin account… 👑', 'default', 1500);
  const { ok, data } = await api.postPublic('/login', {
    email: 'AdminStore',
    password: 'store168',
    device_name: 'web_browser'
  });
  if (ok) {
    Auth.set(data.data.token, data.data.user);
    toast('Logged in as Admin! Redirecting to Dashboard… 📊', 'success', 1500);
    setTimeout(() => {
      window.location.href = '/admin';
    }, 600);
  } else {
    window.location.href = '/login';
  }
}

/* ── Quick Switch to Customer (Demo Helper) ────────────────── */
async function switchToCustomer(redirectUrl = null) {
  toast('Switching to Customer account… 🛍', 'default', 1500);
  const { ok, data } = await api.postPublic('/login', {
    email: 'dara@example.com',
    password: 'Test@1234',
    device_name: 'web_browser'
  });
  if (ok) {
    Auth.set(data.data.token, data.data.user);
    toast('Signed in as Dara Sok (Customer)! ✨', 'success', 1500);
    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.reload();
      }
    }, 600);
  } else {
    window.location.href = '/login?redirect=checkout';
  }
}

/* ── Global logout ────────────────────────────────────────── */
async function logout() {
  try { await api.post('/logout'); } catch (_) {}
  Auth.clear();
  toast('Signed out successfully 👋', 'default', 1500);
  setTimeout(() => {
    window.location.href = '/';
  }, 400);
}

/* ── Currency formatters ──────────────────────────────────── */
function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

function formatKHR(usd, rate = 4100) {
  return new Intl.NumberFormat('km-KH').format(Math.round((usd || 0) * rate)) + ' ៛';
}

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateNav();
  updateBadges();
  initScrollMoto();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initTheme();
  initScrollMoto();
}

/* ── Night Mode (Dark Mode) Controller ───────────────────── */
function initTheme() {
  const saved = localStorage.getItem('cs_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const current = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(current, false);

  // Mount theme button in storefront navbar if not already present
  const navActions = document.querySelector('.nav-actions');
  if (navActions && !document.getElementById('themeToggleBtn')) {
    const btn = document.createElement('button');
    btn.className = 'nav-icon-btn';
    btn.id = 'themeToggleBtn';
    btn.setAttribute('aria-label', 'Toggle Night Mode');
    btn.title = current === 'dark' ? 'Switch to Day Mode ☀️' : 'Switch to Night Mode 🌙';
    btn.onclick = toggleTheme;
    btn.innerHTML = `
      <svg class="theme-icon-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg class="theme-icon-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      navActions.insertBefore(btn, searchBtn);
    } else {
      navActions.appendChild(btn);
    }
  }

  // Mount theme button in admin topbar if not already present
  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions && !document.getElementById('themeToggleBtn') && !document.getElementById('adminThemeToggleBtn')) {
    const btn = document.createElement('button');
    btn.className = 'topbar-icon';
    btn.id = 'adminThemeToggleBtn';
    btn.setAttribute('aria-label', 'Toggle Night Mode');
    btn.title = current === 'dark' ? 'Switch to Day Mode ☀️' : 'Switch to Night Mode 🌙';
    btn.onclick = toggleTheme;
    btn.innerHTML = `
      <svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    topbarActions.insertBefore(btn, topbarActions.firstChild);
  }

  updateThemeIcons(current);
}

function applyTheme(theme, showToast = true) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cs_theme', theme);
  updateThemeIcons(theme);

  if (showToast && typeof toast === 'function') {
    toast(theme === 'dark' ? 'Night mode activated 🌙✨' : 'Day mode activated ☀️', 'default', 2200);
  }
}

function updateThemeIcons(theme) {
  const isDark = theme === 'dark';
  const buttons = document.querySelectorAll('#themeToggleBtn, #adminThemeToggleBtn');
  buttons.forEach(btn => {
    btn.title = isDark ? 'Switch to Day Mode ☀️' : 'Switch to Night Mode 🌙';
    const moon = btn.querySelector('.theme-icon-moon');
    const sun = btn.querySelector('.theme-icon-sun');
    if (moon && sun) {
      moon.style.display = isDark ? 'none' : 'block';
      sun.style.display = isDark ? 'block' : 'none';
    }
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}

/* ── Bottom Scrolling Delivery Moto ─────────────────────── */
function initScrollMoto() {
  // Only show on storefront, not on admin or login
  const path = (window.location.pathname || '').toLowerCase();
  if (path.startsWith('/admin') || path.startsWith('/login') || document.body.classList.contains('admin-page')) {
    return;
  }

  // Prevent duplicate mounts
  if (document.getElementById('scrollMotoTrack')) return;

  const track = document.createElement('div');
  track.id = 'scrollMotoTrack';
  track.className = 'scroll-moto-track';
  track.setAttribute('aria-hidden', 'true');

  track.innerHTML = `
    <div class="scroll-moto-road">
      <div class="scroll-moto-progress" id="scrollMotoProgress"></div>
    </div>
    <div id="scrollMoto" class="scroll-moto" title="Fashion Express Delivery 🛵✨ (Click to ride to top)">
      <div class="scroll-moto-bubble" id="scrollMotoBubble">
        <span id="scrollMotoText">🛵 VIP Delivery · 0%</span>
      </div>
      <div class="scroll-moto-vehicle" id="scrollMotoVehicle">
        <svg viewBox="0 0 116 64" width="116" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Headlight luminous cone -->
            <linearGradient id="popHeadlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.85"/>
              <stop offset="30%" stop-color="#fef08a" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
            </linearGradient>

            <!-- Metallic Obsidian Body Paint -->
            <linearGradient id="popBodyGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stop-color="#334155"/>
              <stop offset="35%" stop-color="#1e293b"/>
              <stop offset="85%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>

            <!-- Champagne Gold Luxury Bag / Accents -->
            <linearGradient id="popGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#faeed4"/>
              <stop offset="35%" stop-color="#d4af37"/>
              <stop offset="70%" stop-color="#c9a96e"/>
              <stop offset="100%" stop-color="#8c6a28"/>
            </linearGradient>

            <!-- Cognac Handcrafted Leather Seat -->
            <linearGradient id="popSeatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#b45309"/>
              <stop offset="50%" stop-color="#92400e"/>
              <stop offset="100%" stop-color="#78350f"/>
            </linearGradient>

            <!-- Polished Chrome Finish -->
            <linearGradient id="popChromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="40%" stop-color="#e2e8f0"/>
              <stop offset="70%" stop-color="#94a3b8"/>
              <stop offset="100%" stop-color="#cbd5e1"/>
            </linearGradient>

            <!-- Ground Shadow Blur Filter -->
            <filter id="popShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5"/>
            </filter>
          </defs>

          <!-- 1. Ambient Ground Shadow under tires -->
          <ellipse cx="52" cy="61" rx="46" ry="2.5" fill="#0f172a" opacity="0.35" filter="url(#popShadowBlur)" class="moto-ground-shadow"/>

          <!-- 2. Dynamic Speed Wind Lines -->
          <g class="moto-wind-lines">
            <line x1="16" y1="22" x2="2" y2="22" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0" class="wind-line w1"/>
            <line x1="22" y1="14" x2="8" y2="14" stroke="#c9a96e" stroke-width="1.2" stroke-linecap="round" opacity="0" class="wind-line w2"/>
            <line x1="18" y1="32" x2="4" y2="32" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0" class="wind-line w3"/>
          </g>

          <!-- 3. Headlight Light Beam Cone -->
          <polygon points="88,24 126,14 126,42 88,30" fill="url(#popHeadlightBeam)" opacity="0.55" class="moto-beam"/>

          <!-- 4. Exhaust System & Animated Smoke Puffs -->
          <path d="M24,51 L10,53" stroke="url(#popChromeGrad)" stroke-width="3" stroke-linecap="round"/>
          <circle cx="10" cy="53" r="1.5" fill="#475569"/>
          <!-- Smoke puffs -->
          <circle cx="5" cy="53" r="2.8" fill="#94a3b8" class="moto-puff puff-1"/>
          <circle cx="1" cy="51" r="2.2" fill="#cbd5e1" class="moto-puff puff-2"/>
          <circle cx="-3" cy="48" r="1.8" fill="#e2e8f0" class="moto-puff puff-3"/>

          <!-- 5. Chrome Rear Carrier Rack -->
          <path d="M12,41 L12,34 L28,34 L32,41" stroke="url(#popChromeGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="18" y1="34" x2="18" y2="41" stroke="url(#popChromeGrad)" stroke-width="1.5"/>

          <!-- 6. Luxury Delivery Packages / Fashion Bags -->
          <!-- Gift Box -->
          <rect x="12" y="24" width="12" height="10" rx="1.5" fill="#e11d48" stroke="#9f1239" stroke-width="0.8"/>
          <line x1="12" y1="29" x2="24" y2="29" stroke="url(#popGoldGrad)" stroke-width="1.2"/>
          <line x1="18" y1="24" x2="18" y2="34" stroke="url(#popGoldGrad)" stroke-width="1.2"/>
          <!-- Shopping Bag -->
          <rect x="18" y="19" width="16" height="15" rx="2" fill="url(#popGoldGrad)" stroke="#8c6a28" stroke-width="0.8"/>
          <!-- Bag handles -->
          <path d="M22,19 C22,14 30,14 30,19" stroke="#78350f" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          <!-- Bag ribbon -->
          <line x1="18" y1="25" x2="34" y2="25" stroke="#ffffff" stroke-width="1"/>
          <circle cx="26" cy="25" r="1.2" fill="#ffffff"/>
          <!-- Luxury Bag Label -->
          <text x="26" y="30" font-size="5.5" font-weight="900" fill="#0f172a" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" letter-spacing="0.5">SHOP</text>

          <!-- 7. Iconic Scooter Bodywork (Vespa / Scoopy Silhouette) -->
          <!-- Rear engine cowl (bulbous retro curve) -->
          <path d="M14,49 C10,43 14,35 24,35 L40,35 C42,40 40,49 32,51 C24,53 16,53 14,49 Z" fill="url(#popBodyGrad)"/>
          <!-- Specular gloss highlight on rear cowl -->
          <path d="M18,37 C22,36 32,36 36,38" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.35" fill="none"/>
          <!-- Cowl chrome air vents -->
          <line x1="24" y1="42" x2="32" y2="42" stroke="url(#popChromeGrad)" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="26" y1="45" x2="33" y2="45" stroke="url(#popChromeGrad)" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="28" y1="48" x2="33" y2="48" stroke="url(#popChromeGrad)" stroke-width="1.2" stroke-linecap="round"/>

          <!-- Floorboard -->
          <path d="M38,50 L64,50 C66,50 67,48 65,46 L42,46 Z" fill="#0f172a"/>
          <!-- Rubber grip ribs on floorboard -->
          <line x1="44" y1="48" x2="60" y2="48" stroke="#475569" stroke-width="1.2" stroke-linecap="round"/>

          <!-- Front Leg Shield / Apron (Sweeping curve) -->
          <path d="M60,49 C64,48 63,38 72,25 C74,22 79,22 81,25 L80,32 C74,42 70,49 60,49 Z" fill="url(#popBodyGrad)"/>
          <!-- Chrome edge beading on front apron -->
          <path d="M62,49 C66,47 65,37 74,24 C76,21 80,21 82,24" stroke="url(#popChromeGrad)" stroke-width="1.4" stroke-linecap="round" fill="none"/>
          <!-- Center Horn Grille & Emblem (Signature Vespa / Scoopy Tie) -->
          <path d="M72,27 L74,38 L76,38 L76,27 Z" fill="url(#popChromeGrad)"/>
          <circle cx="74" cy="30" r="1.5" fill="#d4af37"/>

          <!-- Front Mudguard / Fender -->
          <path d="M74,47 C74,41 84,39 92,43 C94,45 94,48 92,48 C85,46 78,46 74,47 Z" fill="url(#popBodyGrad)"/>
          <path d="M78,42 C84,40 90,42 92,44" stroke="#ffffff" stroke-width="0.8" opacity="0.4" fill="none"/>
          <!-- Front suspension chrome trailing link fork -->
          <path d="M84,49 L80,38 L83,38" stroke="url(#popChromeGrad)" stroke-width="2" stroke-linecap="round" fill="none"/>

          <!-- 8. Premium Cognac Leather Saddle -->
          <path d="M28,35 C28,32 34,31 46,31 C54,31 56,33 55,36 C48,37 36,37 28,35 Z" fill="url(#popSeatGrad)"/>
          <!-- Seat cream stitching accent -->
          <path d="M30,34 C36,33 46,33 53,34" stroke="#faeed4" stroke-width="0.8" stroke-dasharray="1.5 1" fill="none" opacity="0.8"/>
          <!-- Seat chrome trim badge -->
          <circle cx="29" cy="35" r="0.8" fill="url(#popChromeGrad)"/>

          <!-- 9. Handlebars, Headlight & Retro Chrome Mirror -->
          <!-- Steering stem -->
          <path d="M78,25 L76,19" stroke="url(#popChromeGrad)" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Handlebar grip -->
          <path d="M72,19 L78,19" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
          <!-- Brake lever -->
          <path d="M74,21 L79,21" stroke="url(#popChromeGrad)" stroke-width="1.2" stroke-linecap="round"/>
          <!-- Retro Round Chrome Mirror -->
          <path d="M75,19 Q72,15 72,12" stroke="url(#popChromeGrad)" stroke-width="1.2" fill="none"/>
          <circle cx="72" cy="11" r="3" fill="url(#popChromeGrad)"/>
          <circle cx="72" cy="11" r="2.2" fill="#38bdf8" opacity="0.8"/>
          <line x1="71" y1="10" x2="73" y2="12" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round"/>

          <!-- Iconic Round LED Projector Headlight -->
          <circle cx="85" cy="24" r="5" fill="url(#popChromeGrad)"/>
          <circle cx="85" cy="24" r="4" fill="#0f172a"/>
          <!-- Inner luminous halo ring -->
          <circle cx="85" cy="24" r="3.2" stroke="#fef08a" stroke-width="1" fill="#fffbeb"/>
          <circle cx="85.5" cy="24" r="1.5" fill="#ffffff"/>

          <!-- 10. The Stylish Rider -->
          <!-- Torso & Bomber Jacket -->
          <path d="M38,34 L43,21 L53,20 L57,26 L51,35 Z" fill="#0f172a"/>
          <!-- Jacket Gold Zipper -->
          <line x1="48" y1="21" x2="52" y2="34" stroke="url(#popGoldGrad)" stroke-width="1"/>
          <!-- Arm holding handlebar -->
          <path d="M48,22 Q60,20 74,19" stroke="#1e293b" stroke-width="3.6" stroke-linecap="round" fill="none"/>
          <!-- Rider glove -->
          <circle cx="73" cy="19" r="2" fill="#92400e"/>

          <!-- Cafe Racer Open-Face Helmet -->
          <circle cx="47" cy="14" r="7.5" fill="#0f172a"/>
          <!-- Helmet racing stripe in gold -->
          <path d="M41,12 C44,9 50,9 53,12" stroke="url(#popGoldGrad)" stroke-width="2" fill="none"/>
          <!-- Aviator Pilot Goggles / Sunglasses -->
          <path d="M47,13 C50,13 53,14 53,16 C53,18 49,18 47,18 Z" fill="#0284c7" stroke="url(#popChromeGrad)" stroke-width="0.8"/>
          <line x1="48" y1="14" x2="52" y2="16" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round"/>
          <!-- Helmet chrome trim rim -->
          <path d="M41,16 C43,20 48,21 52,19" stroke="url(#popChromeGrad)" stroke-width="1" fill="none"/>

          <!-- Crimson Silk Fluttering Scarf -->
          <path d="M43,20 Q36,18 31,21 Q25,23 20,20 Q27,24 35,22 Q41,22 44,21" fill="#e11d48" class="moto-flutter"/>

          <!-- 11. Multi-Spoke Turbine Chrome Alloy Wheels with High-Visibility Whitewall Tires -->
          <!-- REAR WHEEL (Center: 24, 44) -->
          <g class="moto-wheel back-wheel" id="motoBackWheel">
            <!-- Outer tire rubber tread -->
            <circle cx="24" cy="44" r="12" fill="#090d16" stroke="#475569" stroke-width="1.2"/>
            <!-- Tire tread grip grooves -->
            <circle cx="24" cy="44" r="11" stroke="#334155" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/>
            <!-- ICONIC WHITEWALL TIRE (Pop & High Visibility!) -->
            <circle cx="24" cy="44" r="9.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
            <!-- Inner Chrome Rim Lip -->
            <circle cx="24" cy="44" r="7.5" fill="#0f172a" stroke="url(#popChromeGrad)" stroke-width="2"/>
            <!-- Drilled Brake Rotor -->
            <circle cx="24" cy="44" r="5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
            <!-- Red Brake Caliper -->
            <rect x="27" y="39" width="3.5" height="4.5" rx="1" fill="#e11d48"/>
            <!-- 6 High-Contrast Chrome Turbine Alloy Spokes -->
            <line x1="24" y1="36.5" x2="24" y2="51.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="17.5" y1="40.2" x2="30.5" y2="47.8" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="17.5" y1="47.8" x2="30.5" y2="40.2" stroke="#ffffff" stroke-width="1.8"/>
            <!-- Center Chrome & Gold Hub Cap -->
            <circle cx="24" cy="44" r="2.8" fill="url(#popChromeGrad)"/>
            <circle cx="24" cy="44" r="1.3" fill="#d4af37"/>
          </g>

          <!-- FRONT WHEEL (Center: 86, 44) -->
          <g class="moto-wheel front-wheel" id="motoFrontWheel">
            <!-- Outer tire rubber tread -->
            <circle cx="86" cy="44" r="12" fill="#090d16" stroke="#475569" stroke-width="1.2"/>
            <!-- Tire tread grip grooves -->
            <circle cx="86" cy="44" r="11" stroke="#334155" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/>
            <!-- ICONIC WHITEWALL TIRE (Pop & High Visibility!) -->
            <circle cx="86" cy="44" r="9.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
            <!-- Inner Chrome Rim Lip -->
            <circle cx="86" cy="44" r="7.5" fill="#0f172a" stroke="url(#popChromeGrad)" stroke-width="2"/>
            <!-- Drilled Brake Rotor -->
            <circle cx="86" cy="44" r="5" fill="#334155" stroke="#94a3b8" stroke-width="0.8"/>
            <!-- Red Brake Caliper -->
            <rect x="89" y="39" width="3.5" height="4.5" rx="1" fill="#e11d48"/>
            <!-- 6 High-Contrast Chrome Turbine Alloy Spokes -->
            <line x1="86" y1="36.5" x2="86" y2="51.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="79.5" y1="40.2" x2="92.5" y2="47.8" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="79.5" y1="47.8" x2="92.5" y2="40.2" stroke="#ffffff" stroke-width="1.8"/>
            <!-- Center Chrome & Gold Hub Cap -->
            <circle cx="86" cy="44" r="2.8" fill="url(#popChromeGrad)"/>
            <circle cx="86" cy="44" r="1.3" fill="#d4af37"/>
          </g>
        </svg>
      </div>
    </div>
  `;

  document.body.appendChild(track);

  const motoEl = document.getElementById('scrollMoto');
  const vehicleEl = document.getElementById('scrollMotoVehicle');
  const progressBar = document.getElementById('scrollMotoProgress');
  const bubbleText = document.getElementById('scrollMotoText');
  const frontWheel = track.querySelector('#motoFrontWheel');
  const backWheel = track.querySelector('#motoBackWheel');

  let currentX = 0;
  let targetX = 0;
  let wheelAngle = 0;
  let isMoving = false;
  let moveTimeout = null;
  let facingRight = true;

  function updateTarget() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;

    if (maxScroll <= 20) {
      track.style.opacity = '0';
      return;
    } else {
      track.style.opacity = '1';
    }

    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    const motoWidth = motoEl.offsetWidth || 120;
    const screenWidth = window.innerWidth;
    const maxTravel = Math.max(screenWidth - motoWidth - 16, 0);

    targetX = progress * maxTravel;

    if (progressBar) {
      progressBar.style.width = (progress * 100).toFixed(1) + '%';
    }
    if (bubbleText) {
      const pct = Math.round(progress * 100);
      bubbleText.innerHTML = pct >= 99 ? '🛍️ Arrived! Happy Shopping 🎉' : `🛵 VIP Delivery · <strong>${pct}%</strong>`;
    }
  }

  function loop() {
    const diff = targetX - currentX;
    const absDiff = Math.abs(diff);

    if (absDiff > 0.25) {
      currentX += diff * 0.12;
      wheelAngle += diff * 3.2;

      if (diff > 0.6 && !facingRight) {
        facingRight = true;
        vehicleEl.style.transform = 'scaleX(1)';
      } else if (diff < -0.6 && facingRight) {
        facingRight = false;
        vehicleEl.style.transform = 'scaleX(-1)';
      }

      // Native SVG rotation around absolute axle centers (24, 44) & (86, 44)
      if (frontWheel && backWheel) {
        const deg = (wheelAngle % 360).toFixed(1);
        frontWheel.setAttribute('transform', `rotate(${deg} 86 44)`);
        backWheel.setAttribute('transform', `rotate(${deg} 24 44)`);
      }

      motoEl.style.transform = `translate3d(${currentX}px, 0, 0)`;

      if (!isMoving) {
        isMoving = true;
        motoEl.classList.add('is-moving');
      }

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
        motoEl.classList.remove('is-moving');
      }, 150);
    } else if (absDiff > 0.01) {
      currentX = targetX;
      motoEl.style.transform = `translate3d(${currentX}px, 0, 0)`;
      if (isMoving) {
        isMoving = false;
        motoEl.classList.remove('is-moving');
      }
    }

    requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('resize', updateTarget, { passive: true });
  updateTarget();
  requestAnimationFrame(loop);

  motoEl.addEventListener('click', (e) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof toast === 'function') {
      toast('Pip pip! Riding back to top! 🛵💨', 'default', 1800);
    }
  });
}

/* ── Telegram Order Receipt Service ───────────────────────── */
const TelegramReceipt = {
  BOT_TOKEN: '8914044934:AAHYn5I5loQlw7L0CQv-TNbU5I8GdIkq2w8',
  CHAT_ID: '8039165243',
  BOT_USERNAME: 'ClothingOnlineShop_bot',

  async sendOrder(orderData) {
    if (!orderData) return false;

    // 1. Try sending via Backend API first
    try {
      if (typeof api !== 'undefined' && api.postPublic) {
        const res = await api.postPublic('/telegram/send-receipt', orderData);
        if (res && res.ok) {
          console.log('Telegram order receipt delivered via API.');
          return true;
        }
      }
    } catch (e) {
      console.warn('Backend Telegram send failed, trying direct Telegram API:', e);
    }

    // 2. Direct fallback to Telegram Bot API
    try {
      const text = this.formatReceipt(orderData);
      const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.CHAT_ID,
          text: text,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        console.log('Telegram order receipt delivered directly to Telegram.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Direct Telegram send error:', err);
      return false;
    }
  },

  formatReceipt(o) {
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const orderId = esc(o.id || o.order_number || o.num || ('CS-' + Date.now()));
    const date = esc(o.date || new Date().toLocaleString());
    const name = esc(o.name || o.customer?.name || 'Valued Customer');
    const phone = esc(o.phone || o.customer?.phone || 'N/A');
    const address = esc(o.address || o.customer?.address || 'Phnom Penh, Cambodia');
    const payment = esc(o.payment || 'Bakong KHQR (Huonneng Nim)');
    const status = esc(o.status || 'Processing');
    const totalUsd = Number(o.total || 0).toFixed(2);
    const totalKhr = Math.round(Number(o.total || 0) * 4100).toLocaleString('km-KH');

    let itemsText = '';
    const items = o.items || o.products || [];
    if (items.length) {
      items.forEach(it => {
        const itemName = esc(it.name || 'Item');
        const qty = it.qty || 1;
        const price = Number(it.sale_price || it.price || 0).toFixed(2);
        const sub = (price * qty).toFixed(2);
        const size = it.size ? ` · Size: ${esc(it.size)}` : '';
        const color = it.color ? ` · ${esc(it.color)}` : '';
        itemsText += `• <b>${itemName}</b>${size}${color}\n   ${qty} × $${price} = <b>$${sub}</b>\n`;
      });
    } else {
      itemsText = `• Apparel Items — <b>$${totalUsd}</b>\n`;
    }

    const payIcon = payment.toLowerCase().includes('bakong') ? '🇰🇭' : '💵';
    const statusIcon = (status.toLowerCase().includes('paid') || payment.toLowerCase().includes('bakong')) ? '✅' : '⏳';

    return `🛍️ <b>NEW ORDER RECEIPT — FASHION STORE</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Order ID:</b> <code>#${orderId}</code>\n` +
      `📅 <b>Date:</b> ${date}\n` +
      `👤 <b>Customer:</b> ${name}\n` +
      `📞 <b>Phone:</b> <code>${phone}</code>\n` +
      `📍 <b>Shipping Address:</b> ${address}\n\n` +
      `🛒 <b>PURCHASED ITEMS:</b>\n` +
      itemsText +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 <b>Subtotal:</b> $${totalUsd}\n` +
      `🚚 <b>Shipping:</b> <b>FREE (Express Delivery)</b>\n` +
      `💰 <b>TOTAL PAID:</b> <b>$${totalUsd} USD</b>\n` +
      `🇰🇭 <b>In Riel:</b> <b>${totalKhr} ៛</b>\n` +
      `${payIcon} <b>Payment:</b> ${payment}\n` +
      `${statusIcon} <b>Order Status:</b> <b>${status}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ <i>Thank you for your purchase with Fashion Store!</i>\n` +
      `🤖 <b>Bot:</b> @${this.BOT_USERNAME}`;
  }
};

/* ══════════════════════════════════════════════════════════════
   TOP PROGRESS BAR & SITE PRELOADER CONTROLLER
   ══════════════════════════════════════════════════════════════ */
const TopLoader = {
  el: null,
  progress: 0,
  timer: null,

  init() {
    if (this.el || typeof document === 'undefined') return;
    let bar = document.getElementById('top-progress-bar');
    if (!bar && document.body) {
      bar = document.createElement('div');
      bar.id = 'top-progress-bar';
      bar.className = 'top-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<div class="top-progress-glow"></div>';
      document.body.prepend(bar);
    }
    this.el = bar;
  },

  start() {
    this.init();
    if (!this.el) return;
    this.progress = 14;
    this.el.classList.remove('done');
    this.el.classList.add('active');
    this.el.style.width = '14%';

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.progress < 85) {
        const step = Math.max((85 - this.progress) * 0.12, 1.2);
        this.progress += step;
        this.el.style.width = `${Math.min(this.progress, 85)}%`;
      }
    }, 180);
  },

  set(pct) {
    this.init();
    if (!this.el) return;
    this.progress = Math.min(Math.max(pct, 0), 100);
    this.el.style.width = `${this.progress}%`;
  },

  done() {
    if (!this.el) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.progress = 100;
    this.el.style.width = '100%';
    setTimeout(() => {
      if (this.el) {
        this.el.classList.add('done');
        setTimeout(() => {
          if (this.el) {
            this.el.classList.remove('active', 'done');
            this.el.style.width = '0%';
          }
        }, 320);
      }
    }, 180);
  }
};

const SitePreloader = {
  el: null,
  slowTimer: null,
  maxTimer: null,

  init() {
    if (typeof document === 'undefined') return;
    this.el = document.getElementById('site-preloader');
    if (!this.el && document.body) {
      const div = document.createElement('div');
      div.id = 'site-preloader';
      div.className = 'site-preloader';
      div.innerHTML = `
        <div class="preloader-content">
          <div class="preloader-crest">
            <div class="preloader-ring preloader-ring-outer"></div>
            <div class="preloader-ring preloader-ring-inner"></div>
            <div class="preloader-symbol">✦</div>
          </div>
          <div class="preloader-brand">FASHION STORE</div>
          <div class="preloader-sub">Phnom Penh Atelier · Summer 2026</div>
          <div class="preloader-track"><div class="preloader-bar"></div></div>
          <div class="preloader-status" id="preloader-status">Curating your experience...</div>
          <div class="preloader-slow-hint" id="preloader-slow-hint" style="display:none">
            <span>⚡</span> Slow connection detected. Loading high-definition styles...
          </div>
        </div>
      `;
      document.body.prepend(div);
      this.el = div;
    }

    // Slow connection detection (e.g. takes > 2.0s)
    this.slowTimer = setTimeout(() => {
      const hint = document.getElementById('preloader-slow-hint');
      const status = document.getElementById('preloader-status');
      if (hint && this.el && !this.el.classList.contains('fade-out')) {
        hint.style.display = 'inline-flex';
      }
      if (status && this.el && !this.el.classList.contains('fade-out')) {
        status.textContent = 'Connecting to Phnom Penh atelier server... ⏳';
      }
    }, 2000);

    // Guaranteed safety timeout (never lock the screen)
    this.maxTimer = setTimeout(() => {
      this.hide();
    }, 3200);

    if (document.readyState === 'complete') {
      setTimeout(() => this.hide(), 120);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.hide(), 150);
      }, { once: true });
    }
  },

  hide() {
    if (this.slowTimer) clearTimeout(this.slowTimer);
    if (this.maxTimer) clearTimeout(this.maxTimer);
    if (!this.el) return;
    this.el.classList.add('fade-out');
    setTimeout(() => {
      if (this.el && this.el.parentNode) {
        this.el.style.display = 'none';
      }
    }, 480);
  }
};

// Auto-bootstrap loaders
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      TopLoader.init();
      SitePreloader.init();
    });
  } else {
    TopLoader.init();
    SitePreloader.init();
  }
}



