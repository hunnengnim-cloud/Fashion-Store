import React, { useEffect, useState } from 'react';
import { api, getLang, isInNormalGrid, isInScrollBox, notify } from '../lib/store';
import { ADMIN_T } from '../lib/adminTranslations';

const IMAGE_PRESETS = [
  { label: '👔 Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80' },
  { label: '👗 Dress', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80' },
  { label: '🧥 Jacket', url: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80' },
  { label: '👟 Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { label: '👜 Bag', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
];

const CAT_MAP = {
  "Men's": 'men',
  "Women's": 'women',
  Kids: 'kids',
  Shoes: 'shoes',
  Accessories: 'accessories',
};

export default function AdminProductModal({ open, editingProduct, existingSkus, onClose, onSave, onDelete, lang: propLang }) {
  const currentLang = propLang || getLang();
  const t = ADMIN_T[currentLang]?.productModal || ADMIN_T.km.productModal;
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [cat, setCat] = useState("Men's");
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('active');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [sales, setSales] = useState('');
  const [image, setImage] = useState('');
  const [desc, setDesc] = useState('');
  const [inScrollBox, setInScrollBox] = useState(false);
  const [inNormalGrid, setInNormalGrid] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || '');
      setCat(editingProduct.cat || "Men's");
      setBrand(editingProduct.brand || '');
      setStatus(editingProduct.status || 'active');
      setPrice(editingProduct.price !== undefined ? String(editingProduct.price) : '');
      setSalePrice(editingProduct.sale_price != null ? String(editingProduct.sale_price) : '');
      setStock(editingProduct.stock !== undefined ? String(editingProduct.stock) : '');
      setSales(editingProduct.sales !== undefined ? String(editingProduct.sales) : '0');
      setImage(editingProduct.image || '');
      setDesc(editingProduct.description || editingProduct.desc || '');
      setInScrollBox(isInScrollBox(editingProduct));
      setInNormalGrid(isInNormalGrid(editingProduct));
      setIsNew(Boolean(editingProduct.isNew));
      setFeatured(Boolean(editingProduct.featured));
    } else {
      // Clean, completely empty form when adding a new product
      setName('');
      setSku('');
      setCat("Men's");
      setBrand('');
      setStatus('active');
      setPrice('');
      setSalePrice('');
      setStock('');
      setSales('');
      setImage('');
      setDesc('');
      setInScrollBox(false);
      setInNormalGrid(false);
      setIsNew(false);
      setFeatured(false);
    }
  }, [open, editingProduct]);

  if (!open) return null;

  const activePreset = inScrollBox && inNormalGrid ? 'both' : inScrollBox ? 'scroll' : inNormalGrid ? 'normal' : '';

  const applyPreset = (preset) => {
    if (preset === 'scroll') {
      setInScrollBox(true);
      setInNormalGrid(false);
    } else if (preset === 'normal') {
      setInScrollBox(false);
      setInNormalGrid(true);
    } else {
      setInScrollBox(true);
      setInNormalGrid(true);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately display local preview so user sees the image right away
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImage(reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.upload('/admin/upload', formData);
      if (res.ok && res.data?.url) {
        setImage(res.data.url);
        notify(currentLang === 'km' ? 'បានបង្ហោះរូបភាពដោយជោគជ័យ!' : 'Image uploaded to server storage.', 'success', 2000);
      } else {
        notify(res.data?.message || (currentLang === 'km' ? 'មិនអាចបង្ហោះរូបភាពបានទេ' : 'Upload failed.'), 'warning', 2500);
      }
    } catch {
      notify(currentLang === 'km' ? 'កំហុសបណ្តាញពេលបង្ហោះ' : 'Upload error.', 'error', 2500);
    }
  };

  const handleSave = () => {
    const cleanName = name.trim();
    let cleanSku = sku.trim();
    if (!cleanSku) {
      cleanSku = `CS-PRD-${Math.floor(100 + Math.random() * 900)}`;
    }
    const parsedPrice = parseFloat(price);

    if (!cleanName) {
      notify('Please enter a product name.', 'error');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      notify('Please enter a valid price.', 'error');
      return;
    }
    if (!editingProduct && existingSkus.includes(cleanSku)) {
      notify(`SKU "${cleanSku}" already exists.`, 'error');
      return;
    }

    onSave({
      ...(editingProduct || {}),
      name: cleanName,
      sku: cleanSku,
      brand: brand.trim() || 'Fashion Store KH',
      cat,
      category: CAT_MAP[cat] || cat.toLowerCase().replace(/[^a-z]/g, ''),
      status,
      price: parsedPrice,
      sale_price: salePrice ? parseFloat(salePrice) : null,
      stock: stock !== '' ? parseInt(stock, 10) : 0,
      sales: sales !== '' ? parseInt(sales, 10) : 0,
      image: image.trim() || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
      desc: desc.trim(),
      description: desc.trim(),
      sizes: editingProduct?.sizes || ['S', 'M', 'L', 'XL'],
      colors: editingProduct?.colors || ['Default'],
      inScrollBox,
      inNormalGrid: (!inScrollBox && !inNormalGrid) ? true : inNormalGrid,
      isNew,
      featured,
      rating: editingProduct?.rating || 5.0,
      reviews: editingProduct?.reviews || 0,
    });
  };

  return (
    <div
      className="admin-modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal" style={{ maxWidth: 740 }}>
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title">{editingProduct ? `${t.editTitle}: ${editingProduct.name}` : t.createTitle}</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {editingProduct
                ? `SKU: ${editingProduct.sku} · ${editingProduct.cat}`
                : t.descPlaceholder}
            </span>
          </div>
          <button type="button" className="table-action-pill" onClick={onClose} style={{ width: 34, height: 34, padding: 0, fontSize: 16 }}>
            ✕
          </button>
        </div>

        <div className="admin-modal-body" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.nameLabel}</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.skuLabel}</label>
              <input className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t.skuPlaceholder} style={{ fontFamily: 'monospace' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.catLabel}</label>
              <select className="sort-select luxury-select-pill" value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: '100%', height: 42 }}>
                <option value="Men's">{currentLang === 'km' ? 'បុរស' : "Men's"}</option>
                <option value="Women's">{currentLang === 'km' ? 'នារី' : "Women's"}</option>
                <option value="Kids">{currentLang === 'km' ? 'កុមារ' : 'Kids'}</option>
                <option value="Shoes">{currentLang === 'km' ? 'ស្បែកជើង' : 'Shoes'}</option>
                <option value="Accessories">{currentLang === 'km' ? 'គ្រឿងតុបតែង' : 'Accessories'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.brandLabel}</label>
              <input className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t.brandPlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.statusLabel}</label>
              <select className="sort-select luxury-select-pill" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', height: 42 }}>
                <option value="active">{t.statusActive}</option>
                <option value="draft">{t.statusDraft}</option>
                <option value="archived">{t.statusArchived}</option>
                <option value="out_of_stock">{t.statusOutOfStock}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.priceLabel}</label>
              <input type="number" step="0.01" min="0" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.salePriceLabel}</label>
              <input type="number" step="0.01" min="0" className="form-control" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder={t.salePricePlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.stockLabel}</label>
              <input type="number" min="0" className="form-control" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.totalSoldLabel}</label>
              <input type="number" min="0" className="form-control" value={sales} onChange={(e) => setSales(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Visual Scroll Grid vs Normal Grid Picker */}
          <div className="modal-grid-picker">
            <div className="modal-grid-picker-head">
              <div>
                <div className="modal-grid-picker-title">{t.gridPickerTitle}</div>
                <div className="modal-grid-picker-sub">{t.gridPickerSub}</div>
              </div>
              <div className="grid-preset-bar">
                {[
                  { id: 'scroll', label: t.presetScrollOnly },
                  { id: 'normal', label: t.presetNormalOnly },
                  { id: 'both', label: t.presetBoth },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`grid-preset-btn ${activePreset === preset.id ? 'is-active' : ''}`}
                    onClick={() => applyPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-choice-cards">
              <label className={`grid-choice-card is-scroll ${inScrollBox ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={inScrollBox} onChange={(e) => setInScrollBox(e.target.checked)} />
                <div className="grid-wireframe" aria-hidden="true">
                  <div className="grid-wire-scroll">
                    <div className="grid-wire-scroll-cards">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="grid-wire-track" />
                  </div>
                </div>
                <div className="grid-choice-meta">
                  <div className="grid-choice-name">{t.scrollGridName}</div>
                  <div className="grid-choice-desc">{t.scrollGridDesc}</div>
                </div>
                <span className="grid-choice-check" aria-hidden="true">✓</span>
              </label>

              <label className={`grid-choice-card is-normal ${inNormalGrid ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={inNormalGrid} onChange={(e) => setInNormalGrid(e.target.checked)} />
                <div className="grid-wireframe" aria-hidden="true">
                  <div className="grid-wire-normal">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="grid-choice-meta">
                  <div className="grid-choice-name">{t.normalGridName}</div>
                  <div className="grid-choice-desc">{t.normalGridDesc}</div>
                </div>
                <span className="grid-choice-check" aria-hidden="true">✓</span>
              </label>
            </div>

            <div className="modal-highlight-chips">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.badgesLabel}
              </span>
              <label className={`highlight-chip-label ${isNew ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                <span>{t.badgeNew}</span>
              </label>
              <label className={`highlight-chip-label ${featured ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                <span>{t.badgeFeatured}</span>
              </label>
            </div>
          </div>

          {/* Product Imagery */}
          <div className="form-group modal-imagery-box">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{t.imageryLabel}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{t.imageryHint}</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'start' }}>
              <div
                className="img-preview-box"
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 10,
                  border: image ? '1px solid var(--border)' : '1.5px dashed var(--border)',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80';
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, lineHeight: 1.2 }}>
                    <div style={{ fontSize: 20, marginBottom: 2, opacity: 0.6 }}>🖼️</div>
                    <span>{t.noImage}</span>
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    className="form-control"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder={t.enterUrlPlaceholder}
                    style={{ height: 36, fontSize: 12.5 }}
                  />
                  <label className="btn-luxury-action-pill is-outline" style={{ height: 38, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    📷 {t.uploadBtn}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.presetsLabel}</span>
                  {IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="table-action-pill"
                      style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                      onClick={() => setImage(p.url)}
                    >
                      {p.label}
                    </button>
                  ))}
                  {image && (
                    <button
                      type="button"
                      className="table-action-pill is-delete"
                      style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                      onClick={() => setImage('')}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>{t.descLabel}</label>
            <textarea
              className="form-control"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t.descPlaceholder}
            />
          </div>
        </div>

        <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {editingProduct && (
              <button type="button" className="table-action-pill is-delete" style={{ height: 38, padding: '0 16px' }} onClick={() => onDelete(editingProduct.sku)}>
                🗑️ {t.btnDelete}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-luxury-action-pill is-secondary" onClick={onClose}>
              {t.btnCancel}
            </button>
            <button type="button" className="btn-luxury-action-pill is-primary" onClick={handleSave}>
              {editingProduct ? `✓ ${t.btnSave}` : `✨ ${t.btnCreate}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

