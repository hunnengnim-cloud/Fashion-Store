import React, { useEffect, useState } from 'react';
import {
  addToCart,
  api,
  formatKHR,
  formatUSD,
  getLang,
  getOrders,
  getUser,
  isAdminUser,
  notify,
  saveCart,
  saveOrders,
  saveWishlist,
} from '../lib/store';
import { STOREFRONT_T } from '../lib/storefrontTranslations';
import { BagIcon, HeartIcon } from './Icons';

/* ── 1. Search Modal ─────────────────────────────────────── */
export function SearchModal({ open, products, onClose, onSelectProduct, lang: propLang }) {
  const lang = propLang || getLang();
  const t = STOREFRONT_T[lang]?.searchModal || STOREFRONT_T.km.searchModal;
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const visibleCatalog = products.filter((p) => !p.status || p.status === 'active' || p.status === 'out_of_stock');
  const matches = q
    ? visibleCatalog.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.cat?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
    : visibleCatalog.slice(0, 8);

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 18 }}>{t.title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <input
            type="search"
            className="form-control"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            style={{ marginBottom: 16 }}
          />
          {!matches.length ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🔎</div>
              <div style={{ fontWeight: 600 }}>{t.noResults}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {matches.map((p) => {
                const pid = p.id ?? p.sku;
                return (
                  <div
                    key={pid}
                    className="search-result-item"
                    onClick={() => {
                      onClose();
                      onSelectProduct(p);
                    }}
                  >
                    <img src={p.image} alt={p.name} className="search-result-img" />
                    <div className="search-result-info">
                      <div className="search-result-brand">
                        {p.brand || 'Fashion Store KH'} · {p.cat || p.category}
                      </div>
                      <div className="search-result-title">{p.name}</div>
                      <div className="search-result-price">
                        {formatUSD(p.sale_price || p.price)}{' '}
                        {p.sale_price ? (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatUSD(p.price)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, 1, p.sizes?.[0] || 'M', p.colors?.[0] || 'Default');
                        notify(lang === 'km' ? `បានបន្ថែម "${p.name}" ទៅក្នុងកន្ត្រក! 🛍` : `Added "${p.name}" to your bag! 🛍`, 'success', 2400);
                        onClose();
                      }}
                    >
                      + {lang === 'km' ? 'បន្ថែម' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Category & Color Helpers for Luxury Quick View ───────── */
function getCatLabel(cat, lang) {
  if (!cat) return '';
  if (lang !== 'km') return cat;
  const c = String(cat).toLowerCase().trim();
  if (c.includes("women") || c.includes("នារី")) return 'នារី';
  if (c.includes("men") || c.includes("បុរស")) return 'បុរស';
  if (c.includes("kid") || c.includes("កុមារ")) return 'កុមារ';
  if (c.includes("shoe") || c.includes("ស្បែកជើង")) return 'ស្បែកជើង';
  if (c.includes("accessor") || c.includes("តុបតែង")) return 'គ្រឿងតុបតែង';
  if (c.includes("dress") || c.includes("រ៉ូប")) return 'រ៉ូបនារី';
  if (c.includes("shirt") || c.includes("អាវ")) return 'អាវ';
  if (c.includes("jacket") || c.includes("អាវធំ")) return 'អាវក្រៅ';
  return cat;
}

function getColorLabel(col, lang) {
  if (!col) return '';
  if (lang !== 'km') return col;
  const c = String(col).toLowerCase().trim();
  const map = {
    'sunshine yellow': 'ពណ៌លឿងថ្ងៃ',
    'yellow': 'ពណ៌លឿង',
    'lavender': 'ពណ៌ស្វាយឡាវេនឌ័រ',
    'coral': 'ពណ៌ផ្កាថ្ម',
    'black': 'ពណ៌ខ្មៅ',
    'white': 'ពណ៌ស',
    'beige': 'ពណ៌បន៍ត្នោត',
    'navy': 'ពណ៌ខៀវចាស់',
    'red': 'ពណ៌ក្រហម',
    'blue': 'ពណ៌ខៀវ',
    'green': 'ពណ៌បៃតង',
    'pink': 'ពណ៌ផ្កាឈូក',
    'gold': 'ពណ៌មាស',
    'silver': 'ពណ៌ប្រាក់',
    'tortoise': 'ពណ៌ស្នូកអណ្ដើក',
    'glossy black': 'ពណ៌ខ្មៅរលោង',
    'amber': 'ពណ៌អំពិល',
    'default': 'ស្តង់ដារ',
    'olive': 'ពណ៌អូលីវ',
    'denim': 'ពណ៌ខូវប៊យ',
    'charcoal': 'ពណ៌ធ្យូង',
    'grey': 'ពណ៌ប្រផេះ',
    'gray': 'ពណ៌ប្រផេះ',
    'brown': 'ពណ៌ត្នោត',
    'cream': 'ពណ៌ក្រែម',
  };
  return map[c] || col;
}

function getColorHex(col) {
  if (!col) return '#c5a059';
  const c = String(col).toLowerCase().trim();
  const hexMap = {
    'sunshine yellow': '#eab308',
    'yellow': '#eab308',
    'lavender': '#a855f7',
    'coral': '#fb7185',
    'black': '#18181b',
    'white': '#ffffff',
    'beige': '#e6d5c3',
    'navy': '#1e3a8a',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'pink': '#ec4899',
    'gold': '#d4af37',
    'silver': '#94a3b8',
    'tortoise': '#78350f',
    'glossy black': '#09090b',
    'amber': '#d97706',
    'olive': '#65a30d',
    'denim': '#2563eb',
    'charcoal': '#374151',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'brown': '#854d0e',
    'cream': '#fef3c7',
  };
  return hexMap[c] || '#c5a059';
}

/* ── 2. Quick View Modal ─────────────────────────────────── */
export function QuickViewModal({ product, isWishlisted, onToggleWishlist, onClose, lang: propLang }) {
  const lang = propLang || getLang();
  const t = STOREFRONT_T[lang]?.quickViewModal || STOREFRONT_T.km.quickViewModal;
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Default');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSize(product.sizes?.[0] || 'M');
      setColor(product.colors?.[0] || 'Default');
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const activePrice = product.sale_price || product.price;
  const sizes = product.sizes?.length ? product.sizes : ['S', 'M', 'L'];
  const colors = product.colors?.length ? product.colors : ['Black', 'White', 'Beige'];

  return (
    <div
      className="modal-overlay open qv-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal-lg qv-modal-card">
        {/* Sleek Minimalist Header */}
        <div className="qv-modal-header">
          <div className="qv-header-tag-pill">
            <span className="qv-sparkle">✨</span>
            <span className="qv-header-tag">{lang === 'km' ? 'ព័ត៌មានលម្អិតរហ័ស' : 'QUICK VIEW'}</span>
            <span className="qv-header-tag-dot">•</span>
            <span className="qv-header-brand">{product.brand || 'Fashion Store KH'}</span>
          </div>
          <button type="button" className="qv-close-btn" onClick={onClose} aria-label={lang === 'km' ? 'បិទ' : 'Close'}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body qv-modal-body">
          <div className="qv-grid">
            {/* Left Image Showcase */}
            <div className="qv-gallery-col">
              <div className="qv-img-frame">
                <img src={product.image} alt={product.name} className="qv-img-luxury" />
                {product.sale_price ? (
                  <span className="qv-sale-ribbon">
                    🔥 {lang === 'km' ? 'បញ្ចុះតម្លៃពិសេស' : 'SPECIAL SALE'}
                  </span>
                ) : null}
                <div className="qv-sku-chip">
                  <span>SKU: {product.sku || 'CS-FSH-001'}</span>
                </div>
              </div>
            </div>

            {/* Right Details */}
            <div className="qv-info-col">
              <div className="qv-info-scroll-wrap">
                <div className="qv-brand-row">
                  <span className="qv-brand-capsule">
                    🏷️ {product.brand || 'Fashion Store KH'}
                  </span>
                  {(product.cat || product.category) && (
                    <span className="qv-cat-capsule">
                      {getCatLabel(product.cat || product.category, lang)}
                    </span>
                  )}
                </div>

                <h2 className="qv-product-title">{product.name}</h2>

                {/* Rating & Reviews */}
                <div className="qv-rating-row">
                  <span className="qv-stars">★★★★★</span>
                  <span className="qv-rating-num">{product.rating || '4.9'}</span>
                  <span className="qv-review-count">
                    ({product.reviews || 38} {lang === 'km' ? 'មតិយោបល់អតិថិជន' : 'customer reviews'})
                  </span>
                </div>

                {/* Pricing Box */}
                <div className="qv-pricing-card">
                  <div className="qv-price-usd-row">
                    <span className="qv-price-usd">{formatUSD(activePrice)}</span>
                    {product.sale_price ? (
                      <span className="qv-price-original">{formatUSD(product.price)}</span>
                    ) : null}
                    {product.sale_price ? (
                      <span className="qv-discount-pill">
                        -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                      </span>
                    ) : null}
                  </div>
                  <div className="qv-price-khr-pill">
                    <span>🇰🇭</span> <strong>{formatKHR(activePrice)}</strong>
                  </div>
                </div>

                {/* Description */}
                <p className="qv-description">
                  {product.desc || product.description || ''}
                </p>

                {/* Size Selector */}
                <div className="qv-selector-block">
                  <div className="qv-selector-header">
                    <span className="qv-selector-label">{lang === 'km' ? 'ជ្រើសរើសទំហំ' : 'SELECT SIZE'}:</span>
                    <strong className="qv-selector-current">{size}</strong>
                  </div>
                  <div className="qv-pills-row">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`qv-pill-choice ${size === s ? 'is-active' : ''}`}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector with Visual Color Dots */}
                <div className="qv-selector-block">
                  <div className="qv-selector-header">
                    <span className="qv-selector-label">{lang === 'km' ? 'ពណ៌' : 'COLOR'}:</span>
                    <strong className="qv-selector-current">{getColorLabel(color, lang)}</strong>
                  </div>
                  <div className="qv-pills-row">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`qv-pill-choice ${color === c ? 'is-active' : ''}`}
                        onClick={() => setColor(c)}
                      >
                        <span className="qv-color-dot" style={{ backgroundColor: getColorHex(c) }} />
                        <span>{getColorLabel(c, lang)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="qv-footer-wrap">
                <div className="qv-action-buttons-row">
                  {/* Quantity Stepper */}
                  <div className="qv-qty-pill">
                    <button
                      type="button"
                      className="qv-qty-step-btn"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qv-qty-display">{qty}</span>
                    <button
                      type="button"
                      className="qv-qty-step-btn"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Bag Button */}
                  <button
                    type="button"
                    className="qv-add-bag-pill"
                    onClick={() => {
                      addToCart(product, qty, size, color);
                      notify(
                        lang === 'km'
                          ? `បានបន្ថែម ${qty}x "${product.name}" (${size}) ចូលកន្ត្រក! 🛍`
                          : `Added ${qty}x "${product.name}" (${size}) to your bag! 🛍`,
                        'success',
                        2600
                      );
                      onClose();
                    }}
                  >
                    <BagIcon size={18} />
                    <span>{lang === 'km' ? 'ដាក់ចូលកន្ត្រក' : 'ADD TO BAG'}</span>
                  </button>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    className={`qv-wishlist-pill ${isWishlisted ? 'is-active' : ''}`}
                    onClick={() => onToggleWishlist(product)}
                    title={lang === 'km' ? 'បញ្ជីប្រាថ្នា' : 'Wishlist'}
                    aria-label={lang === 'km' ? 'បញ្ជីប្រាថ្នា' : 'Wishlist'}
                  >
                    <HeartIcon size={20} filled={isWishlisted} />
                  </button>
                </div>

                {/* Trust Perks Row */}
                <div className="qv-perks-row">
                  <span className="qv-perk-badge">🚀 {lang === 'km' ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ > $50' : 'Free delivery > $50'}</span>
                  <span className="qv-perk-badge">🔄 {lang === 'km' ? 'ប្ដូរទំនិញក្នុង ៣០ ថ្ងៃ' : '30-Day Returns'}</span>
                  <span className="qv-perk-badge">🇰🇭 {lang === 'km' ? 'Bakong KHQR & COD' : 'Bakong & COD'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Cart Drawer ──────────────────────────────────────── */
export function CartDrawer({ open, items, onClose, onCheckout, lang: propLang }) {
  const lang = propLang || getLang();
  const t = STOREFRONT_T[lang]?.cartModal || STOREFRONT_T.km.cartModal;
  if (!open) return null;

  const subtotal = items.reduce((sum, i) => sum + Number(i.sale_price || i.price || 0) * (i.qty || 1), 0);
  const totalItemCount = items.reduce((s, i) => s + (i.qty || 1), 0);
  const freeShippingThreshold = 50;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : (items.length > 0 ? 2.5 : 0);
  const finalTotal = subtotal + shippingFee;

  const changeQty = (idx, delta) => {
    const next = [...items];
    const q = (next[idx].qty || 1) + delta;
    if (q <= 0) next.splice(idx, 1);
    else next[idx] = { ...next[idx], qty: q };
    saveCart(next);
  };

  return (
    <div
      className="drawer-overlay open luxury-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer open luxury-cart-drawer">
        {/* Luxury Header */}
        <div className="drawer-header luxury-cart-header">
          <div className="luxury-cart-title-wrap">
            <span className="luxury-cart-icon">🛍️</span>
            <div>
              <h3 className="luxury-cart-title">{t.title}</h3>
              <span className="luxury-cart-count-badge">
                {totalItemCount} {lang === 'km' ? 'មុខទំនិញ' : (totalItemCount === 1 ? 'item' : 'items')}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="luxury-drawer-close-btn"
            onClick={onClose}
            aria-label="Close cart drawer"
          >
            ✕
          </button>
        </div>

        {/* Luxury Free Shipping Milestone Banner */}
        <div className="luxury-shipping-meter">
          <div className="luxury-shipping-meter-head">
            <span className="luxury-shipping-icon">{remaining > 0 ? '🚚' : '🎉'}</span>
            <span className="luxury-shipping-text">
              {remaining > 0
                ? (lang === 'km' ? `បន្ថែម ${formatUSD(remaining)} ទៀត ដើម្បីទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ!` : `Add ${formatUSD(remaining)} more for FREE Express Shipping!`)
                : (lang === 'km' ? 'ទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃទូទាំងប្រទេស! 🎉' : 'Unlocked FREE Express Shipping! 🎉')}
            </span>
          </div>
          <div className="luxury-shipping-progress-track">
            <div
              className={`luxury-shipping-progress-fill ${progress >= 100 ? 'is-complete' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Drawer Body with Luxury Item Cards */}
        <div className="drawer-body luxury-cart-body">
          {!items.length ? (
            <div className="luxury-cart-empty">
              <div className="luxury-cart-empty-icon">🛍️</div>
              <div className="luxury-cart-empty-title">{t.emptyTitle}</div>
              <div className="luxury-cart-empty-sub">{t.emptySub}</div>
              <button type="button" className="luxury-cart-empty-shop-btn" onClick={onClose}>
                {lang === 'km' ? 'ចាប់ផ្តើមទិញទំនិញឥឡូវនេះ ✨' : 'Explore Collections ✨'}
              </button>
            </div>
          ) : (
            <>
              <div className="luxury-cart-items-list">
                {items.map((item, idx) => {
                  const unitPrice = Number(item.sale_price || item.price || 0);
                  const itemTotal = unitPrice * (item.qty || 1);
                  return (
                    <div key={`${item.id}-${item.size}-${item.color}-${idx}`} className="luxury-cart-item-card">
                      <div className="luxury-cart-item-media">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="luxury-cart-item-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80';
                          }}
                        />
                      </div>
                      <div className="luxury-cart-item-content">
                        <div className="luxury-cart-item-top">
                          <div className="luxury-cart-item-title" title={item.name}>{item.name}</div>
                          <button
                            type="button"
                            className="luxury-cart-item-remove-btn"
                            onClick={() => changeQty(idx, -999)}
                            title={lang === 'km' ? 'លុបចេញ' : 'Remove'}
                            aria-label={lang === 'km' ? 'លុបចេញ' : 'Remove'}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="luxury-cart-item-meta-strip">
                          {item.size && (
                            <span className="luxury-cart-chip">
                              {lang === 'km' ? 'ទំហំ' : 'Size'}: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="luxury-cart-chip">
                              {item.color}
                            </span>
                          )}
                        </div>

                        <div className="luxury-cart-item-bottom">
                          <div className="luxury-cart-item-price-wrap">
                            <span className="luxury-cart-item-price">{formatUSD(itemTotal)}</span>
                            {(item.qty || 1) > 1 && (
                              <span className="luxury-cart-item-unit-price">
                                ({formatUSD(unitPrice)} / {lang === 'km' ? 'មួយ' : 'ea'})
                              </span>
                            )}
                          </div>

                          <div className="luxury-qty-stepper">
                            <button
                              type="button"
                              className="luxury-qty-btn"
                              onClick={() => changeQty(idx, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="luxury-qty-val">{item.qty || 1}</span>
                            <button
                              type="button"
                              className="luxury-qty-btn"
                              onClick={() => changeQty(idx, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Luxury Storefront Trust Highlights (Fills whitespace gorgeously) */}
              <div className="luxury-cart-perks-box">
                <div className="luxury-cart-perk-row">
                  <span className="luxury-cart-perk-icon">⚡</span>
                  <div className="luxury-cart-perk-info">
                    <strong>{lang === 'km' ? 'ដឹកជញ្ជូនរហ័ស 24 ម៉ោង' : 'Express Delivery'}</strong>
                    <p>{lang === 'km' ? 'ដឹកជូនដល់ផ្ទះទូទាំង 25 ខេត្ត/ក្រុង' : 'Fast door-to-door shipping in Cambodia'}</p>
                  </div>
                </div>
                <div className="luxury-cart-perk-row">
                  <span className="luxury-cart-perk-icon">🛡️</span>
                  <div className="luxury-cart-perk-info">
                    <strong>{lang === 'km' ? 'ការទូទាត់សុវត្ថិភាព 100%' : '100% Safe Payments'}</strong>
                    <p>{lang === 'km' ? 'KHQR · Visa / Master · COD' : 'KHQR · Visa / Master · COD'}</p>
                  </div>
                </div>
                <div className="luxury-cart-perk-row">
                  <span className="luxury-cart-perk-icon">✨</span>
                  <div className="luxury-cart-perk-info">
                    <strong>{lang === 'km' ? 'ទំនិញគុណភាពពិត 100%' : 'Authentic Premium Quality'}</strong>
                    <p>{lang === 'km' ? 'ប្តូរទំហំដោយមិនគិតថ្លៃក្នុង 7 ថ្ងៃ' : 'Easy 7-day size exchange guarantee'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Luxury Footer & Checkout */}
        {items.length > 0 && (
          <div className="drawer-footer luxury-cart-footer">
            <div className="luxury-cart-summary-block">
              <div className="luxury-cart-summary-row">
                <span className="luxury-cart-summary-label">{t.subtotal}</span>
                <span className="luxury-cart-summary-val">{formatUSD(subtotal)}</span>
              </div>
              <div className="luxury-cart-summary-row">
                <span className="luxury-cart-summary-label">{lang === 'km' ? 'ការដឹកជញ្ជូន' : 'Shipping'}</span>
                <span className={`luxury-cart-shipping-chip ${shippingFee === 0 ? 'is-free' : ''}`}>
                  {shippingFee === 0
                    ? (lang === 'km' ? 'ឥតគិតថ្លៃ (FREE) ✨' : 'FREE ✨')
                    : formatUSD(shippingFee)}
                </span>
              </div>
              <div className="luxury-cart-summary-divider" />
              <div className="luxury-cart-summary-row is-total">
                <div>
                  <span className="luxury-cart-total-label">{lang === 'km' ? 'សរុបចុងក្រោយ' : 'Final Total'}</span>
                  <div className="luxury-cart-total-khr">
                    {lang === 'km' ? 'ប្រហាក់ប្រហែល' : 'Approx.'} {formatKHR(finalTotal)}
                  </div>
                </div>
                <span className="luxury-cart-total-val">{formatUSD(finalTotal)}</span>
              </div>
            </div>

            <button type="button" className="luxury-cart-checkout-btn" onClick={onCheckout}>
              <span>{t.checkoutBtn}</span>
              <span className="luxury-checkout-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 4. Wishlist Drawer ──────────────────────────────────── */
export function WishlistDrawer({ open, items, onClose, lang: propLang }) {
  const lang = propLang || getLang();
  const t = STOREFRONT_T[lang]?.wishlistModal || STOREFRONT_T.km.wishlistModal;
  if (!open) return null;

  const moveOne = (item) => {
    addToCart(item, 1, item.sizes?.[0] || 'M', item.colors?.[0] || 'Default');
    saveWishlist(items.filter((i) => !(i.id == item.id || (i.sku && i.sku === item.sku))));
    notify(lang === 'km' ? `បានដាក់ "${item.name}" ចូលកន្ត្រក! 🛍` : `Moved "${item.name}" to your bag! 🛍`, 'success', 2200);
  };

  const moveAll = () => {
    items.forEach((item) => addToCart(item, 1, item.sizes?.[0] || 'M', item.colors?.[0] || 'Default'));
    saveWishlist([]);
    notify(lang === 'km' ? `បានដាក់ ${items.length} មុខទំនិញចូលកន្ត្រក! 🛍` : `Moved ${items.length} wishlist item(s) to your bag! 🛍`, 'success', 2400);
  };

  return (
    <div
      className="drawer-overlay open luxury-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer open luxury-cart-drawer">
        <div className="drawer-header luxury-cart-header">
          <div className="luxury-cart-title-wrap">
            <span className="luxury-cart-icon">🤍</span>
            <div>
              <h3 className="luxury-cart-title">{t.title}</h3>
              <span className="luxury-cart-count-badge">
                {items.length} {lang === 'km' ? 'មុខទំនិញ' : (items.length === 1 ? 'item' : 'items')}
              </span>
            </div>
          </div>
          <button type="button" className="luxury-drawer-close-btn" onClick={onClose} aria-label="Close wishlist">
            ✕
          </button>
        </div>

        <div className="drawer-body luxury-cart-body">
          {!items.length ? (
            <div className="luxury-cart-empty">
              <div className="luxury-cart-empty-icon">🤍</div>
              <div className="luxury-cart-empty-title">{t.emptyTitle}</div>
              <div className="luxury-cart-empty-sub">{t.emptySub}</div>
              <button type="button" className="luxury-cart-empty-shop-btn" onClick={onClose}>
                {lang === 'km' ? 'ស្វែងរកទំនិញពេញចិត្ត ✨' : 'Browse Products ✨'}
              </button>
            </div>
          ) : (
            <div className="luxury-cart-items-list">
              {items.map((item) => (
                <div key={item.id ?? item.sku} className="luxury-cart-item-card">
                  <div className="luxury-cart-item-media">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="luxury-cart-item-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80';
                      }}
                    />
                  </div>
                  <div className="luxury-cart-item-content">
                    <div className="luxury-cart-item-top">
                      <div className="luxury-cart-item-title" title={item.name}>{item.name}</div>
                      <button
                        type="button"
                        className="luxury-cart-item-remove-btn"
                        onClick={() => saveWishlist(items.filter((i) => i.id !== item.id))}
                        title={t.remove}
                        aria-label={t.remove}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="luxury-cart-item-bottom" style={{ marginTop: 8 }}>
                      <span className="luxury-cart-item-price">{formatUSD(item.sale_price || item.price)}</span>
                      <button
                        type="button"
                        className="luxury-wishlist-add-btn"
                        onClick={() => moveOne(item)}
                      >
                        + {lang === 'km' ? 'ដាក់ចូលកន្ត្រក' : 'Add to Bag'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer luxury-cart-footer">
            <button type="button" className="luxury-cart-checkout-btn" onClick={moveAll}>
              <span>{lang === 'km' ? 'ដាក់ទាំងអស់ចូលក្នុងកន្ត្រក 🛍' : 'Move All to Bag 🛍'}</span>
              <span className="luxury-checkout-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Celebratory Payment Success Audio (Web Audio Chime + AI Voice TTS) ──
export function playPaymentSuccessSoundAndVoice(lang = 'km', amount = 0, isCod = false) {
  // 1. Crystal clear luxury celebratory chime chord using Web Audio API
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Melodic celebratory arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz), sparkle C7 (2093Hz)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.32, gain: 0.22 },
        { freq: 659.25, time: 0.09, dur: 0.34, gain: 0.25 },
        { freq: 783.99, time: 0.18, dur: 0.4, gain: 0.28 },
        { freq: 1046.5, time: 0.28, dur: 0.65, gain: 0.32 },
        { freq: 2093.0, time: 0.38, dur: 0.85, gain: 0.2 },
      ];

      notes.forEach(({ freq, time, dur, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur + 0.05);
      });
    }
  } catch (err) {
    console.warn('AudioContext chime error:', err);
  }

  // 2. AI Voice speech synthesis
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const isKhmer = lang === 'km';
      const speechText = isKhmer
        ? isCod
          ? 'ការបញ្ជាទិញទទួលបានជោគជ័យ! សូមអរគុណសម្រាប់ការទិញទំនិញនៅ Fashion Store'
          : 'ការទូទាត់ប្រាក់តាម Bakong KHQR បានជោគជ័យ! សូមអរគុណសម្រាប់ការទិញទំនិញនៅ Fashion Store'
        : isCod
          ? 'Order placed successfully! Thank you for shopping with Fashion Store!'
          : 'Bakong KHQR payment successful! Thank you for shopping with Fashion Store!';

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices() || [];
      if (isKhmer) {
        const kmVoice = voices.find(
          (v) => v.lang && (v.lang.toLowerCase().includes('km') || v.lang.toLowerCase().includes('kh'))
        );
        if (kmVoice) {
          utterance.voice = kmVoice;
          utterance.lang = kmVoice.lang;
        } else {
          // If browser has no native Khmer TTS engine, speak in warm natural English so user always hears AI voice
          utterance.text = isCod
            ? 'Order placed successfully! Thank you for shopping with Fashion Store.'
            : 'Payment successful! Thank you for shopping with Fashion Store.';
          utterance.lang = 'en-US';
          const engVoice = voices.find(
            (v) =>
              v.lang &&
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Jenny') ||
                v.name.includes('Victoria'))
          );
          if (engVoice) utterance.voice = engVoice;
        }
      } else {
        utterance.lang = 'en-US';
        const engVoice = voices.find(
          (v) =>
            v.lang &&
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny'))
        );
        if (engVoice) utterance.voice = engVoice;
      }

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 300);
    }
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
  }
}

/* ── 5. Checkout Modal (Bakong KHQR + COD + Orders Sync) ── */
export function CheckoutModal({ open, items = [], onClose, onNavigateLogin, onOpenOrders, lang: customLang }) {
  const lang = customLang || getLang();
  const t = STOREFRONT_T[lang]?.checkoutModal || STOREFRONT_T.km.checkoutModal;
  const user = getUser();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('Phnom Penh, Cambodia');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [qrData, setQrData] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((sum, i) => sum + Number(i.sale_price || i.price || 0) * (i.qty || 1), 0);
  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 2.5;
  const total = subtotal + shipping;
  const khrTotal = Math.round(total * 4100);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      notify(lang === 'km' ? 'ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ឡើយ។' : 'Geolocation is not supported by your browser.', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Street/Area at (${latitude.toFixed(5)}, ${longitude.toFixed(5)}), Phnom Penh, Cambodia`);
          }
        } catch {
          setAddress(`Street/Area at (${latitude.toFixed(5)}, ${longitude.toFixed(5)}), Phnom Penh, Cambodia`);
        }
        setGpsLoading(false);
        notify(lang === 'km' ? '📍 បានរកឃើញទីតាំងបច្ចុប្បន្នរបស់អ្នកជោគជ័យ!' : '📍 Current location found successfully!', 'success');
      },
      (err) => {
        setGpsLoading(false);
        notify(lang === 'km' ? 'មិនអាចទាញយកទីតាំងបានទេ។ សូមអនុញ្ញាត Location Permission។' : 'Could not retrieve location. Please allow location permissions.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Sync user details on open
  useEffect(() => {
    if (open) {
      const current = getUser();
      setName(current?.name || '');
      setPhone(current?.phone || '');
      setQrData(null);
      setSuccessOrder(null);
    }
  }, [open]);

  // Client-side EMVCo NBC KHQR generator fallback
  const generateKhqrClient = (amt, curr = 'USD', billNo = null) => {
    const accountId = 'huonneng_nim@bkrt';
    const merchantName = 'Huonneng Nim';
    const formattedAmount = Number(amt).toFixed(2);
    const billNumber = billNo || `ORD-${Date.now().toString().slice(-8)}`;

    const formatTlv = (tag, val) => {
      const len = String(val.length).padStart(2, '0');
      return `${tag}${len}${val}`;
    };

    const sub00 = formatTlv('00', accountId);
    const tag29 = formatTlv('29', sub00);
    const subBill = formatTlv('01', billNumber.slice(0, 25));
    const subStore = formatTlv('03', 'Fashion Store KH');
    const tag62 = formatTlv('62', subBill + subStore);

    const nowMs = String(Date.now());
    const expMs = String(Date.now() + 30 * 60 * 1000);
    const tag99 = formatTlv('99', formatTlv('00', nowMs) + formatTlv('01', expMs));

    const payload =
      formatTlv('00', '01') +
      formatTlv('01', '12') +
      tag29 +
      formatTlv('52', '5999') +
      formatTlv('53', '840') +
      formatTlv('54', formattedAmount) +
      formatTlv('58', 'KH') +
      formatTlv('59', merchantName.slice(0, 25)) +
      formatTlv('60', 'Phnom Penh') +
      tag62 +
      tag99 +
      '6304';

    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
    const fullQr = payload + crcHex;

    return {
      account_id: accountId,
      merchant_name: merchantName,
      amount: Number(formattedAmount),
      currency: curr,
      qr_string: fullQr,
      qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=8&ecc=M&data=${encodeURIComponent(fullQr)}`,
      md5: `KHQR-${Date.now()}`,
      bill_number: billNumber,
    };
  };

  const finalizeOrder = async (paymentLabel, method = 'cod') => {
    const orderNum = `ORD-${Date.now().toString().slice(-8)}`;
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isCod = method === 'cod' || paymentLabel.toLowerCase().includes('cash');

    const newOrder = {
      num: orderNum,
      date: nowStr,
      customer: {
        name: name || user?.name || 'Customer',
        email: user?.email || 'customer@fashionstore.com',
        phone: phone || '012 345 678',
        address,
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
      },
      products: safeItems.map((i) => ({
        name: i.name,
        size: i.size || 'M',
        qty: i.qty || 1,
        price: Number(i.sale_price || i.price || 0),
        image: i.image,
      })),
      total,
      payment: isCod ? 'Cash on Delivery (COD)' : paymentLabel,
      payment_method: isCod ? 'cod' : 'khqr',
      payment_status: isCod ? 'unpaid' : 'paid',
      status: 'pending', // Stage 1: Order Placed / Processing
      courier: 'J&T Express 🚚',
      tracking_number: `JT-${Math.floor(100000 + Math.random() * 900000)}KH`,
      created_at: new Date().toISOString(),
    };

    const existingOrders = getOrders();
    saveOrders([newOrder, ...existingOrders]);

    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    await api.post(
      '/telegram/send-receipt',
      {
        id: orderNum,
        date: nowStr,
        name: newOrder.customer.name,
        phone: newOrder.customer.phone,
        address: `${address}\n📍 Google Maps: ${mapsLink}`,
        items: newOrder.products.map((p) => `${p.name} (${p.size}) x${p.qty}`),
        total,
        khr_total: khrTotal,
        payment: newOrder.payment,
        status: isCod ? 'pending (COD Unpaid - មិនទាន់បង់ប្រាក់)' : 'paid (KHQR)',
      },
      false
    );

    saveCart([]);

    // 🔊 Play luxury chime & AI Voice announcement!
    playPaymentSuccessSoundAndVoice(lang, total, isCod);

    notify(
      isCod
        ? (lang === 'km' ? `🎉 ការបញ្ជាទិញលេខ ${orderNum} ទទួលបានជោគជ័យ!` : `🎉 Order ${orderNum} placed successfully!`)
        : (lang === 'km' ? `🎉 ការទូទាត់ប្រាក់តាមបាគង KHQR បានជោគជ័យ!` : `🎉 Bakong KHQR Payment for ${orderNum} Received!`),
      'success',
      4500
    );

    // Show celebration screen with animation and confetti!
    setSuccessOrder(newOrder);
  };

  // Auto-poll Bakong open API every 3.5s to detect live payments (Unconditionally declared hook)
  useEffect(() => {
    if (!open || !qrData || !qrData.md5 || qrData.md5.startsWith('DEMO-')) return;
    const interval = setInterval(async () => {
      try {
        const checkRes = await api.post('/payment/bakong/check', { md5: qrData.md5 }, false);
        if (checkRes.ok && checkRes.data?.data?.paid) {
          clearInterval(interval);
          notify(lang === 'km' ? '🎉 ការទូទាត់ប្រាក់តាម Bakong KHQR បានជោគជ័យ!' : '🎉 Bakong KHQR Payment Received!', 'success', 4000);
          finalizeOrder('Bakong KHQR Paid', 'khqr');
        }
      } catch {
        // Continue silently
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [open, qrData]);

  // Safe early return ONLY AFTER all hooks have executed
  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || isAdminUser(user)) {
      notify(lang === 'km' ? 'សូមចូលគណនីអតិថិជនដើម្បីធ្វើការបញ្ជាទិញ។' : 'Please sign in with a customer account to place orders.', 'error', 3200);
      onClose();
      onNavigateLogin();
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      notify(lang === 'km' ? 'សូមបំពេញឈ្មោះ លេខទូរស័ព្ទ និងអាសយដ្ឋាន។' : 'Please fill in your name, phone, and address.', 'error');
      return;
    }
    if (paymentMethod === 'cod') {
      setLoading(true);
      await finalizeOrder('Cash on Delivery');
      setLoading(false);
      return;
    }

    setLoading(true);
    let qrInfo = null;
    try {
      const res = await api.post('/payment/bakong/qr', { amount: Number(total.toFixed(2)), currency: 'USD' }, false);
      if (res.ok && (res.data?.data || res.data)) {
        const d = res.data?.data || res.data;
        const qrString = d.qr_string || d.qr || '';
        const qrImg = d.qr_image || d.qr_image_url || res.data?.qr_image || res.data?.qr_image_url || (qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=8&ecc=M&data=${encodeURIComponent(qrString)}` : null);
        if (qrString || qrImg) {
          qrInfo = {
            ...d,
            qr_string: qrString,
            qr_image: qrImg,
            md5: d.md5 || `KHQR-${Date.now()}`,
            amount: d.amount || total,
            currency: d.currency || 'USD',
            merchant_name: d.merchant_name || 'Huonneng Nim',
            account_id: d.account_id || 'huonneng_nim@bkrt',
          };
        }
      }
    } catch {
      // Fallback below
    }

    if (!qrInfo || !qrInfo.qr_image) {
      qrInfo = generateKhqrClient(Number(total.toFixed(2)), 'USD');
    }

    setLoading(false);
    setQrData(qrInfo);
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{t.title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ position: 'relative', overflow: 'hidden' }}>
          {successOrder ? (
            <div className="payment-celebration-container">
              {/* Confetti Explosion Particles */}
              <div className="payment-confetti-stage" aria-hidden="true">
                {Array.from({ length: 32 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`confetti-particle p-${idx % 8}`}
                    style={{
                      left: `${((idx * 7.7) % 96).toFixed(1)}%`,
                      animationDelay: `${((idx * 0.08) % 1.6).toFixed(2)}s`,
                      animationDuration: `${(2.2 + (idx % 5) * 0.35).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>

              {/* Bouncy Glowing Green Checkmark */}
              <div className="payment-success-badge-wrap">
                <div className="payment-success-ring-pulse" />
                <div className="payment-success-circle">
                  <svg className="payment-checkmark-svg" viewBox="0 0 52 52">
                    <circle className="payment-checkmark-circle" cx="26" cy="26" r="23" fill="none" />
                    <path className="payment-checkmark-check" fill="none" d="M14 27l8 8 16-16" />
                  </svg>
                </div>
              </div>

              <h2 className="payment-success-title">
                {lang === 'km' ? '🎉 ការទូទាត់ប្រាក់ជោគជ័យ!' : '🎉 Payment Successful!'}
              </h2>
              <p className="payment-success-subtitle">
                {lang === 'km'
                  ? 'សូមអរគុណ! ការបញ្ជាទិញរបស់អ្នកត្រូវបានទទួលស្គាល់ និងកំពុងរៀបចំដឹកជញ្ជូន។'
                  : 'Thank you! Your order has been placed and is being prepared for dispatch.'}
              </p>

              {/* AI Voice Indicator Banner & Soundwave */}
              <div className="payment-ai-voice-banner">
                <div className="ai-voice-info">
                  <span className="ai-voice-badge">
                    {lang === 'km' ? '🎙️ សំឡេង AI បញ្ជាក់ការទូទាត់' : '🎙️ AI Voice Announcement'}
                  </span>
                  <div className="ai-voice-waves" aria-hidden="true">
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                    <span className="ai-wave-bar" />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ai-replay-voice"
                  onClick={() => playPaymentSuccessSoundAndVoice(lang, successOrder.total, successOrder.payment_method === 'cod')}
                >
                  🔊 {lang === 'km' ? 'ស្ដាប់សារ AI ឡើងវិញ' : 'Replay AI Voice'}
                </button>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="payment-receipt-card">
                <div className="payment-receipt-row">
                  <span className="receipt-label">{lang === 'km' ? 'លេខវិក្កយបត្រ' : 'Order ID'}</span>
                  <span className="receipt-val highlight-order">{successOrder.num}</span>
                </div>
                <div className="payment-receipt-row">
                  <span className="receipt-label">{lang === 'km' ? 'ចំនួនទឹកប្រាក់សរុប' : 'Total Amount'}</span>
                  <span className="receipt-val receipt-amount">
                    {formatUSD(successOrder.total)}{' '}
                    <span className="receipt-khr">({Math.round(successOrder.total * 4100).toLocaleString('en-US')} ៛)</span>
                  </span>
                </div>
                <div className="payment-receipt-row">
                  <span className="receipt-label">{lang === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Method'}</span>
                  <span className="receipt-val text-success">
                    {successOrder.payment_method === 'khqr'
                      ? (lang === 'km' ? '✓ បាគង KHQR ជោគជ័យ' : '✓ Bakong KHQR Verified')
                      : (lang === 'km' ? '✓ ទូទាត់ពេលទទួលទំនិញ' : '✓ Cash on Delivery')}
                  </span>
                </div>
                <div className="payment-receipt-row">
                  <span className="receipt-label">{lang === 'km' ? 'ក្រុមហ៊ុនដឹកជញ្ជូន' : 'Courier Delivery'}</span>
                  <span className="receipt-val">
                    {successOrder.courier} · <span className="receipt-tracking">{successOrder.tracking_number}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="payment-success-actions">
                {onOpenOrders && (
                  <button
                    type="button"
                    className="btn btn-primary btn-track-order"
                    onClick={() => {
                      onClose();
                      onOpenOrders();
                    }}
                  >
                    📦 {lang === 'km' ? 'តាមដានការបញ្ជាទិញ' : 'Track Order Status'}
                  </button>
                )}
                <button type="button" className="btn btn-outline btn-success-done" onClick={onClose}>
                  ✓ {lang === 'km' ? 'រួចរាល់' : 'Done'}
                </button>
              </div>
            </div>
          ) : qrData ? (
            <div className="official-khqr-container">
              {/* Official Red KHQR Banner */}
              <div className="official-khqr-banner">
                <div className="official-khqr-top-row">
                  <div className="official-khqr-brand">
                    <span className="official-khqr-flag">🇰🇭</span>
                    <span className="official-khqr-title">KHQR</span>
                  </div>
                  <span className="official-khqr-badge">{lang === 'km' ? 'បាគងផ្លូវការ' : 'Bakong Official'}</span>
                </div>
                <div className="official-khqr-merchant">
                  <div className="official-khqr-merchant-name">{qrData.merchant_name || 'Huonneng Nim'}</div>
                  <div className="official-khqr-merchant-acc">{qrData.account_id || 'huonneng_nim@bkrt'}</div>
                </div>
              </div>

              {/* Price Display */}
              <div className="official-khqr-price-strip">
                <div className="official-khqr-amount-usd">{formatUSD(total)}</div>
                <div className="official-khqr-amount-khr">{khrTotal.toLocaleString('en-US')} ៛</div>
              </div>

              {/* QR Code Frame */}
              <div className="official-khqr-code-box">
                <div className="official-khqr-code-inner">
                  <img
                    src={qrData.qr_image}
                    alt="Bakong KHQR Payment Code"
                    className="official-khqr-img"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.retried) {
                        e.currentTarget.dataset.retried = 'true';
                        e.currentTarget.src = `https://quickchart.io/qr?size=340&text=${encodeURIComponent(qrData.qr_string || '')}`;
                      }
                    }}
                  />
                  <div className="official-khqr-center-emblem">
                    <span style={{ fontSize: 16 }}>🇰🇭</span>
                  </div>
                </div>
              </div>

              {/* Live Status & Bank Instructions */}
              <div className="official-khqr-status-box">
                <div className="official-khqr-pulse">
                  <span className="official-khqr-dot" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {lang === 'km' ? 'កំពុងរង់ចាំការស្កេនទូទាត់ប្រាក់...' : 'Awaiting payment scan...'}
                  </span>
                </div>
                <div className="official-khqr-bank-icons">
                  <span>Bakong</span> · <span>ABA Mobile</span> · <span>Wing Bank</span> · <span>ACLEDA</span> · <span>Canadia</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="official-khqr-actions-row">
                <button type="button" className="btn btn-outline btn-khqr-back" onClick={() => setQrData(null)}>
                  ← {t.backBtn}
                </button>
                <a
                  href={qrData.qr_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-khqr-save"
                  title="Open or Save QR image"
                >
                  📥 {lang === 'km' ? 'ទាញយក QR' : 'Save QR'}
                </a>
                <button
                  type="button"
                  className="btn btn-primary btn-khqr-confirm"
                  onClick={() => finalizeOrder('Bakong KHQR Paid', 'khqr')}
                >
                  ✓ {lang === 'km' ? 'ខ្ញុំបានទូទាត់ប្រាក់រួចរាល់' : 'I Have Paid'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t.fullNameLabel}</label>
                <input className="form-control" placeholder={t.fullNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t.phoneLabel}</label>
                <input className="form-control" placeholder={t.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              {/* Delivery Address & Google Map Location Picker */}
              <div className="form-group checkout-location-group" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍</span>
                    <span>{t.addressLabel}</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-gps-locate"
                      onClick={handleGetGpsLocation}
                      disabled={gpsLoading}
                      title={lang === 'km' ? 'ប្រើទីតាំង GPS បច្ចុប្បន្ន' : 'Use Current GPS Location'}
                    >
                      <span>{gpsLoading ? '⏳' : '🎯'}</span>
                      <span>{gpsLoading ? (lang === 'km' ? 'កំពុងស្វែងរក...' : 'Locating...') : (lang === 'km' ? 'យកទីតាំងបច្ចុប្បន្ន' : 'Current GPS')}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toggle-map"
                      onClick={() => setShowMap(!showMap)}
                      title={showMap ? 'Hide Map' : 'Show Map'}
                    >
                      <span>{showMap ? '▲' : '🗺️'}</span>
                      <span>{showMap ? (lang === 'km' ? 'បិទផែនទី' : 'Hide Map') : (lang === 'km' ? 'មើលផែនទី' : 'View Map')}</span>
                    </button>
                  </div>
                </div>

                {/* Address text input with clear button */}
                <div className="address-input-wrapper" style={{ position: 'relative', marginBottom: 8 }}>
                  <input
                    className="form-control"
                    placeholder={t.addressPlaceholder || (lang === 'km' ? 'លេខផ្ទះ ផ្លូវ ឬទីតាំង...' : 'Street & house address...')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    style={{ paddingRight: 36 }}
                  />
                  {address && (
                    <button
                      type="button"
                      onClick={() => setAddress('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 4,
                      }}
                      title="Clear address"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Popular Cambodian Area Chips for 1-Click Pinpoint */}
                <div className="map-quick-chips" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
                    {lang === 'km' ? 'ជ្រើសរើសរហ័ស:' : 'Quick Select:'}
                  </span>
                  {[
                    { labelKm: 'បឹងកេងកង', labelEn: 'BKK1', value: 'BKK1, Khan Chamkarmon, Phnom Penh, Cambodia' },
                    { labelKm: 'ទួលគោក', labelEn: 'Toul Kork', value: 'Toul Kork, Phnom Penh, Cambodia' },
                    { labelKm: 'ដូនពេញ', labelEn: 'Daun Penh', value: 'Daun Penh, Phnom Penh, Cambodia' },
                    { labelKm: 'សែនសុខ', labelEn: 'Sen Sok', value: 'Sen Sok, Phnom Penh, Cambodia' },
                    { labelKm: 'ជ្រោយចង្វារ', labelEn: 'Chroy Changvar', value: 'Chroy Changvar, Phnom Penh, Cambodia' },
                    { labelKm: 'សៀមរាប', labelEn: 'Siem Reap', value: 'Siem Reap City, Cambodia' },
                    { labelKm: 'បាត់ដំបង', labelEn: 'Battambang', value: 'Battambang City, Cambodia' },
                    { labelKm: 'កំពង់សោម', labelEn: 'Sihanoukville', value: 'Sihanoukville, Cambodia' },
                  ].map((chip) => {
                    const label = lang === 'km' ? chip.labelKm : chip.labelEn;
                    const isSelected = address.includes(chip.labelEn) || address.includes(chip.labelKm);
                    return (
                      <button
                        key={chip.labelEn}
                        type="button"
                        className={`map-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setAddress(chip.value);
                          notify(lang === 'km' ? `📍 បានកំណត់ទីតាំង៖ ${label}` : `📍 Selected location: ${label}`, 'success', 2000);
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Embedded Google Map Container */}
                {showMap && (
                  <div className="checkout-map-card">
                    <div className="checkout-map-head">
                      <span className="checkout-map-title">
                        🗺️ {lang === 'km' ? 'ផែនទីដឹកជញ្ជូន Google Map' : 'Google Map Delivery Location'}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Phnom Penh, Cambodia')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="checkout-map-external-link"
                      >
                        {lang === 'km' ? 'បើក Google Maps ↗' : 'Open in Google Maps ↗'}
                      </a>
                    </div>
                    <div className="checkout-map-viewport">
                      <iframe
                        title="Google Maps Delivery Location"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(address || 'Phnom Penh, Cambodia')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="180"
                        style={{ border: 0, display: 'block' }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <div className="checkout-map-marker-pin" title={address}>
                        <span className="pin-pulse" />
                        <span className="pin-icon">📍</span>
                      </div>
                    </div>
                    <div className="checkout-map-footer">
                      <span>💡 {lang === 'km' ? 'ចុចលើតំបន់រហ័ស ឬវាយលេខផ្ទះ/ផ្លូវជាក់លាក់ ដើម្បីផ្លាស់ប្តូរទីតាំងលើផែនទី' : 'Click quick chips or type specific house/street to pinpoint on map'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>{t.paymentMethodTitle} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'cod' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('cod')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 10px', height: 'auto', gap: 4 }}
                  >
                    <span style={{ fontSize: 20 }}>💵</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{t.methodCodTitle}</span>
                    <span style={{ fontSize: 10.5, opacity: 0.85 }}>{t.methodCodSub}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'khqr' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('khqr')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 10px', height: 'auto', gap: 4 }}
                  >
                    <span style={{ fontSize: 20 }}>🇰🇭</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{t.methodKhqrTitle}</span>
                    <span style={{ fontSize: 10.5, opacity: 0.85 }}>{t.methodKhqrSub}</span>
                  </button>
                </div>

                {paymentMethod === 'cod' && (
                  <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 12, fontSize: 12.5 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-dark, #b45309)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span>⚡</span>
                      <span>{t.codHighlight}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      <li>{t.codBullet1}</li>
                      <li>{t.codBullet2}</li>
                      <li>{t.codBullet3}</li>
                      <li>{t.codBullet4}</li>
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--warm-gray)', padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{t.subtotal}</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>{t.delivery}</span>
                  <span>{shipping === 0 ? t.free : formatUSD(shipping)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  <span>{t.total}</span>
                  <span>
                    {formatUSD(total)} ({formatKHR(total)})
                  </span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height: 46, fontSize: 14.5, fontWeight: 700 }}>
                {loading ? t.processing : paymentMethod === 'khqr' ? t.confirmKhqrBtn : t.confirmCodBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 6. Customer Orders Modal (COD Lifecycle & Live Tracking) ────────── */
export function OrdersModal({ open, orders, onClose, lang: customLang }) {
  const lang = customLang || getLang();
  const [expandedFlow, setExpandedFlow] = useState({});
  const [copiedTracking, setCopiedTracking] = useState(null);
  const [confirmingNum, setConfirmingNum] = useState(null);

  if (!open) return null;

  const toggleFlow = (num) => {
    setExpandedFlow((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const handleCopy = (text, num) => {
    navigator.clipboard?.writeText(text);
    setCopiedTracking(num);
    notify(lang === 'km' ? `បានចម្លងលេខ Tracking "${text}" រួចរាល់! 📋` : `Tracking number "${text}" copied! 📋`, 'success', 2200);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  const handleConfirmReceived = async (orderNum) => {
    if (
      !window.confirm(
        lang === 'km'
          ? `តើលោកអ្នកពិតជាបានទទួលកញ្ចប់ទំនិញ #${orderNum} និងបានប្រគល់សាច់ប្រាក់ជូនអ្នកដឹកជញ្ជូនរួចហើយមែនទេ?`
          : `Please confirm that you have received order #${orderNum} and paid cash to the courier.`
      )
    ) {
      return;
    }

    setConfirmingNum(orderNum);

    // Update orders in localStorage and trigger store sync
    const currentOrders = getOrders();
    const updated = currentOrders.map((ord) => {
      if (ord.num === orderNum) {
        return {
          ...ord,
          status: 'delivered',
          payment_status: 'paid',
          payment: lang === 'km' ? 'COD Paid (សាច់ប្រាក់)' : 'COD Paid (Cash)',
          delivered_at: new Date().toISOString(),
          customer_confirmed: true,
        };
      }
      return ord;
    });
    saveOrders(updated);

    try {
      await api.post(`/orders/${orderNum}/confirm-delivery`, {}, false);
    } catch (_) {}

    setConfirmingNum(null);
    notify(
      lang === 'km'
        ? `🎉 អបអរសាទរ! លោកអ្នកបានបញ្ជាក់ការទទួលទំនិញ #${orderNum} ជោគជ័យ។ ប្រតិបត្តិការត្រូវបានបញ្ចប់រួចរាល់ 🏁`
        : `🎉 Congratulations! Order #${orderNum} marked as received. Transaction completed (Delivered & Paid) 🏁`,
      'success',
      4500
    );
  };

  const getStageIndex = (status, paymentStatus) => {
    const s = String(status || '').toLowerCase();
    const p = String(paymentStatus || '').toLowerCase();
    if (s === 'delivered' || (p === 'paid' && s !== 'pending' && s !== 'processing')) return 5;
    if (s === 'shipped') return 4;
    if (s === 'processing' || s === 'confirmed') return 3;
    return 2; // stage 2: order received / pending
  };

  const STAGES = lang === 'en' ? [
    {
      stage: 1,
      actor: '[Customer]',
      title: 'Checkout 🛒',
      sub: 'Customer selected Cash on Delivery checkout method',
      icon: '🛒',
    },
    {
      stage: 2,
      actor: '[System]',
      title: 'Order Received 📥',
      sub: 'System accepted the order immediately without prior payment check',
      icon: '📥',
    },
    {
      stage: 3,
      actor: '[Store Admin]',
      title: 'Packaging Goods 📦',
      sub: 'Store staff prepares items, inspects quality, and packages securely',
      icon: '📦',
    },
    {
      stage: 4,
      actor: '[Logistics Courier]',
      title: 'Out for Delivery 🚚 📍',
      sub: 'Courier delivers items with real-time tracking — Unpaid (prepare cash)',
      icon: '🚚',
    },
    {
      stage: 5,
      actor: '[Customer & Store]',
      title: 'Delivered & Paid 🏁',
      sub: 'Customer receives package, pays cash to courier, and completes the order',
      icon: '🏁',
    },
  ] : [
    {
      stage: 1,
      actor: '[អតិថិជន]',
      title: 'ការបញ្ជាទិញ 🛒',
      sub: 'អតិថិជនជ្រើសរើសទូទាត់សាច់ប្រាក់ពេលទទួលទំនិញ',
      icon: '🛒',
    },
    {
      stage: 2,
      actor: '[ប្រព័ន្ធហាង]',
      title: 'ទទួលបានការបញ្ជាទិញ 📥',
      sub: 'ប្រព័ន្ធទទួលយកការកុម្ម៉ង់ភ្លាមៗ ដោយមិនបាច់បង់ប្រាក់ជាមុនឡើយ',
      icon: '📥',
    },
    {
      stage: 3,
      actor: '[បុគ្គលិកហាង]',
      title: 'វេចខ្ចប់ទំនិញ 📦',
      sub: 'បុគ្គលិករៀបចំទំនិញ ពិនិត្យគុណភាព និងវេចខ្ចប់យ៉ាងមានសុវត្ថិភាព',
      icon: '📦',
    },
    {
      stage: 4,
      actor: '[ក្រុមហ៊ុនដឹកជញ្ជូន]',
      title: 'កំពុងដឹកជញ្ជូន 🚚 📍',
      sub: 'ក្រុមហ៊ុនដឹកជញ្ជូនយកទំនិញទៅដឹកជូន (សូមត្រៀមសាច់ប្រាក់ពេលទំនិញមកដល់)',
      icon: '🚚',
    },
    {
      stage: 5,
      actor: '[អតិថិជន & ហាង]',
      title: 'បានដឹកជញ្ជូន និងបង់ប្រាក់រួចរាល់ 🏁',
      sub: 'អតិថិជនទទួលបានទំនិញ និងប្រគល់សាច់ប្រាក់ជូនអ្នកដឹកជញ្ជូនរួចរាល់',
      icon: '🏁',
    },
  ];

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal-lg" style={{ maxWidth: 840 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛍️</span>
              <span>{lang === 'km' ? `ការបញ្ជាទិញ & ការតាមដានការដឹកជញ្ជូន (${orders.length})` : `My Orders & Delivery Tracking (${orders.length})`}</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {lang === 'km' ? 'ការតាមដានការដឹកជញ្ជូន និងដំណាក់កាលបញ្ជាទិញជាក់ស្ដែង' : 'Cash on Delivery (COD) Real-time Order Tracking & Lifecycle'}
            </span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto', padding: '18px 20px' }}>
          {!orders.length ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📦</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {lang === 'km' ? 'មិនទាន់មានការបញ្ជាទិញនៅឡើយទេ' : 'No orders yet'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {lang === 'km' ? 'ការបញ្ជាទិញរបស់អ្នកនឹងបង្ហាញនៅទីនេះ ជាមួយការតាមដានជាក់ស្ដែង។' : 'Your placed orders will appear here with live tracking.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {orders.map((o) => {
                const currentStage = getStageIndex(o.status, o.payment_status);
                const isCod = (o.payment_method === 'cod') || String(o.payment || '').toLowerCase().includes('cash');
                const isDelivered = String(o.status || '').toLowerCase() === 'delivered';
                const isPaid = (o.payment_status === 'paid') || isDelivered;
                const trackingCode = o.tracking_number && o.tracking_number !== 'PENDING'
                  ? o.tracking_number
                  : `JT-${String(o.num).replace(/\D/g, '').slice(-6) || '892101'}KH`;
                const courierName = o.courier && o.courier !== 'Pending Assignment' ? o.courier : 'J&T Express 🚚';
                const isExpanded = Boolean(expandedFlow[o.num]);

                return (
                  <div
                    key={o.num}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      background: 'var(--card-bg, #ffffff)',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                      padding: '16px 18px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Order Head Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: 15, letterSpacing: '0.02em' }}>#{o.num}</strong>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {o.date}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {lang === 'km' ? 'អ្នកទទួល:' : 'Recipient:'} <strong>{o.customer?.name}</strong> ({o.customer?.phone}) · {o.customer?.address}
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {isCod ? (
                          <span
                            className="badge"
                            style={{
                              background: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                              color: isPaid ? '#059669' : '#b45309',
                              border: isPaid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                              fontWeight: 700,
                              fontSize: 11,
                              padding: '4px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {isPaid
                              ? (lang === 'km' ? '✓ 💵 បង់រួចរាល់' : '✓ 💵 COD · PAID')
                              : (lang === 'km' ? '💵 មិនទាន់បង់' : '💵 COD · UNPAID')}
                          </span>
                        ) : (
                          <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 8px' }}>
                            {lang === 'km' ? '✓ 🇰🇭 KHQR បង់រួច' : '✓ 🇰🇭 KHQR PAID'}
                          </span>
                        )}

                        <span
                          className="badge"
                          style={{
                            background: isDelivered ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.14)',
                            color: isDelivered ? '#059669' : 'var(--accent-dark, #b45309)',
                            border: '1px solid var(--border)',
                            fontWeight: 700,
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                          }}
                        >
                          {String(o.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* COD Payment Status Alert Box */}
                    {isCod && (
                      <div
                        style={{
                          margin: '12px 0',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isPaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 88, 12, 0.08)',
                          border: isPaid ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(234, 88, 12, 0.28)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                          <span style={{ fontSize: 18 }}>{isPaid ? '✅' : '💵'}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: isPaid ? '#059669' : '#ea580c' }}>
                              {isPaid
                                ? (lang === 'km' ? 'ប្រតិបត្តិការត្រូវបានបញ្ចប់ — ទទួលបានទំនិញ និងទូទាត់ប្រាក់រួចរាល់' : 'Transaction Completed — Goods Received & Paid')
                                : (lang === 'km' ? 'ទូទាត់ពេលទទួលទំនិញ — មិនទាន់បង់ប្រាក់' : 'Cash on Delivery (COD) — Unpaid')}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              {isPaid
                                ? (lang === 'km' ? 'អរគុណសម្រាប់ការគាំទ្រហាង Fashion Store! បានដឹកជញ្ជូន និងបង់ប្រាក់រួចរាល់' : 'Thank you for supporting Fashion Store! (Delivered & Paid)')
                                : (lang === 'km'
                                    ? `សូមត្រៀមសាច់ប្រាក់ចំនួន ${formatUSD(o.total)} (${formatKHR(o.total)}) ប្រគល់ជូនអ្នកដឹកជញ្ជូនពេលទំនិញមកដល់។`
                                    : `Please prepare ${formatUSD(o.total)} (${formatKHR(o.total)}) cash to give to the courier upon arrival.`)}
                            </div>
                          </div>
                        </div>

                        {/* Courier & Tracking Code Pill */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--bg-elevated, #ffffff)',
                            border: '1px solid var(--border)',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>{courierName}</span>
                          <code style={{ fontWeight: 700, color: '#0284c7' }}>{trackingCode}</code>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: 11 }}
                            onClick={() => handleCopy(trackingCode, o.num)}
                            title={lang === 'km' ? 'ចម្លងលេខ Tracking' : 'Copy Tracking Number'}
                          >
                            {copiedTracking === o.num ? '✓ Copied' : '📋'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Visual 5-Stage Stepper / Progress Bar ── */}
                    <div style={{ padding: '10px 0 6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {lang === 'km' ? 'ដំណាក់កាលបញ្ជាទិញ' : 'Order Lifecycle Progress'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, color: 'var(--accent-dark, #b45309)', padding: '2px 6px' }}
                          onClick={() => toggleFlow(o.num)}
                        >
                          {isExpanded
                            ? (lang === 'km' ? '▲ បង្រួម' : '▲ Hide Details')
                            : (lang === 'km' ? '▼ មើលលម្អិតទាំង ៥ ដំណាក់កាល' : '▼ View 5 Steps')}
                        </button>
                      </div>

                      {/* Horizontal Stepper */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: 6,
                          position: 'relative',
                        }}
                      >
                        {STAGES.map((s) => {
                          const isPassed = currentStage >= s.stage;
                          const isCurrent = currentStage === s.stage;

                          return (
                            <div
                              key={s.stage}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                              }}
                            >
                              {/* Step circle */}
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  background: isPassed
                                    ? (s.stage === 5 ? '#10b981' : '#d4af37')
                                    : 'var(--warm-gray, #f1f5f9)',
                                  color: isPassed ? '#ffffff' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  border: isCurrent
                                    ? '3px solid #f59e0b'
                                    : isPassed
                                    ? '2px solid transparent'
                                    : '1.5px dashed var(--border)',
                                  boxShadow: isCurrent ? '0 0 0 3px rgba(245, 158, 11, 0.25)' : 'none',
                                  marginBottom: 6,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {isPassed && s.stage < currentStage ? '✓' : s.icon}
                              </div>

                              <div style={{ fontSize: 11, fontWeight: isCurrent ? 800 : isPassed ? 600 : 400, color: isCurrent ? 'var(--text-primary)' : isPassed ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.2 }}>
                                {s.title}
                              </div>
                              <div style={{ fontSize: 9.5, color: isCurrent ? '#ea580c' : 'var(--text-muted)', marginTop: 2 }}>
                                {s.actor}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Flow Explanation Drawer (Accordion) */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: 12,
                            background: 'var(--bg-elevated, #f8fafc)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            fontSize: 12,
                          }}
                        >
                          {STAGES.map((s) => {
                            const isPassed = currentStage >= s.stage;
                            const isCurrent = currentStage === s.stage;

                            return (
                              <div
                                key={s.stage}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  padding: '6px 8px',
                                  borderRadius: 8,
                                  background: isCurrent ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                                  borderLeft: isCurrent ? '3px solid #d4af37' : '3px solid transparent',
                                }}
                              >
                                <span style={{ fontSize: 16 }}>{s.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <strong style={{ color: isCurrent ? '#b45309' : isPassed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                      {s.stage}. {s.title}
                                    </strong>
                                    {isCurrent && (
                                      <span style={{ fontSize: 10, background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                                        {lang === 'km' ? 'ដំណាក់កាលបច្ចុប្បន្ន' : 'Current Stage'}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {s.sub}
                                  </div>
                                </div>
                                <span style={{ fontSize: 12, color: isPassed ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                                  {isPassed ? (lang === 'km' ? '✓ រួចរាល់' : '✓ Done') : (lang === 'km' ? 'រង់ចាំ' : 'Waiting')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ── User Delivery & Cash Confirmation (Controlled by Customer) ── */}
                    {isCod && !isDelivered && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(16, 185, 129, 0.1))',
                          border: '1.5px solid #d4af37',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                          boxShadow: '0 4px 14px rgba(212, 175, 55, 0.12)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: '#92400e' }}>
                            <span>💵🎁</span>
                            <span>{lang === 'km' ? '[អតិថិជន] ទទួលទំនិញ និងប្រគល់សាច់ប្រាក់ទៅអ្នកដឹកជញ្ជូន' : '[Customer] Receives Goods & Pays Cash to Courier'}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {currentStage >= 4
                              ? (lang === 'km'
                                  ? `តើលោកអ្នកបានទទួលកញ្ចប់ទំនិញ និងប្រគល់សាច់ប្រាក់ចំនួន ${formatUSD(o.total)} (${formatKHR(o.total)}) ជូនអ្នកដឹកជញ្ជូនរួចហើយឬនៅ? សូមចុចប៊ូតុងខាងស្ដាំដើម្បីបញ្ជាក់ និងបញ្ចប់ប្រតិបត្តិការ៖`
                                  : `Did you receive your package and pay ${formatUSD(o.total)} (${formatKHR(o.total)}) cash to the delivery driver? Click the button to confirm and complete transaction:`)
                              : (lang === 'km'
                                  ? `នៅពេលទំនិញមកដល់ និងបានប្រគល់សាច់ប្រាក់ចំនួន ${formatUSD(o.total)} (${formatKHR(o.total)}) រួចរាល់ សូមចូលមកទីនេះដើម្បីចុចបញ្ជាក់ការទទួលទំនិញ។`
                                  : `When goods arrive and cash payment is handed over, return here to confirm delivery.`)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            background: '#10b981',
                            borderColor: '#10b981',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: 12.5,
                            padding: '9px 18px',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => handleConfirmReceived(o.num)}
                          disabled={confirmingNum === o.num}
                        >
                          <span>✅</span>
                          <span>
                            {confirmingNum === o.num
                              ? (lang === 'km' ? 'កំពុងបញ្ជាក់…' : 'Confirming…')
                              : (lang === 'km' ? 'ខ្ញុំបានទទួលទំនិញ & ប្រគល់ប្រាក់រួចរាល់ (Confirm Received)' : 'I Received Goods & Paid Cash (Confirm Received)')}
                          </span>
                        </button>
                      </div>
                    )}

                    {isCod && isDelivered && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                          fontSize: 12,
                          color: '#059669',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🏁</span>
                          <span>{lang === 'km' ? '[ប្រព័ន្ធ] បញ្ចប់ប្រតិបត្តិការជោគជ័យ' : '[System] Transaction Completed (Delivered & Paid)'}</span>
                        </span>
                        <span style={{ fontSize: 11, background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 10 }}>
                          {lang === 'km' ? '✓ អតិថិជនបានបញ្ជាក់លើប្រព័ន្ធរួចរាល់' : '✓ Customer confirmed on website'}
                        </span>
                      </div>
                    )}

                    {/* Products Row */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        {lang === 'km' ? 'មុខទំនិញ:' : 'Items:'} {(o.products || []).map((p) => `${p.name} (${p.size || 'M'}) ×${p.qty}`).join(', ')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>
                        {formatUSD(o.total)} <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>({formatKHR(o.total)})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


