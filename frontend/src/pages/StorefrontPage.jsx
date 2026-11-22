import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BagIcon,
  CambodiaFlagIcon,
  ClockIcon,
  CreditCardIcon,
  HeartIcon,
  MailIcon,
  MapPinIcon,
  MoonIcon,
  PhoneIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersIcon,
  StarIcon,
  SunIcon,
  TruckIcon,
  UkFlagIcon,
} from '../components/Icons';
import {
  CartDrawer,
  CheckoutModal,
  OrdersModal,
  QuickViewModal,
  SearchModal,
  WishlistDrawer,
} from '../components/StorefrontModals';
import {
  CATEGORY_HEROES,
  clearAuth,
  getCart,
  getCategoryHero,
  getLang,
  getOrders,
  getProducts,
  getStorefrontLayout,
  getUser,
  getWishlist,
  isAdminUser,
  isInNormalGrid,
  isInScrollBox,
  KEYS,
  normalizeProductCat,
  notify,
  saveLang,
  toggleWishlistItem,
} from '../lib/store';
import { STOREFRONT_T } from '../lib/storefrontTranslations';

const NAV_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'men', label: "Men's" },
  { key: 'women', label: "Women's" },
  { key: 'kids', label: 'Kids' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'sale', label: 'Sale 🔥' },
];

const LOOKBOOK_REFERENCES = [
  {
    id: 'ref-linen',
    tag: 'Look 01 · Tropical Smart Casual',
    title: 'The Phnom Penh Linen Edit',
    note: 'Breathable 100% natural European linen paired with tailored tapered chinos, perfected for humid city mornings, gallery openings, and tropical elegance.',
    category: 'men',
    sku: 'CS-MSH-001',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=85',
  },
  {
    id: 'ref-women',
    tag: 'Look 02 · Evening & Resort Capsule',
    title: 'Summer Silk & Twilight Wrap Edit',
    note: 'Fluid silk-satin silhouettes in sun-warmed earth tones and botanical prints, crafted for twilight rooftop dinners and effortless weekend coastal retreats.',
    category: 'women',
    sku: null,
    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85',
  },
];

const CUSTOMER_REFERENCES = [
  {
    id: 'rev-1',
    author: 'Dara Sok',
    location: 'BKK1, Phnom Penh',
    item: 'White Sneakers',
    quote: 'Ordered via Bakong KHQR at 10 AM and received my sneakers the same afternoon. Quality and box presentation feel truly boutique.',
  },
  {
    id: 'rev-2',
    author: 'Sreymom Chann',
    location: 'Toul Kork, Phnom Penh',
    item: 'Essential Linen Shirt',
    quote: 'The linen fabric stays cool even in hot weather and fits cleanly right out of the package. Already added two more colors.',
  },
  {
    id: 'rev-3',
    author: 'Vannak Rith',
    location: 'Siem Reap',
    item: 'Leather Crossbody Bag',
    quote: 'Stitching and brass hardware are super sturdy. Fast response from support and easy Cash on Delivery option.',
  },
];

export default function StorefrontPage({ initialCategory = 'all', theme, onToggleTheme, onNavigate }) {
  const [lang, setLang] = useState(() => getLang());
  const t = STOREFRONT_T[lang] || STOREFRONT_T.km;

  useEffect(() => {
    const handleSyncLang = (e) => {
      setLang(e.detail || getLang());
    };
    window.addEventListener('fashionstore:lang', handleSyncLang);
    return () => window.removeEventListener('fashionstore:lang', handleSyncLang);
  }, []);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    saveLang(newLang);
  };

  const navCategories = useMemo(
    () => [
      { key: 'all', label: t.nav.categories.all },
      { key: 'men', label: t.nav.categories.men },
      { key: 'women', label: t.nav.categories.women },
      { key: 'kids', label: t.nav.categories.kids },
      { key: 'shoes', label: t.nav.categories.shoes },
      { key: 'accessories', label: t.nav.categories.accessories },
      { key: 'sale', label: t.nav.categories.sale },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      { value: 'popular', label: lang === 'km' ? 'ពេញនិយម' : 'Popular' },
      { value: 'newest', label: lang === 'km' ? 'មកដល់ថ្មីៗ' : 'Newest First' },
      { value: 'price_asc', label: lang === 'km' ? 'តម្លៃ៖ ទាបទៅខ្ពស់' : 'Price: Low to High' },
      { value: 'price_desc', label: lang === 'km' ? 'តម្លៃ៖ ខ្ពស់ទៅទាប' : 'Price: High to Low' },
    ],
    [lang]
  );

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [filterChip, setFilterChip] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const [products, setProducts] = useState(() => getProducts());
  const [layout, setLayout] = useState(() => getStorefrontLayout());
  const [cart, setCart] = useState(() => getCart());
  const [wishlist, setWishlist] = useState(() => getWishlist());
  const [orders, setOrders] = useState(() => getOrders());
  const [user, setUser] = useState(() => getUser());

  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactSending, setContactSending] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      notify('Please enter your email and message.', 'error');
      return;
    }
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      notify('Thank you! Your message has been sent to our flagship team.', 'success');
    }, 600);
  };

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  const carouselRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const shopSectionRef = useRef(null);
  const normalSectionRef = useRef(null);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  // Sync live updates across Admin <-> Storefront tabs & events
  useEffect(() => {
    const syncAll = () => {
      setProducts(getProducts());
      setLayout(getStorefrontLayout());
      setCart(getCart());
      setWishlist(getWishlist());
      setOrders(getOrders());
      setUser(getUser());
    };

    const onStorage = (e) => {
      if (!e.key || [KEYS.PRODUCTS, KEYS.CATALOG_VERSION, KEYS.LAYOUT, KEYS.CART, KEYS.WISHLIST, KEYS.ORDERS, KEYS.USER, KEYS.TOKEN].includes(e.key)) {
        syncAll();
      }
    };

    window.addEventListener('catalogUpdated', syncAll);
    window.addEventListener('storefrontLayoutUpdated', syncAll);
    window.addEventListener('fashionstore:cart', () => setCart(getCart()));
    window.addEventListener('fashionstore:wishlist', () => setWishlist(getWishlist()));
    window.addEventListener('fashionstore:orders', () => setOrders(getOrders()));
    window.addEventListener('fashionstore:auth', () => setUser(getUser()));
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncAll);
    return () => {
      window.removeEventListener('catalogUpdated', syncAll);
      window.removeEventListener('storefrontLayoutUpdated', syncAll);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncAll);
    };
  }, []);

  // Close sort dropdown on outside click / Escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSortMenuOpen(false);
        setUserMenuOpen(false);
        setSearchOpen(false);
        setQuickViewProduct(null);
        setCartOpen(false);
        setWishlistOpen(false);
        setCheckoutOpen(false);
        setOrdersOpen(false);
      }
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const hero = useMemo(() => getCategoryHero(activeCategory, lang), [activeCategory, lang]);

  useEffect(() => {
    document.title = hero.pageTitle || 'Fashion Store';
  }, [hero.pageTitle]);

  const baseCategoryProducts = useMemo(() => {
    const visible = products.filter((p) => !p.status || p.status === 'active' || p.status === 'out_of_stock');
    if (activeCategory === 'sale') {
      return visible.filter((p) => p.sale_price && p.sale_price < p.price);
    }
    if (activeCategory !== 'all') {
      return visible.filter((p) => normalizeProductCat(p) === activeCategory);
    }
    return visible;
  }, [products, activeCategory]);

  const scrollBoxProducts = useMemo(() => {
    const hasExplicitScrollFlags = products.some((p) => typeof p.inScrollBox === 'boolean');
    const highlighted = baseCategoryProducts.filter((p) => isInScrollBox(p));
    return hasExplicitScrollFlags || highlighted.length >= 4 ? highlighted : baseCategoryProducts;
  }, [products, baseCategoryProducts]);

  const normalGridProducts = useMemo(() => {
    let list = baseCategoryProducts.filter((p) => isInNormalGrid(p));
    if (filterChip === 'sale') list = list.filter((p) => p.sale_price && p.sale_price < p.price);
    if (filterChip === 'new') list = list.filter((p) => p.isNew);
    if (filterChip === 'featured') list = list.filter((p) => p.featured);

    if (sortBy === 'popular') {
      list.sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0));
    }
    if (sortBy === 'price_asc') list.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    if (sortBy === 'price_desc') list.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    if (sortBy === 'newest') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    return list;
  }, [baseCategoryProducts, filterChip, sortBy]);

  const popularProducts = useMemo(() => {
    const pool = baseCategoryProducts.length ? baseCategoryProducts : products;
    return [...pool]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [baseCategoryProducts, products]);

  const updateCarouselControls = () => {
    const el = carouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setHasHorizontalOverflow(maxScroll > 2);
    setCanScrollPrev(el.scrollLeft > 2);
    setCanScrollNext(el.scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    updateCarouselControls();
    window.addEventListener('resize', updateCarouselControls);
    return () => window.removeEventListener('resize', updateCarouselControls);
  }, [scrollBoxProducts, layout.showScrollBox]);

  const scrollCarouselByCard = (dir) => {
    const el = carouselRef.current;
    const card = el?.querySelector('.product-card');
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 22;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setFilterChip('all');
    onNavigate(cat === 'all' ? '/' : `/${cat}`);
    setTimeout(() => {
      const target = layout.showScrollBox ? shopSectionRef.current : normalSectionRef.current;
      target?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleToggleWishlist = (p) => {
    const added = toggleWishlistItem(p);
    notify(added ? `Saved "${p.name}" to wishlist ❤️` : `Removed "${p.name}" from wishlist`, added ? 'success' : 'default');
  };

  const isProductWishlisted = (p) => {
    const pid = p.id ?? p.sku;
    return wishlist.some((w) => w.id == pid || (w.sku && w.sku === p.sku));
  };

  const cartCount = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const activeSortLabel = sortOptions.find((s) => s.value === sortBy)?.label || (lang === 'km' ? 'ពេញនិយម' : 'Popular');
  const adminLoggedIn = isAdminUser(user);

  const scrollTitle = activeCategory === 'all' ? (lang === 'km' ? 'ទំនិញមកដល់ថ្មីៗ' : (layout.scrollTitle || 'New Arrivals')) : hero.scrollTitle;
  const normalTitle = activeCategory === 'all' ? (lang === 'km' ? 'ផលិតផលទាំងអស់' : (layout.normalTitle || 'All Products')) : hero.catalogTitle;

  const scrollSectionNode = layout.showScrollBox ? (
    <section key="scroll-box" className="section" id="shop" ref={shopSectionRef} style={{ paddingBottom: 32 }}>
      <div className="container-lg">
        <div className="section-header product-section-header" style={{ textAlign: 'left' }}>
          <div>
            <div
              className="eyebrow"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}
            >
              {layout.scrollEyebrow || (lang === 'km' ? 'បណ្តុំទំនិញពិសេស' : 'Featured Collection')}
            </div>
            <h2>{scrollTitle}</h2>
          </div>
          <div className="product-section-actions">
            {hasHorizontalOverflow && (
              <div className="product-carousel-controls">
                <span className="product-carousel-hint">
                  <span className="carousel-hint-pulse" aria-hidden="true" />
                  {lang === 'km' ? 'អូសដើម្បីមើលបន្ថែម' : 'Scroll to explore'}
                </span>
                <div className="product-carousel-arrows-capsule">
                  <button
                    type="button"
                    className="product-carousel-arrow"
                    onClick={() => scrollCarouselByCard(-1)}
                    disabled={!canScrollPrev}
                    aria-label="Scroll to previous products"
                  >
                    <ArrowLeftIcon size={15} />
                  </button>
                  <button
                    type="button"
                    className="product-carousel-arrow"
                    onClick={() => scrollCarouselByCard(1)}
                    disabled={!canScrollNext}
                    aria-label="Scroll to more products"
                  >
                    <ArrowRightIcon size={15} />
                  </button>
                </div>
              </div>
            )}
            {layout.showNormalGrid && (
              <button
                type="button"
                className="btn-luxury-view-all"
                onClick={() => normalSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>{lang === 'km' ? 'មើលទំនិញទាំងអស់' : 'View All Products'}</span>
                <span className="btn-luxury-view-all-arrow">→</span>
              </button>
            )}
          </div>
        </div>

        <div className="products-grid" id="productsGrid" ref={carouselRef} onScroll={updateCarouselControls}>
          {scrollBoxProducts.length ? (
            scrollBoxProducts.map((p) => (
              <ProductCard
                key={p.sku || p.id}
                product={p}
                lang={lang}
                isWishlisted={isProductWishlisted(p)}
                onToggleWishlist={handleToggleWishlist}
                onOpenQuickView={setQuickViewProduct}
              />
            ))
          ) : (
            <div className="products-empty-state">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍</div>
              <h3>{lang === 'km' ? 'មិនទាន់មានទំនិញក្នុងប្រអប់រំកិលទេ' : 'No products in Scroll Grid'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                {lang === 'km' ? 'សូមបន្ថែមទំនិញពីផ្ទាំងគ្រប់គ្រង Admin ឬមើលកាតាឡុកខាងក្រោម។' : 'Assign products from the Admin Dashboard or view the full catalog below.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  ) : null;

  const normalSectionNode = layout.showNormalGrid ? (
    <section key="normal-grid" className="section" id="all-products" ref={normalSectionRef} style={{ paddingTop: 24 }}>
      <div className="container-lg">
        <div className="section-header product-section-header" style={{ textAlign: 'left' }}>
          <div>
            <div
              className="eyebrow"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}
            >
              {layout.normalEyebrow || (lang === 'km' ? 'កាតាឡុកទំនិញពេញលេញ' : 'Complete Catalog')}
            </div>
            <h2>{normalTitle}</h2>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-chips">
            {[
              { id: 'all', label: lang === 'km' ? 'ទាំងអស់' : 'All' },
              { id: 'sale', label: lang === 'km' ? 'បញ្ចុះតម្លៃ' : 'On Sale', icon: '🔥' },
              { id: 'new', label: lang === 'km' ? 'មកដល់ថ្មី' : 'New In', icon: '✨' },
              { id: 'featured', label: lang === 'km' ? 'ពិសេស' : 'Featured', icon: '⭐' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`filter-chip ${filterChip === chip.id ? 'active' : ''}`}
                onClick={() => setFilterChip(chip.id)}
              >
                {chip.icon && <span className="filter-chip-icon">{chip.icon}</span>}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          <div className="filter-bar-meta">
            <span className="filter-count-badge">
              {lang === 'km' ? (
                <>
                  បង្ហាញទំនិញចំនួន <strong>{normalGridProducts.length}</strong> មុខ
                </>
              ) : (
                <>
                  Showing <strong>{normalGridProducts.length}</strong> products
                </>
              )}
            </span>
          </div>

          <div className={`sort-dropdown ${sortMenuOpen ? 'open' : ''}`} ref={sortDropdownRef}>
            <button
              type="button"
              className="sort-trigger"
              onClick={() => setSortMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={sortMenuOpen}
            >
              <SlidersIcon size={13} />
              <span className="sort-trigger-label">{lang === 'km' ? 'តម្រៀប៖' : 'Sort:'}</span>
              <span className="sort-trigger-value">{activeSortLabel}</span>
              <span className="sort-trigger-chevron">▾</span>
            </button>
            <div className="sort-menu" role="listbox">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`sort-option ${sortBy === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  <span className="sort-option-check">✓</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="products-grid" id="catalogGrid">
          {normalGridProducts.length ? (
            normalGridProducts.map((p) => (
              <ProductCard
                key={p.sku || p.id}
                product={p}
                lang={lang}
                isWishlisted={isProductWishlisted(p)}
                onToggleWishlist={handleToggleWishlist}
                onOpenQuickView={setQuickViewProduct}
              />
            ))
          ) : (
            <div className="products-empty-state">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍</div>
              <h3>{lang === 'km' ? 'មិនមានទំនិញត្រូវនឹងលក្ខខណ្ឌនេះទេ' : 'No products match this filter'}</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setFilterChip('all')}>
                {lang === 'km' ? 'កំណត់លក្ខខណ្ឌឡើងវិញ' : 'Reset Filters'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button type="button" className="btn btn-outline" disabled>
            {lang === 'km' ? `បង្ហាញទំនិញទាំង ${normalGridProducts.length} មុខរួចរាល់ ✓` : `Showing All ${normalGridProducts.length} Items ✓`}
          </button>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <div className="storefront-page-shell">
      {/* Header */}
      <header className="navbar">
        <div className="container-lg navbar-inner">
          <a
            href="/"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              handleSelectCategory('all');
            }}
          >
            Fashion Store<span>.</span>
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            {navCategories.map((c) => (
              <a
                key={c.key}
                href={c.key === 'all' ? '/' : `/${c.key}`}
                className={`nav-link ${activeCategory === c.key ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectCategory(c.key);
                }}
              >
                {c.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            {/* Language Switcher (KM / EN) with responsive mobile toggle */}
            <div className="nav-lang-switcher">
              {/* Desktop Dual Buttons */}
              <div className="nav-lang-desktop">
                <button
                  type="button"
                  className={`lang-pill-btn ${lang === 'km' ? 'active' : ''}`}
                  onClick={() => handleLangChange('km')}
                  title="ប្ដូរទៅភាសាខ្មែរ (Khmer)"
                >
                  <CambodiaFlagIcon size={14} />
                  <span>ភាសាខ្មែរ</span>
                </button>
                <button
                  type="button"
                  className={`lang-pill-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => handleLangChange('en')}
                  title="Switch to English"
                >
                  <UkFlagIcon size={14} />
                  <span>English</span>
                </button>
              </div>

              {/* Mobile Single Compact Toggle Pill - Photo 2 Style */}
              <button
                type="button"
                className="nav-lang-mobile"
                onClick={() => handleLangChange(lang === 'km' ? 'en' : 'km')}
                title={lang === 'km' ? 'Switch to English' : 'ប្ដូរទៅភាសាខ្មែរ'}
                aria-label="Toggle Language"
              >
                {lang === 'km' ? (
                  <>
                    <CambodiaFlagIcon size={15} />
                    <span>ខ្មែរ</span>
                  </>
                ) : (
                  <>
                    <UkFlagIcon size={15} />
                    <span>EN</span>
                  </>
                )}
              </button>
            </div>

            <button type="button" className="nav-icon-btn" onClick={() => setSearchOpen(true)} title={t.nav.searchTitle} aria-label="Search">
              <SearchIcon size={18} />
            </button>
            <button type="button" className="nav-icon-btn" onClick={onToggleTheme} title={t.nav.themeTitle} aria-label="Toggle Theme">
              {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>
            <button type="button" className="nav-icon-btn" onClick={() => setWishlistOpen(true)} title={t.nav.wishlistTitle} aria-label="Wishlist">
              <HeartIcon size={18} filled={wishlist.length > 0} />
              {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
            </button>
            <button type="button" className="nav-icon-btn" onClick={() => setCartOpen(true)} title={t.nav.bagTitle} aria-label="Shopping Bag">
              <BagIcon size={18} />
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </button>

            {adminLoggedIn && (
              <button type="button" className="btn btn-outline btn-sm nav-admin-btn" onClick={() => onNavigate('/admin')}>
                <SlidersIcon size={14} />
                <span>{t.nav.adminBtn}</span>
              </button>
            )}

            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`nav-user-pill-btn ${userMenuOpen ? 'is-active' : ''}`}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-label="User Account Menu"
                >
                  {user.avatar || user.avatar_url ? (
                    <img
                      src={user.avatar || user.avatar_url}
                      alt={user.name}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: 6,
                        border: '1.5px solid var(--accent)',
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="nav-user-avatar-dot">
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="nav-user-name">
                    {user.name?.split(' ')[0] || (lang === 'km' ? 'គណនី' : 'Account')}
                  </span>
                  <span className={`nav-user-chevron ${userMenuOpen ? 'open' : ''}`}>▾</span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown-menu" style={{ right: 0, top: 'calc(100% + 10px)' }}>
                    <div className="user-dropdown-header">
                      {user.avatar || user.avatar_url ? (
                        <img
                          src={user.avatar || user.avatar_url}
                          alt={user.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--accent)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                        />
                      ) : (
                        <div className="user-dropdown-avatar">
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-name">{user.name || (lang === 'km' ? 'អតិថិជនកិត្តិយស' : 'Valued Customer')}</div>
                        <div className="user-dropdown-email" title={user.email}>{user.email}</div>
                        <span className="user-dropdown-badge">
                          {adminLoggedIn ? (lang === 'km' ? 'អ្នកគ្រប់គ្រងហាង' : 'Store Administrator') : (lang === 'km' ? 'អតិថិជនបានផ្ទៀងផ្ទាត់' : 'Verified Customer')}
                        </span>
                      </div>
                    </div>

                    <div className="user-dropdown-divider" />

                    <div className="user-dropdown-items">
                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setOrdersOpen(true);
                        }}
                      >
                        <span className="user-dropdown-item-left">
                          <span className="user-dropdown-item-icon">📦</span>
                          <span>{t.nav.ordersBtn}</span>
                        </span>
                        {orders.length > 0 && (
                          <span className="user-dropdown-item-count">{orders.length}</span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setWishlistOpen(true);
                        }}
                      >
                        <span className="user-dropdown-item-left">
                          <span className="user-dropdown-item-icon">♡</span>
                          <span>{t.nav.wishlistTitle}</span>
                        </span>
                        {wishlist.length > 0 && (
                          <span className="user-dropdown-item-count">{wishlist.length}</span>
                        )}
                      </button>

                      {adminLoggedIn && (
                        <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/admin');
                          }}
                        >
                          <span className="user-dropdown-item-left">
                            <span className="user-dropdown-item-icon">⚙</span>
                            <span>{t.nav.adminBtn}</span>
                          </span>
                          <span className="user-dropdown-item-arrow">→</span>
                        </button>
                      )}

                      <div className="user-dropdown-divider" />

                      <button
                        type="button"
                        className="user-dropdown-item is-logout"
                        onClick={() => {
                          clearAuth();
                          setUserMenuOpen(false);
                          notify(lang === 'km' ? 'បានចាកចេញដោយជោគជ័យ។' : 'Signed out successfully.', 'default');
                        }}
                      >
                        <span className="user-dropdown-item-left">
                          <span className="user-dropdown-item-icon">🚪</span>
                          <span>{t.nav.signOutBtn}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-sm nav-signin-btn" onClick={() => onNavigate('/login')}>
                <span className="nav-signin-desktop">{t.nav.signInBtn}</span>
                <span className="nav-signin-mobile">{lang === 'km' ? 'ចូល' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — Perfect Split Layout */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-eyebrow">{hero.eyebrow}</div>
            <h1 className="hero-title">
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
              {hero.titleLine2 === '.' ? '.' : (
                <>
                  <br />
                  {hero.titleLine2}
                </>
              )}
            </h1>
            <p className="hero-desc">{hero.desc}</p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => (shopSectionRef.current || normalSectionRef.current)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {hero.btnText} →
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-img-frame">
              <img
                src={hero.img}
                alt={hero.eyebrow}
                style={{ objectPosition: hero.imgPosition || 'center 42%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <div className="category-strip">
        <div className="container-lg category-strip-inner">
          {navCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`category-pill ${activeCategory === c.key ? 'active' : ''}`}
              onClick={() => handleSelectCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Box Sections in Admin-configured Order */}
      {layout.order === 'normal_first'
        ? [normalSectionNode, scrollSectionNode]
        : [scrollSectionNode, normalSectionNode]}

      {/* Most Popular Products Section */}
      {popularProducts.length > 0 && (
        <section className="section popular-showcase" id="popular-products">
          <div className="container-lg">
            <div className="section-header product-section-header" style={{ textAlign: 'left', marginBottom: 24 }}>
              <div>
                <div className="eyebrow popular-eyebrow">
                  {lang === 'km' ? 'ទំនិញពេញនិយម · ការវាយតម្លៃខ្ពស់បំផុត' : 'Community Favorites · Top Rated'}
                </div>
                <h2>
                  {lang === 'km'
                    ? `ទំនិញលក់ដាច់បំផុត ${activeCategory !== 'all' ? `ផ្នែក${navCategories.find((c) => c.key === activeCategory)?.label || ''}` : 'ប្រចាំហាង'}`
                    : `Most Popular ${activeCategory !== 'all' ? `in ${navCategories.find((c) => c.key === activeCategory)?.label || ''}` : 'Products'}`}
                </h2>
              </div>
              <button
                type="button"
                className="btn-luxury-view-all"
                onClick={() => {
                  setSortBy('popular');
                  normalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>{lang === 'km' ? 'តម្រៀបតាមទំនិញពេញនិយម' : 'Sort Catalog by Popular'}</span>
                <span className="btn-luxury-view-all-arrow">→</span>
              </button>
            </div>

            <div className="popular-grid">
              {popularProducts.map((p, index) => {
                const activePrice = p.sale_price || p.price;
                const wishlisted = isProductWishlisted(p);
                return (
                  <article key={p.sku || p.id} className="popular-card" onClick={() => setQuickViewProduct(p)}>
                    <div className="popular-card-media">
                      <img src={p.image} alt={p.name} loading="lazy" />
                      <span className="popular-rank-pill">#{index + 1} {lang === 'km' ? 'លក់ដាច់បំផុត' : 'Best Seller'}</span>
                      <button
                        type="button"
                        className="wishlist-btn popular-wish-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(p);
                        }}
                        aria-label={wishlisted ? (lang === 'km' ? 'ដកចេញពីបញ្ជីប្រាថ្នា' : 'Remove from wishlist') : (lang === 'km' ? 'បញ្ចូលក្នុងបញ្ជីប្រាថ្នា' : 'Add to wishlist')}
                      >
                        <HeartIcon size={16} filled={wishlisted} />
                      </button>
                    </div>
                    <div className="popular-card-body">
                      <div className="popular-meta-row">
                        <span className="popular-brand">{p.brand || 'Fashion Store KH'}</span>
                        <span className="popular-rating">★ {(Number(p.rating) || 4.9).toFixed(1)} ({p.reviews || p.sales || 24})</span>
                      </div>
                      <h3 className="popular-title">{p.name}</h3>
                      <div className="popular-stats-row">
                        <div>
                          <span className="popular-price">{formatUSD(activePrice)}</span>
                          {p.sale_price && <span className="price-original" style={{ marginLeft: 8 }}>{formatUSD(p.price)}</span>}
                        </div>
                        <span className="popular-sold-pill">{p.sales || 0} {lang === 'km' ? 'បានលក់' : 'sold'}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm popular-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(p);
                        }}
                      >
                        {lang === 'km' ? 'មើលរហ័ស →' : 'Quick View →'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── The Art of Fashion Craftsmanship Section ── */}
      <section className="section craft-section" id="art-of-fashion">
        <div className="container-lg">
          <div className="craft-grid">
            <div className="craft-content">
              <span className="craft-eyebrow">
                {lang === 'km' ? 'ច្នៃប្រឌិតដោយក្ដីស្រឡាញ់' : 'CRAFTED WITH PASSION'}
              </span>
              <h2 className="craft-title">
                {lang === 'km' ? 'សិល្បៈនៃការច្នៃម៉ូដសម្លៀកបំពាក់' : 'The Art of Fashion'}
              </h2>
              <p className="craft-description">
                {lang === 'km'
                  ? 'ចំណុចប្រសព្វរវាងប្រពៃណី និងភាពច្នៃប្រឌិតសម័យទំនើប។ ជាងកាត់ដេរជំនាញរបស់យើងរួមបញ្ចូលគ្នានូវបច្ចេកទេសបុរាណ និងការរចនាបែបទំនើបដើម្បីបង្កើតស្នាដៃដ៏ល្អឥតខ្ចោះ។'
                  : 'Where tradition meets innovation. Our master craftsmen blend centuries-old techniques with cutting-edge design to create pieces that transcend time and trends.'}
              </p>

              <div className="craft-features-row">
                <div className="craft-feature-card">
                  <div className="craft-feature-icon-badge" aria-hidden="true">👑</div>
                  <div className="craft-feature-text">
                    <h4>{lang === 'km' ? 'គុណភាពកម្រិតខ្ពស់' : 'Premium Quality'}</h4>
                    <p>{lang === 'km' ? 'មានតែសាច់ក្រណាត់ និងសម្ភារៈល្អប្រណីតបំផុតប៉ុណ្ណោះដែលត្រូវបានជ្រើសរើស' : 'Only the finest materials and fabrics make it into our collections'}</p>
                  </div>
                </div>

                <div className="craft-feature-card">
                  <div className="craft-feature-icon-badge" aria-hidden="true">🌱</div>
                  <div className="craft-feature-text">
                    <h4>{lang === 'km' ? 'និរន្តរភាពបរិស្ថាន' : 'Sustainable'}</h4>
                    <p>{lang === 'km' ? 'វត្ថុធាតុដើមធម្មជាតិគ្មានជាតិគីមី និងការពារបរិស្ថានបៃតង' : 'Ethically sourced materials with carbon-neutral production'}</p>
                  </div>
                </div>

                <div className="craft-feature-card">
                  <div className="craft-feature-icon-badge" aria-hidden="true">✨</div>
                  <div className="craft-feature-text">
                    <h4>{lang === 'km' ? 'កាត់ដេរយ៉ាងផ្ចិតផ្ចង់' : 'Handcrafted'}</h4>
                    <p>{lang === 'km' ? 'រាល់ម៉ូដសម្លៀកបំពាក់ត្រូវបានកាត់ដេរយ៉ាងម៉ត់ចត់ដោយជាងជំនាញ' : 'Each piece is carefully crafted by skilled artisans'}</p>
                  </div>
                </div>
              </div>

              <div className="craft-actions">
                <button
                  type="button"
                  className="craft-action-btn"
                  onClick={() => normalSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {lang === 'km' ? 'ស្វែងយល់ពីស្នាដៃរបស់យើង' : 'DISCOVER OUR CRAFT'}
                </button>
              </div>
            </div>

            <div className="craft-visual">
              <div className="craft-mosaic-frame">
                <div className="craft-mosaic-left">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=85"
                    alt="Flagship Boutique Showroom"
                    loading="lazy"
                  />
                </div>
                <div className="craft-mosaic-right">
                  <div className="craft-mosaic-sub">
                    <img
                      src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=85"
                      alt="Curated Collection Rack"
                      loading="lazy"
                    />
                  </div>
                  <div className="craft-mosaic-sub">
                    <img
                      src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=85"
                      alt="Garments on Wooden Hangers"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Style & Customer References Section */}
      <section className="section references-section" id="references">
        <div className="container-lg">
          <div className="section-header product-section-header" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div>
              <div className="eyebrow popular-eyebrow">
                {lang === 'km' ? 'មតិពីអតិថិជនពិតប្រាកដ' : 'Verified Buyer References'}
              </div>
              <h2>
                {lang === 'km' ? 'ការវាយតម្លៃ & មតិយោបល់អតិថិជន' : 'Style References & Customer Reviews'}
              </h2>
            </div>
            <div className="ref-trust-badge">
              <span className="ref-trust-star" aria-hidden="true">
                <StarIcon size={14} filled />
              </span>
              <span className="ref-trust-score-wrap">
                <strong className="ref-trust-score">4.9</strong>
                <span className="ref-trust-max">/ 5.0</span>
              </span>
              <span className="ref-trust-sep">·</span>
              <span className="ref-trust-label">{lang === 'km' ? 'ពិន្ទុមធ្យម' : 'Average Rating'}</span>
              <span className="ref-trust-editorial-pill">
                {lang === 'km' ? 'ការណែនាំពីហាង & អ្នកទិញ' : 'Editorial & Buyer Guide'}
              </span>
            </div>
          </div>

          <div className="customer-refs-grid">
            {CUSTOMER_REFERENCES.map((rev) => (
              <blockquote key={rev.id} className="customer-ref-card">
                <div className="customer-ref-stars" aria-label="5 out of 5 stars">★★★★★</div>
                <p className="customer-ref-quote">&ldquo;{rev.quote}&rdquo;</p>
                <div className="customer-ref-footer">
                  <div>
                    <div className="customer-ref-name">{rev.author}</div>
                    <div className="customer-ref-loc">{rev.location}</div>
                  </div>
                  <span className="customer-ref-item">{rev.item}</span>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Get In Touch Contact Section ── */}
      <section className="section contact-touch-section" id="contact">
        <div className="container-lg">
          <div className="contact-touch-header">
            <h2 className="contact-touch-title">{lang === 'km' ? 'ទាក់ទងមកកាន់យើងខ្ញុំ' : 'Get In Touch'}</h2>
            <div className="contact-touch-subtitle">{lang === 'km' ? 'យើងខ្ញុំរីករាយស្វាគមន៍ជានិច្ច' : "WE'D LOVE TO HEAR FROM YOU"}</div>
          </div>

          <div className="contact-touch-grid">
            {/* Left: Contact Form */}
            <div className="contact-touch-form-card">
              <form onSubmit={handleContactSubmit}>
                <div className="contact-form-row-2">
                  <div className="contact-form-group">
                    <label htmlFor="touch-first-name">{lang === 'km' ? 'នាមខ្លួន' : 'FIRST NAME'}</label>
                    <input
                      id="touch-first-name"
                      type="text"
                      placeholder={lang === 'km' ? 'សុខា' : 'John'}
                      value={contactForm.firstName}
                      onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="touch-last-name">{lang === 'km' ? 'នាមត្រកូល' : 'LAST NAME'}</label>
                    <input
                      id="touch-last-name"
                      type="text"
                      placeholder={lang === 'km' ? 'ចាន់' : 'Doe'}
                      value={contactForm.lastName}
                      onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="touch-email">{lang === 'km' ? 'អ៊ីមែល' : 'EMAIL'}</label>
                  <input
                    id="touch-email"
                    type="email"
                    placeholder="john@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="touch-subject">{lang === 'km' ? 'ប្រធានបទ' : 'SUBJECT'}</label>
                  <input
                    id="touch-subject"
                    type="text"
                    placeholder={lang === 'km' ? 'តើយើងអាចជួយអ្វីបានខ្លះ?' : 'How can we help?'}
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="touch-message">{lang === 'km' ? 'សាររបស់អ្នក' : 'MESSAGE'}</label>
                  <textarea
                    id="touch-message"
                    rows={4}
                    placeholder={lang === 'km' ? 'សូមសរសេរសំណួរ ឬព័ត៌មានលម្អិតនៅទីនេះ...' : 'Tell us more about your inquiry...'}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="contact-touch-submit-btn" disabled={contactSending}>
                  {contactSending
                    ? (lang === 'km' ? 'កំពុងផ្ញើ...' : 'SENDING...')
                    : (lang === 'km' ? 'ផ្ញើសារមកកាន់យើងខ្ញុំ' : 'SEND MESSAGE')}
                </button>
              </form>
            </div>

            {/* Right: Contact Information */}
            <div className="contact-touch-info-card">
              <div className="contact-info-item">
                <div className="contact-info-icon-badge" aria-hidden="true">
                  <MapPinIcon size={20} />
                </div>
                <div className="contact-info-content">
                  <h4>{lang === 'km' ? 'អញ្ជើញមកកាន់ហាងផ្ទាល់' : 'VISIT OUR FLAGSHIP STORE'}</h4>
                  <p>123 Preah Norodom Blvd</p>
                  <p>Phnom Penh, Cambodia 12302</p>
                  <p className="contact-info-sub">{lang === 'km' ? 'តំបន់ម៉ូដ BKK1 ភ្នំពេញ' : 'BKK1 Fashion District'}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon-badge" aria-hidden="true">
                  <PhoneIcon size={20} />
                </div>
                <div className="contact-info-content">
                  <h4>{lang === 'km' ? 'ទូរស័ព្ទមកកាន់យើងខ្ញុំ' : 'CALL US'}</h4>
                  <p>{lang === 'km' ? 'ទូទៅ' : 'Main'}: <a href="tel:+85523888999" className="contact-touch-link">+855 02 123 4567</a></p>
                  <p>{lang === 'km' ? 'សេវាកម្ម' : 'Support'}: <a href="tel:+855967776655" className="contact-touch-link">+855 02 123 4568</a></p>
                  <p className="contact-info-sub">{lang === 'km' ? 'ច័ន្ទ-សុក្រ ៩ព្រឹក-៦ល្ងាច' : 'Mon-Fri, 9AM-6PM ICT'}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon-badge" aria-hidden="true">
                  <MailIcon size={20} />
                </div>
                <div className="contact-info-content">
                  <h4>{lang === 'km' ? 'ផ្ញើអ៊ីមែល' : 'EMAIL US'}</h4>
                  <p>{lang === 'km' ? 'ទូទៅ' : 'General'}: <a href="mailto:hello@fashionstore.kh" className="contact-touch-link">hello@noir.fashion</a></p>
                  <p>{lang === 'km' ? 'សេវាកម្ម' : 'Support'}: <a href="mailto:support@fashionstore.kh" className="contact-touch-link">support@noir.fashion</a></p>
                  <p>Press: <a href="mailto:press@fashionstore.kh" className="contact-touch-link">press@noir.fashion</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container-lg">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                Fashion Store<span>.</span>
              </div>
              <div className="footer-tagline">Editorial Style · Phnom Penh</div>
              <p className="footer-desc">
                Curated wardrobe staples, seasonal capsules, footwear, and accessories crafted for everyday confidence with instant Bakong KHQR and Cash on Delivery checkout.
              </p>
              <div className="footer-socials" aria-label="Fashion Store channels">
                <button
                  type="button"
                  className="social-icon-btn"
                  title="Search Catalog"
                  aria-label="Search Catalog"
                  onClick={() => setSearchOpen(true)}
                >
                  <SearchIcon size={16} />
                </button>
                <button
                  type="button"
                  className="social-icon-btn"
                  title="Wishlist"
                  aria-label="Wishlist"
                  onClick={() => setWishlistOpen(true)}
                >
                  <HeartIcon size={16} />
                </button>
                <button
                  type="button"
                  className="social-icon-btn"
                  title="Shopping Bag"
                  aria-label="Shopping Bag"
                  onClick={() => setCartOpen(true)}
                >
                  <BagIcon size={16} />
                </button>
                <button
                  type="button"
                  className="social-icon-btn"
                  title="Admin Dashboard"
                  aria-label="Admin Dashboard"
                  onClick={() => onNavigate('/admin')}
                >
                  <SlidersIcon size={16} />
                </button>
              </div>
            </div>

            <div className="footer-col">
              <h4>{lang === 'km' ? 'ទិញទំនិញ' : 'Shop'}</h4>
              <div className="footer-links">
                {navCategories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className="footer-link"
                    onClick={() => {
                      handleSelectCategory(c.key);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>{lang === 'km' ? 'សេវាអតិថិជន' : 'Customer Care'}</h4>
              <div className="footer-links">
                <button type="button" className="footer-link" onClick={() => setCartOpen(true)}>
                  {lang === 'km' ? `កន្ត្រកទំនិញ (${cartCount})` : `Shopping Bag (${cartCount})`}
                </button>
                <button type="button" className="footer-link" onClick={() => setWishlistOpen(true)}>
                  {lang === 'km' ? `បញ្ជីប្រាថ្នា (${wishlist.length})` : `Saved Wishlist (${wishlist.length})`}
                </button>
                <button type="button" className="footer-link" onClick={() => setOrdersOpen(true)}>
                  {lang === 'km' ? `តាមដានការបញ្ជាទិញ (${orders.length})` : `Order Tracker (${orders.length})`}
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => document.getElementById('popular-products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {lang === 'km' ? 'ទំនិញពេញនិយមបំផុត' : 'Most Popular Products'}
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => document.getElementById('art-of-fashion')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {lang === 'km' ? 'សិល្បៈនៃការច្នៃម៉ូដ' : 'The Art of Fashion'}
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => document.getElementById('references')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {lang === 'km' ? 'មតិយោបល់អតិថិជន' : 'Customer Reviews'}
                </button>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {lang === 'km' ? 'ទាក់ទងមកកាន់យើងខ្ញុំ' : 'Get In Touch'}
                </button>
                <button type="button" className="footer-link" onClick={() => setSearchOpen(true)}>
                  {lang === 'km' ? 'ស្វែងរកទំនិញ' : 'Search Products'}
                </button>
              </div>
            </div>

            <div className="footer-col">
              <h4>{lang === 'km' ? 'ហាង & គណនី' : 'Store & Account'}</h4>
              <div className="footer-links">
                <button type="button" className="footer-link" onClick={() => onNavigate('/admin')}>
                  {t.nav.adminBtn}
                </button>
                <button type="button" className="footer-link" onClick={() => onNavigate('/login')}>
                  {user ? (lang === 'km' ? `ចូលប្រើដោយ ${user.name?.split(' ')[0]}` : `Signed in as ${user.name?.split(' ')[0]}`) : (lang === 'km' ? 'ចូលគណនី / ចុះឈ្មោះ' : 'Sign In / Register')}
                </button>
                <span className="footer-link footer-link-static">
                  <MapPinIcon size={14} /> {lang === 'km' ? 'រាជធានីភ្នំពេញ · ដឹកជញ្ជូនឥតគិតថ្លៃ > $50' : 'Phnom Penh · Free Delivery > $50'}
                </span>
                <span className="footer-link footer-link-static">
                  <ClockIcon size={14} /> {lang === 'km' ? 'រៀងរាល់ថ្ងៃ ៨:០០ ព្រឹក – ៩:០០ យប់' : 'Daily 8:00 AM – 9:00 PM'}
                </span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Fashion Store. All rights reserved.</span>
            <div className="footer-badges">
              <span className="payment-badge"><CreditCardIcon size={13} /> Bakong KHQR</span>
              <span className="payment-badge"><ShieldCheckIcon size={13} /> {lang === 'km' ? 'បង់ប្រាក់ពេលទទួល (COD)' : 'Cash on Delivery'}</span>
              <span className="payment-badge"><TruckIcon size={13} /> {lang === 'km' ? 'ដឹកជញ្ជូនរហ័សទូទាំងប្រទេស' : 'Phnom Penh Express'}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modals & Drawers */}
      <SearchModal
        open={searchOpen}
        products={products}
        lang={lang}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={setQuickViewProduct}
      />
      <QuickViewModal
        product={quickViewProduct}
        isWishlisted={quickViewProduct ? isProductWishlisted(quickViewProduct) : false}
        onToggleWishlist={handleToggleWishlist}
        lang={lang}
        onClose={() => setQuickViewProduct(null)}
      />
      <CartDrawer
        open={cartOpen}
        items={cart}
        lang={lang}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <WishlistDrawer open={wishlistOpen} items={wishlist} lang={lang} onClose={() => setWishlistOpen(false)} />
      <CheckoutModal
        open={checkoutOpen}
        items={cart}
        lang={lang}
        onClose={() => setCheckoutOpen(false)}
        onNavigateLogin={() => onNavigate('/login')}
      />
      <OrdersModal open={ordersOpen} orders={orders} lang={lang} onClose={() => setOrdersOpen(false)} />
    </div>
  );
}

