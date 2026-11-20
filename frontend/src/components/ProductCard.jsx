import React, { useState } from 'react';
import { formatKHR, formatUSD, getLang } from '../lib/store';
import { HeartIcon } from './Icons';

export default function ProductCard({ product, isWishlisted, onToggleWishlist, onOpenQuickView, lang: propLang }) {
  const lang = propLang || getLang();
  const [actionsVisible, setActionsVisible] = useState(false);

  const discPct =
    product.sale_price && product.sale_price < product.price
      ? Math.round(((product.price - product.sale_price) / product.price) * 100)
      : 0;
  const activePrice = product.sale_price || product.price;
  const pid = product.id ?? product.sku ?? '';

  return (
    <div
      className={`product-card animate-in ${actionsVisible ? 'product-actions-visible' : ''}`}
      onClick={() => setActionsVisible(true)}
    >
      <div className="product-card-img" onClick={() => onOpenQuickView(product)}>
        <img src={product.image} alt={product.name} loading="lazy" style={{ cursor: 'pointer' }} />
        {discPct > 0 && <span className="discount-tag">-{discPct}%</span>}
        {product.isNew && <span className="discount-tag product-new-tag">{lang === 'km' ? 'ថ្មី' : 'NEW'}</span>}
        <button
          type="button"
          className="wishlist-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          title={isWishlisted ? (lang === 'km' ? 'ដកចេញពីបញ្ជីប្រាថ្នា' : 'Remove from wishlist') : (lang === 'km' ? 'បញ្ចូលក្នុងបញ្ជីប្រាថ្នា' : 'Add to wishlist')}
          aria-label={isWishlisted ? (lang === 'km' ? 'ដកចេញពីបញ្ជីប្រាថ្នា' : 'Remove from wishlist') : (lang === 'km' ? 'បញ្ចូលក្នុងបញ្ជីប្រាថ្នា' : 'Add to wishlist')}
        >
          <HeartIcon size={17} filled={isWishlisted} />
        </button>
        <div className="product-card-actions">
          <button
            type="button"
            className="btn btn-product-view"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView(product);
            }}
            aria-label={lang === 'km' ? `មើលទំនិញ ${product.name}` : `View ${product.name}`}
          >
            {lang === 'km' ? 'មើលរហ័ស' : 'Quick View'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-card-brand">{product.brand || 'Fashion Store KH'}</div>
        <div className="product-card-name" style={{ cursor: 'pointer' }} onClick={() => onOpenQuickView(product)}>
          {product.name}
        </div>
        <div className="product-card-price">
          <span className={`price-current ${product.sale_price ? 'price-sale' : ''}`}>{formatUSD(activePrice)}</span>
          {product.sale_price ? <span className="price-original">{formatUSD(product.price)}</span> : null}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatKHR(activePrice)}</div>
      </div>
    </div>
  );
}

