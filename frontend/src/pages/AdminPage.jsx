import React, { useEffect, useMemo, useState } from 'react';
import AdminProductModal from '../components/AdminProductModal';
import {
  CambodiaFlagIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UkFlagIcon,
} from '../components/Icons';
import {
  api,
  clearAuth,
  DEFAULT_LAYOUT,
  formatKHR,
  formatUSD,
  getLang,
  getOrders,
  getProducts,
  getStorefrontLayout,
  getUser,
  isAdminUser,
  isInNormalGrid,
  isInScrollBox,
  KEYS,
  notify,
  resetStorefrontLayout,
  saveLang,
  saveOrders,
  saveProducts,
  saveStorefrontLayout,
  setAuth,
} from '../lib/store';
import { ADMIN_T } from '../lib/adminTranslations';

export default function AdminPage({ theme, onToggleTheme, onNavigate }) {
  const [lang, setLang] = useState(() => getLang());
  const t = ADMIN_T[lang] || ADMIN_T.km;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    saveLang(newLang);
  };

  useEffect(() => {
    const handleSyncLang = (e) => {
      setLang(e.detail || getLang());
    };
    window.addEventListener('fashionstore:lang', handleSyncLang);
    return () => window.removeEventListener('fashionstore:lang', handleSyncLang);
  }, []);

  const sidebarTabs = useMemo(
    () => [
      { id: 'overview', icon: '📊', label: t.sidebar.overview },
      { id: 'products', icon: '👗', label: t.sidebar.products },
      { id: 'orders', icon: '📦', label: t.sidebar.orders },
      { id: 'inventory', icon: '🏷️', label: t.sidebar.inventory },
      { id: 'users', icon: '👥', label: t.sidebar.users },
      { id: 'reports', icon: '📈', label: t.sidebar.reports },
      { id: 'settings', icon: '⚙️', label: t.sidebar.settings },
    ],
    [t]
  );

  const [user, setUser] = useState(() => getUser());
  const [activeTab, setActiveTab] = useState('products');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [products, setProducts] = useState(() => getProducts());
  const [layout, setLayout] = useState(() => getStorefrontLayout());
  const [orders, setOrders] = useState(() => getOrders());
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [quickEditAll, setQuickEditAll] = useState(false);
  const [draftEdits, setDraftEdits] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [dispatchCourier, setDispatchCourier] = useState('J&T Express 🚚');
  const [dispatchTracking, setDispatchTracking] = useState('');
  const [lifecycleOrder, setLifecycleOrder] = useState(null);

  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [showNewUserPass, setShowNewUserPass] = useState(false);

  // Settings Tab States
  const [settingsSection, setSettingsSection] = useState('profile'); // 'profile' | 'security' | 'store'
  const fileInputRef = React.useRef(null);
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: user?.name || 'AdminStore',
    email: user?.email || 'adminstore@clothingshop.com',
    phone: (user?.phone && user.phone !== '+85512345678' && user.phone !== '+855 12 345 678') ? user.phone : '',
    avatar: user?.avatar || user?.avatar_url || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(
    () => user?.avatar || user?.avatar_url || ''
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setAvatarImgError(false);
  }, [avatarPreview, user?.avatar, user?.avatar_url]);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_store_settings');
      return saved
        ? JSON.parse(saved)
        : {
            storeName: 'Fashion Store Cambodia',
            tagline: 'Online Clothing Boutique · Phnom Penh',
            supportEmail: 'contact@fashionstore.com',
            supportPhone: '+855 23 888 999',
            currency: 'USD',
            usdKhrRate: 4100,
            shippingFee: 2.0,
            address: '#168 Preah Monivong Blvd, Phnom Penh, Cambodia',
          };
    } catch {
      return {
        storeName: 'Fashion Store Cambodia',
        tagline: 'Online Clothing Boutique · Phnom Penh',
        supportEmail: 'contact@fashionstore.com',
        supportPhone: '+855 23 888 999',
        currency: 'USD',
        usdKhrRate: 4100,
        shippingFee: 2.0,
        address: '#168 Preah Monivong Blvd, Phnom Penh, Cambodia',
      };
    }
  });
  const [savingStore, setSavingStore] = useState(false);

  const adminAuthorized = isAdminUser(user);

  useEffect(() => {
    document.title = 'Admin Dashboard — Fashion Store';
  }, []);

  useEffect(() => {
    const syncStorage = (e) => {
      if (!e.key || [KEYS.PRODUCTS, KEYS.CATALOG_VERSION].includes(e.key)) setProducts(getProducts());
      if (!e.key || e.key === KEYS.LAYOUT) setLayout(getStorefrontLayout());
      if (!e.key || e.key === KEYS.ORDERS) setOrders(getOrders());
      if (!e.key || e.key === KEYS.USER || e.key === KEYS.TOKEN) setUser(getUser());
    };
    window.addEventListener('storage', syncStorage);
    window.addEventListener('fashionstore:orders', () => setOrders(getOrders()));
    window.addEventListener('fashionstore:auth', () => setUser(getUser()));
    return () => window.removeEventListener('storage', syncStorage);
  }, []);

  const fetchUsers = async () => {
    if (!adminAuthorized) return;
    setUsersLoading(true);
    const res = await api.get('/admin/users');
    setUsersLoading(false);
    if (res.ok && Array.isArray(res.data?.data)) {
      setUsers(res.data.data);
    }
  };

  useEffect(() => {
    if (!adminAuthorized) return;
    fetchUsers();

    // Automatically sync admin profile & avatar from database so topbar, settings & users table are 100% identical
    const syncCurrentAdmin = async () => {
      const res = await api.get('/user');
      if (res.ok && res.data?.data) {
        const freshUser = res.data.data;
        setUser(freshUser);
        const currentToken = localStorage.getItem(KEYS.TOKEN);
        setAuth(currentToken, freshUser);
        setAvatarPreview(freshUser.avatar_url || freshUser.avatar || '');
        const cleanPhone = (freshUser.phone && freshUser.phone !== '+85512345678' && freshUser.phone !== '+855 12 345 678') ? freshUser.phone : '';
        setAdminProfileForm((prev) => ({
          ...prev,
          name: freshUser.name || prev.name,
          email: freshUser.email || prev.email,
          phone: cleanPhone,
          avatar: freshUser.avatar_url || freshUser.avatar || prev.avatar,
        }));
      }
    };
    syncCurrentAdmin();
  }, [adminAuthorized]);

  // Metrics
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + Number(o.total || 0), 0), [orders]);
  const scrollCount = useMemo(
    () => products.filter((p) => (!p.status || p.status === 'active' || p.status === 'out_of_stock') && isInScrollBox(p)).length,
    [products]
  );
  const normalCount = useMemo(
    () => products.filter((p) => (!p.status || p.status === 'active' || p.status === 'out_of_stock') && isInNormalGrid(p)).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q);
      const matchCat = productCatFilter === 'all' || p.cat === productCatFilter;
      return matchQ && matchCat;
    });
  }, [products, productSearch, productCatFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ = !q || o.num?.toLowerCase().includes(q) || (o.customer?.name || '').toLowerCase().includes(q);
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const topSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [products]);

  const weeklySalesData = useMemo(() => {
    return [
      { day: 'Mon', revenue: 420, orders: 8, height: '48%' },
      { day: 'Tue', revenue: 680, orders: 12, height: '70%' },
      { day: 'Wed', revenue: 510, orders: 9, height: '55%' },
      { day: 'Thu', revenue: 890, orders: 15, height: '88%' },
      { day: 'Fri', revenue: 1040, orders: 19, height: '100%' },
      { day: 'Sat', revenue: 920, orders: 16, height: '92%' },
      { day: 'Sun', revenue: 760, orders: 14, height: '78%' },
    ];
  }, []);

  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  const categoryStats = useMemo(() => {
    const cats = ["Men's", "Women's", "Kids", "Shoes", "Accessories"];
    const totalCount = products.length || 1;
    return cats.map((cat) => {
      const catProducts = products.filter((p) => p.cat === cat);
      const units = catProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0);
      const pct = Math.round((catProducts.length / totalCount) * 100);
      return { cat, count: catProducts.length, units, pct };
    });
  }, [products]);

  // Storefront Box Layout actions
  const updateLayout = (patch) => {
    const next = saveStorefrontLayout({ ...layout, ...patch });
    setLayout(next);
  };

  const getDisplayScrollEyebrow = () => {
    if (lang === 'km') {
      if (!layout.scrollEyebrow || layout.scrollEyebrow === 'Featured Collection' || layout.scrollEyebrow === 'បណ្តុំទំនិញពិសេស') {
        return t.products.defaultScrollEyebrow;
      }
      return layout.scrollEyebrow;
    }
    if (!layout.scrollEyebrow || layout.scrollEyebrow === 'Featured Collection' || layout.scrollEyebrow === 'បណ្តុំទំនិញពិសេស') {
      return 'Featured Collection';
    }
    return layout.scrollEyebrow;
  };

  const getDisplayScrollTitle = () => {
    if (lang === 'km') {
      if (!layout.scrollTitle || layout.scrollTitle === 'New Arrivals' || layout.scrollTitle === 'ទំនិញមកដល់ថ្មីៗ') {
        return t.products.defaultScrollTitle;
      }
      return layout.scrollTitle;
    }
    if (!layout.scrollTitle || layout.scrollTitle === 'New Arrivals' || layout.scrollTitle === 'ទំនិញមកដល់ថ្មីៗ') {
      return 'New Arrivals';
    }
    return layout.scrollTitle;
  };

  const getDisplayNormalEyebrow = () => {
    if (lang === 'km') {
      if (!layout.normalEyebrow || layout.normalEyebrow === 'Complete Catalog' || layout.normalEyebrow === 'កាតាឡុកទំនិញពេញលេញ') {
        return t.products.defaultNormalEyebrow;
      }
      return layout.normalEyebrow;
    }
    if (!layout.normalEyebrow || layout.normalEyebrow === 'Complete Catalog' || layout.normalEyebrow === 'កាតាឡុកទំនិញពេញលេញ') {
      return 'Complete Catalog';
    }
    return layout.normalEyebrow;
  };

  const getDisplayNormalTitle = () => {
    if (lang === 'km') {
      if (!layout.normalTitle || layout.normalTitle === 'All Products' || layout.normalTitle === 'ផលិតផលទាំងអស់') {
        return t.products.defaultNormalTitle;
      }
      return layout.normalTitle;
    }
    if (!layout.normalTitle || layout.normalTitle === 'All Products' || layout.normalTitle === 'ផលិតផលទាំងអស់') {
      return 'All Products';
    }
    return layout.normalTitle;
  };

  const applyLayoutPreset = (preset) => {
    if (preset === 'both') {
      updateLayout({ showScrollBox: true, showNormalGrid: true });
      notify(lang === 'km' ? 'មុខហាងបង្ហាញទាំងជួររំកិល និងក្រឡាធម្មតា ✨' : 'Storefront shows both Scroll Grid & Normal Grid ✨', 'success', 2400);
    } else if (preset === 'scroll_only') {
      updateLayout({ showScrollBox: true, showNormalGrid: false });
      notify(lang === 'km' ? 'កំណត់មុខហាងត្រឹមជួររំកិលតែមួយគត់ ↔' : 'Storefront set to Scroll Grid only ↔', 'success', 2400);
    } else {
      updateLayout({ showScrollBox: false, showNormalGrid: true });
      notify(lang === 'km' ? 'កំណត់មុខហាងត្រឹមក្រឡាធម្មតាតែមួយគត់ ⊞' : 'Storefront set to Normal Grid only ⊞', 'success', 2400);
    }
  };

  const handleBatchBoxPlacement = (boxType, value) => {
    const updated = products.map((p) => {
      if (boxType === 'scroll') {
        return { ...p, inScrollBox: value === 'featured' ? Boolean(p.isNew || p.featured) : Boolean(value) };
      }
      return { ...p, inNormalGrid: Boolean(value) };
    });
    setProducts(updated);
    saveProducts(updated);
    notify(
      lang === 'km'
        ? `បានធ្វើបច្ចុប្បន្នភាព${boxType === 'scroll' ? 'ជួររំកិល' : 'ក្រឡាធម្មតា'}លើកាតាឡុក ✨`
        : `${boxType === 'scroll' ? 'Scroll Grid' : 'Normal Grid'} updated across catalog ✨`,
      'success',
      2400
    );
  };

  const toggleProductPlacement = (sku, boxType) => {
    const updated = products.map((p) => {
      if (p.sku !== sku) return p;
      if (boxType === 'scroll') return { ...p, inScrollBox: !isInScrollBox(p) };
      return { ...p, inNormalGrid: !isInNormalGrid(p) };
    });
    setProducts(updated);
    saveProducts(updated);
  };

  const handleSaveProduct = (payload) => {
    let updated;
    if (editingProduct) {
      updated = products.map((p) => (p.sku === editingProduct.sku ? payload : p));
      notify(`Updated "${payload.name}" ✨`, 'success', 2600);
    } else {
      updated = [payload, ...products];
      notify(`Created "${payload.name}" 🎉`, 'success', 2600);
    }
    setProducts(updated);
    saveProducts(updated);
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (sku) => {
    const target = products.find((p) => p.sku === sku);
    const updated = products.filter((p) => p.sku !== sku);
    setProducts(updated);
    saveProducts(updated);
    setModalOpen(false);
    setEditingProduct(null);
    notify(`Deleted "${target?.name || sku}".`, 'default', 2200);
  };

  const enterQuickEdit = () => {
    const initial = {};
    products.forEach((p) => {
      initial[p.sku] = {
        name: p.name,
        cat: p.cat,
        price: p.price,
        stock: p.stock,
        status: p.status || 'active',
        inScrollBox: isInScrollBox(p),
        inNormalGrid: isInNormalGrid(p),
      };
    });
    setDraftEdits(initial);
    setQuickEditAll(true);
  };

  const saveQuickEdit = () => {
    const updated = products.map((p) => {
      const d = draftEdits[p.sku];
      if (!d) return p;
      return { ...p, ...d, price: Number(d.price) || 0, stock: Number(d.stock) || 0 };
    });
    setProducts(updated);
    saveProducts(updated);
    setQuickEditAll(false);
    notify('All Quick Edit changes saved & synced live ✨', 'success', 2600);
  };

  const adjustInventoryStock = (sku, deltaOrExact, isExact = false) => {
    const updated = products.map((p) => {
      if (p.sku !== sku) return p;
      const nextStock = isExact ? Math.max(0, Number(deltaOrExact) || 0) : Math.max(0, (Number(p.stock) || 0) + deltaOrExact);
      return { ...p, stock: nextStock };
    });
    setProducts(updated);
    saveProducts(updated);
  };

  const updateOrderStatus = async (orderNum, nextStatus, extra = {}) => {
    const isDelivered = nextStatus === 'delivered';
    const updated = orders.map((o) => {
      if (o.num !== orderNum) return o;
      const isCod = (o.payment_method === 'cod') || String(o.payment || '').toLowerCase().includes('cash');
      return {
        ...o,
        status: nextStatus,
        payment_status: isDelivered && isCod ? 'paid' : (extra.payment_status || o.payment_status),
        payment: isDelivered && isCod ? 'COD Paid (សាច់ប្រាក់)' : o.payment,
        courier: extra.courier || o.courier,
        tracking_number: extra.tracking_number || o.tracking_number,
      };
    });
    setOrders(updated);
    saveOrders(updated);
    await api.patch(`/admin/orders/${encodeURIComponent(orderNum)}/status`, {
      status: nextStatus,
      payment_status: isDelivered ? 'paid' : extra.payment_status,
      shipping_provider: extra.courier,
      tracking_number: extra.tracking_number,
    });
    notify(`Order ${orderNum} updated to ${nextStatus}.`, 'success', 2200);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/users', newUserForm);
    if (res.ok) {
      notify('User created successfully!', 'success');
      setNewUserModal(false);
      setNewUserForm({ name: '', email: '', phone: '', password: '', role: 'customer' });
      fetchUsers();
    } else {
      const firstErr = res.data?.errors ? Object.values(res.data.errors).flat()[0] : null;
      notify(firstErr || res.data?.message || 'Could not create user.', 'error');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/status`);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u)));
      notify('User status updated.', 'success', 1800);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.roles?.includes('super_admin') || user.id === 1) {
      notify('Cannot delete Super Admin account.', 'error');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`);
    if (!confirmed) return;

    const res = await api.delete(`/admin/users/${user.id}`);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      notify(`User "${user.name}" has been deleted.`, 'success');
    } else {
      notify(res.data?.message || 'Could not delete user.', 'error');
    }
  };

  const exportCsv = () => {
    const headers = ['Order Number', 'Customer', 'Phone', 'Payment', 'Status', 'USD', 'KHR', 'Date'];
    const rows = orders.map((o) => [
      `"${o.num}"`,
      `"${o.customer?.name || 'Customer'}"`,
      `"${o.customer?.phone || ''}"`,
      `"${o.payment || ''}"`,
      `"${o.status || 'pending'}"`,
      Number(o.total || 0).toFixed(2),
      Math.round(Number(o.total || 0) * 4100),
      `"${o.date || ''}"`,
    ]);
    const csv = `data:text/csv;charset=utf-8,\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`;
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `fashion_store_reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    notify('Sales report CSV exported 📊', 'success');
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Image size must be less than 5MB.', 'error');
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);

    // Instant upload and save directly via api.upload (multipart/form-data)
    setSavingProfile(true);
    notify('Uploading admin avatar photo… ⏳', 'info', 1500);

    const formData = new FormData();
    formData.append('avatar', file);
    const uploadRes = await api.upload('/user/avatar', formData);
    setSavingProfile(false);

    if (uploadRes.ok && (uploadRes.data?.data?.avatar_url || uploadRes.data?.data?.user)) {
      const updatedUser = uploadRes.data.data.user || { ...user, avatar: uploadRes.data.data.avatar_url };
      const currentToken = localStorage.getItem(KEYS.TOKEN);
      setAuth(currentToken, updatedUser);
      setUser(updatedUser);
      setAvatarPreview(uploadRes.data.data.avatar_url || updatedUser.avatar_url || updatedUser.avatar);
      setAdminProfileForm((prev) => ({ ...prev, avatar: uploadRes.data.data.avatar_url }));
      setAvatarFile(null);
      notify('Admin avatar photo uploaded and saved successfully! ✨', 'success');
      fetchUsers();
    } else {
      notify(uploadRes.data?.message || 'Failed to upload profile photo.', 'error');
    }
  };

  const handleSelectPresetAvatar = async (url) => {
    setAvatarFile(null);
    setAvatarPreview(url);
    setAdminProfileForm((prev) => ({ ...prev, avatar: url }));

    // Instant save to server so it is completely effortless
    try {
      notify('Applying preset avatar… ⏳', 'info', 1000);
      const res = await api.patch('/user', { avatar: url });
      if (res.ok && res.data?.data) {
        const updatedUser = res.data.data;
        const currentToken = localStorage.getItem(KEYS.TOKEN);
        setAuth(currentToken, updatedUser);
        setUser(updatedUser);
        notify('Admin avatar updated to preset! ✨', 'success', 2000);
        fetchUsers();
      }
    } catch (_) {}
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let finalAvatarUrl = adminProfileForm.avatar;

      // 1. If an image file was picked from local device, upload it with api.upload
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadRes = await api.upload('/user/avatar', formData);
        if (uploadRes.ok && uploadRes.data?.data?.avatar_url) {
          finalAvatarUrl = uploadRes.data.data.avatar_url;
        } else {
          notify(uploadRes.data?.message || 'Failed to upload profile photo.', 'error');
          setSavingProfile(false);
          return;
        }
      }

      // 2. Update user profile fields (name, email, phone, avatar)
      const res = await api.patch('/user', {
        name: adminProfileForm.name,
        email: adminProfileForm.email,
        phone: adminProfileForm.phone,
        avatar: finalAvatarUrl,
      });

      setSavingProfile(false);

      if (res.ok && res.data?.data) {
        const updatedUser = res.data.data;
        const currentToken = localStorage.getItem(KEYS.TOKEN);
        setAuth(currentToken, updatedUser);
        setUser(updatedUser);
        setAvatarPreview(updatedUser.avatar_url || updatedUser.avatar || finalAvatarUrl);
        setAvatarFile(null);
        notify('Admin profile & avatar updated successfully! ✨', 'success');
        fetchUsers();
      } else {
        const err = res.data?.errors ? Object.values(res.data.errors).flat()[0] : null;
        notify(err || res.data?.message || 'Could not update profile.', 'error');
      }
    } catch (err) {
      setSavingProfile(false);
      notify('An error occurred while saving profile.', 'error');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.password) {
      notify('Please enter a new password.', 'error');
      return;
    }
    if (passwordForm.password.length < 6) {
      notify('New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      notify('New password and confirmation do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    const res = await api.post('/user/change-password', passwordForm);
    setSavingPassword(false);

    if (res.ok) {
      notify('Password changed successfully! 🔒', 'success');
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } else {
      const err = res.data?.errors ? Object.values(res.data.errors).flat()[0] : null;
      notify(err || res.data?.message || 'Could not change password.', 'error');
    }
  };

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      localStorage.setItem('cs_store_settings', JSON.stringify(storeSettings));
      setTimeout(() => {
        setSavingStore(false);
        notify('Store configurations saved successfully! 🏪', 'success');
      }, 300);
    } catch {
      setSavingStore(false);
      notify('Could not save store settings.', 'error');
    }
  };

  if (!adminAuthorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h2 style={{ marginBottom: 8 }}>Admin Access Required</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 22 }}>
            Please sign in with an Administrator account (`AdminStore`) to access the Fashion Store Admin Dashboard.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-outline" onClick={() => onNavigate('/')}>
              ← Storefront
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('/login')}>
              Sign In as Admin →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`react-admin-shell ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-mobile-drawer-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop fixed left, Mobile off-canvas drawer) */}
      <aside className={`react-admin-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="brand-logo">Fashion Store</div>
              <div className="brand-sub">{t.sidebar.brandSub}</div>
            </div>
            <button
              type="button"
              className="admin-mobile-drawer-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`react-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" className="btn btn-accent btn-sm btn-full" onClick={() => onNavigate('/')}>
            ↗ {t.sidebar.viewStorefront}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-full"
            style={{ color: 'rgba(255,255,255,0.75)' }}
            onClick={() => {
              clearAuth();
              onNavigate('/login');
            }}
          >
            {t.sidebar.signOut} ({user?.name})
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="react-admin-main">
        <header className="react-admin-topbar">
          <div className="admin-topbar-left">
            {/* Mobile Menu Icon Button */}
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              aria-label={lang === 'km' ? 'ម៉ឺនុយ' : 'Menu'}
              title={lang === 'km' ? 'ម៉ឺនុយ' : 'Menu'}
            >
              <MenuIcon size={18} />
            </button>

            <div className="admin-topbar-heading">
              <div className="admin-topbar-breadcrumb">
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)' }}>
                  {t.topbar.console}
                </span>
                <span style={{ color: 'var(--border)' }}>/</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {sidebarTabs.find((x) => x.id === activeTab)?.label}
                </span>
              </div>
              <h1 className="admin-topbar-title">
                {sidebarTabs.find((x) => x.id === activeTab)?.label}
              </h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* 1. Language Switcher (KM / EN) with Crisp Vector Flags */}
            <div className="admin-topbar-lang">
              <button
                type="button"
                className={`admin-lang-btn ${lang === 'km' ? 'is-active' : ''}`}
                onClick={() => handleLangChange('km')}
                title="ប្ដូរទៅភាសាខ្មែរ (Khmer)"
              >
                <CambodiaFlagIcon size={16} />
                <span>ខ្មែរ</span>
              </button>
              <button
                type="button"
                className={`admin-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
                onClick={() => handleLangChange('en')}
                title="Switch to English"
              >
                <UkFlagIcon size={16} />
                <span>EN</span>
              </button>
            </div>

            {/* 2. Admin Profile Pill */}
            <button
              type="button"
              className={`admin-topbar-profile-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('settings')}
              title={t.topbar.profileHint}
              aria-label={user?.name || 'Admin'}
            >
              {!avatarImgError && (avatarPreview || user?.avatar || user?.avatar_url) ? (
                <img
                  src={avatarPreview || user?.avatar || user?.avatar_url}
                  alt={user?.name || 'Admin'}
                  className="admin-profile-avatar"
                  onError={() => {
                    setAvatarImgError(true);
                  }}
                />
              ) : (
                <span className="admin-profile-crown">
                  👑
                </span>
              )}
              <span className="admin-profile-name">{user?.name || 'Admin'}</span>
              <span className="admin-profile-gear">⚙️</span>
            </button>

            {/* 3. Luxury Theme Toggle Icon Button (Icon Only, No Text) */}
            <button
              type="button"
              className="admin-topbar-theme-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {/* 4. Luxury Add New Product Pill */}
            <button
              type="button"
              className="admin-topbar-add-btn"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              title={t.topbar.addNewProduct}
              aria-label={t.topbar.addNewProduct}
            >
              <span className="admin-add-icon">+</span>
              <span className="admin-add-label">{t.topbar.addNewProduct}</span>
            </button>
          </div>
        </header>

        {/* Mobile Responsive Icon Menu Bar (Only visible on mobile phones) */}
        <div className="admin-mobile-icon-strip" role="tablist" aria-label="Admin Navigation Tabs">
          {sidebarTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-mobile-icon-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                aria-selected={isActive}
                role="tab"
              >
                <span className="admin-tab-emoji">{tab.icon}</span>
              </button>
            );
          })}
        </div>

        <div className="react-admin-body">
          {/* ── 1. OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div>
              {/* Luxury Welcome Hero Banner */}
              <div className="admin-hero-banner">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                    {t.overview.heroLiveTag}
                  </div>
                  <h2 className="admin-hero-title">
                    {t.overview.heroWelcome}, <em>{user?.name || 'AdminStore'}</em> ✨
                  </h2>
                  <p className="admin-hero-sub">
                    {t.overview.heroSub}
                  </p>
                </div>
                <div className="admin-hero-actions">
                  <button
                    type="button"
                    className="admin-hero-btn is-gold"
                    onClick={() => {
                      setEditingProduct(null);
                      setModalOpen(true);
                    }}
                  >
                    <span>{t.overview.heroNewProduct}</span>
                  </button>
                  <button
                    type="button"
                    className="admin-hero-btn"
                    onClick={() => setActiveTab('products')}
                  >
                    <span>{t.overview.heroLayout}</span>
                  </button>
                  <button
                    type="button"
                    className="admin-hero-btn"
                    onClick={() => setActiveTab('orders')}
                  >
                    <span>{t.overview.heroOrders} ({orders.length})</span>
                  </button>
                  <button
                    type="button"
                    className="admin-hero-btn"
                    onClick={() => onNavigate('/')}
                  >
                    <span>{t.overview.heroViewStore}</span>
                  </button>
                </div>
              </div>

              {/* 4 Modern KPI Metric Cards */}
              <div className="react-kpi-grid">
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.overview.grossRevenue}</span>
                    <div className="admin-kpi-icon-wrap">💰</div>
                  </div>
                  <div className="admin-kpi-val">{formatUSD(totalRevenue)}</div>
                  <div className="admin-kpi-sub">{formatKHR(totalRevenue)}</div>
                  <div style={{ marginTop: 10 }}>
                    <span className="admin-kpi-trend">{t.overview.grossRevenueTrend}</span>
                  </div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.overview.customerOrders}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                      📦
                    </div>
                  </div>
                  <div className="admin-kpi-val">{orders.length}</div>
                  <div className="admin-kpi-sub" style={{ color: orderCounts.pending > 0 ? '#d97706' : 'var(--text-muted)' }}>
                    {orderCounts.pending} {t.overview.pendingFulfillment}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className="admin-kpi-trend" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                      {orders.length ? `${Math.round((orders.filter(o => o.status === 'delivered').length / (orders.length || 1)) * 100)}% ${t.overview.completedFulfillment}` : t.overview.allCaughtUp}
                    </span>
                  </div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.overview.productCatalog}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#db2777', borderColor: 'rgba(236, 72, 153, 0.25)' }}>
                      👗
                    </div>
                  </div>
                  <div className="admin-kpi-val">{products.length}</div>
                  <div className="admin-kpi-sub">
                    {t.overview.inScrollAndNormal.replace('{scroll}', scrollCount).replace('{normal}', normalCount)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className="admin-kpi-trend" style={{ background: '#fdf2f8', color: '#be185d' }}>
                      {products.filter(p => p.isNew).length} {t.overview.newArrivals}
                    </span>
                  </div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.overview.inventoryUnits}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                      🏷️
                    </div>
                  </div>
                  <div className="admin-kpi-val">{products.reduce((s, p) => s + (Number(p.stock) || 0), 0)}</div>
                  <div className="admin-kpi-sub">
                    {products.filter((p) => (Number(p.stock) || 0) <= 5).length} {t.overview.itemsLowStock}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className="admin-kpi-trend">
                      {t.overview.inStockRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytics: Weekly Sales Performance & Leaderboard */}
              <div className="admin-analytics-grid">
                {/* Visual Weekly Sales Bar Chart */}
                <div className="admin-chart-card">
                  <div className="admin-chart-head">
                    <div>
                      <h3 className="admin-chart-title">{t.overview.weeklySalesTitle}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.overview.weeklySalesSub}</div>
                    </div>
                    <div className="admin-chart-legend">
                      <span><span className="admin-chart-legend-dot" style={{ background: 'var(--accent)' }} /> {t.overview.revenueLegend}</span>
                    </div>
                  </div>

                  <div className="admin-bar-chart">
                    {weeklySalesData.map((d) => (
                      <div key={d.day} className="admin-bar-col">
                        <div className="admin-bar-tooltip">
                          ${d.revenue} · {d.orders} {lang === 'km' ? 'កុម្ម៉ង់' : 'orders'}
                        </div>
                        <div className="admin-bar-fill" style={{ height: d.height }} />
                        <span className="admin-bar-label">{d.day}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', paddingTop: 6 }}>
                    <span>{t.overview.peakDay}: <strong>{lang === 'km' ? 'ថ្ងៃសុក្រ ($1,040)' : 'Friday ($1,040)'}</strong></span>
                    <span>{t.overview.avgDailySales}: <strong>$745</strong></span>
                  </div>
                </div>

                {/* Top Selling Products Leaderboard */}
                <div className="admin-leaderboard-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 className="admin-chart-title">{t.overview.topSellingTitle}</h3>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, padding: '2px 8px' }}
                      onClick={() => setActiveTab('products')}
                    >
                      {t.overview.viewAll}
                    </button>
                  </div>

                  <div>
                    {topSellingProducts.map((p, idx) => (
                      <div key={p.sku} className="admin-leader-item">
                        <div className={`admin-rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-default'}`}>
                          {idx + 1}
                        </div>
                        <img src={p.image} alt={p.name} className="admin-leader-img" />
                        <div className="admin-leader-info">
                          <div className="admin-leader-name">{p.name}</div>
                          <div className="admin-leader-cat">{p.cat} · {formatUSD(p.price)}</div>
                        </div>
                        <div className="admin-leader-stats">
                          <div className="admin-leader-revenue">{formatUSD((p.sales || 20) * p.price)}</div>
                          <div className="admin-leader-qty">{p.sales || 20} {t.overview.sold}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Card */}
              <div className="react-card" style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{t.overview.recentOrdersTitle}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.overview.recentOrdersSub}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-luxury-action-pill is-outline"
                    onClick={() => setActiveTab('orders')}
                  >
                    {t.overview.viewAllOrders.replace('{count}', orders.length)}
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="react-table">
                    <thead>
                      <tr>
                        <th>{t.overview.colOrder}</th>
                        <th>{t.overview.colCustomer}</th>
                        <th>{t.overview.colItems}</th>
                        <th>{t.overview.colTotal}</th>
                        <th>{t.overview.colPayment}</th>
                        <th>{t.overview.colStatus}</th>
                        <th>{t.overview.colAction}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.num}>
                          <td><strong>{o.num}</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'rgba(201, 169, 110, 0.2)',
                                color: 'var(--accent-dark)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
                                {(o.customer?.name || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer?.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>{(o.products || []).map((p) => `${p.name} ×${p.qty}`).join(', ')}</td>
                          <td>
                            <div style={{ fontWeight: 800 }}>{formatUSD(o.total)}</div>
                            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{formatKHR(o.total)}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: o.payment?.toLowerCase().includes('bakong') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: o.payment?.toLowerCase().includes('bakong') ? '#dc2626' : '#059669',
                              border: o.payment?.toLowerCase().includes('bakong') ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                            }}>
                              {o.payment || 'Bakong KHQR'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-gold" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11 }}>
                              {o.status === 'delivered' ? (lang === 'km' ? 'បានដឹក & Paid' : 'Delivered') : o.status === 'shipped' ? (lang === 'km' ? 'កំពុងដឹកជញ្ជូន' : 'Shipped') : (lang === 'km' ? 'រង់ចាំទទួល' : 'Pending')}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-action-pill is-receipt"
                              onClick={() => setReceiptOrder(o)}
                            >
                              {t.overview.receiptBtn}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ── 2. PRODUCTS & STOREFRONT GRID BOXES ── */}
          {activeTab === 'products' && (
            <div>
              {/* Storefront Product Box Layout Controller */}
              <div className="storefront-layout-card">
                <div className="storefront-layout-head">
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                      {t.products.layoutTitle}
                    </h3>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                      {t.products.layoutSub}
                    </p>
                  </div>
                  <div className="layout-preset-group">
                    <button
                      type="button"
                      className={`layout-preset-pill ${layout.showScrollBox && layout.showNormalGrid ? 'is-active' : ''}`}
                      onClick={() => applyLayoutPreset('both')}
                    >
                      {t.products.btnShowBoth}
                    </button>
                    <button
                      type="button"
                      className={`layout-preset-pill ${layout.showScrollBox && !layout.showNormalGrid ? 'is-active' : ''}`}
                      onClick={() => applyLayoutPreset('scroll_only')}
                    >
                      {t.products.btnScrollOnly}
                    </button>
                    <button
                      type="button"
                      className={`layout-preset-pill ${!layout.showScrollBox && layout.showNormalGrid ? 'is-active' : ''}`}
                      onClick={() => applyLayoutPreset('normal_only')}
                    >
                      {t.products.btnNormalOnly}
                    </button>
                    <button
                      type="button"
                      className="layout-preset-pill is-reset"
                      onClick={() => {
                        setLayout(resetStorefrontLayout());
                        notify(lang === 'km' ? 'បានកំណត់ទម្រង់ប្រអប់ឡើងវិញ។' : 'Storefront box layout reset to defaults.', 'default');
                      }}
                    >
                      {t.products.btnReset}
                    </button>
                  </div>
                </div>

                <div className="layout-boxes-grid">
                  <div className={`layout-box-panel ${!layout.showScrollBox ? 'is-disabled' : 'is-scroll-active'}`}>
                    <div className="layout-box-top">
                      <label className="luxury-toggle-label">
                        <input
                          type="checkbox"
                          className="luxury-toggle-checkbox"
                          checked={layout.showScrollBox}
                          onChange={(e) => updateLayout({ showScrollBox: e.target.checked })}
                        />
                        <span className="luxury-toggle-slider" />
                        <span className="luxury-toggle-text">{t.products.scrollBoxLabel}</span>
                      </label>
                      <span className="badge badge-gold" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11.5 }}>
                        {t.products.itemsCount.replace('{count}', scrollCount)}
                      </span>
                    </div>
                    <div className="layout-fields-row">
                      <div>
                        <label className="layout-field-label">{t.products.eyebrowLabel}</label>
                        <input
                          className="form-control luxury-input-pill"
                          value={getDisplayScrollEyebrow()}
                          onChange={(e) => updateLayout({ scrollEyebrow: e.target.value })}
                          placeholder={lang === 'km' ? t.products.defaultScrollEyebrow : 'Featured Collection'}
                        />
                      </div>
                      <div>
                        <label className="layout-field-label">{t.products.sectionTitle}</label>
                        <input
                          className="form-control luxury-input-pill"
                          value={getDisplayScrollTitle()}
                          onChange={(e) => updateLayout({ scrollTitle: e.target.value })}
                          placeholder={lang === 'km' ? t.products.defaultScrollTitle : 'New Arrivals'}
                        />
                      </div>
                    </div>
                    <div className="layout-box-actions">
                      <button type="button" className="layout-action-pill" onClick={() => handleBatchBoxPlacement('scroll', true)}>
                        {t.products.btnAddAllScroll}
                      </button>
                      <button type="button" className="layout-action-pill" onClick={() => handleBatchBoxPlacement('scroll', 'featured')}>
                        {t.products.btnFeaturedOnly}
                      </button>
                      <button type="button" className="layout-action-pill is-danger" onClick={() => handleBatchBoxPlacement('scroll', false)}>
                        {t.products.btnClearScroll}
                      </button>
                    </div>
                  </div>

                  <div className={`layout-box-panel ${!layout.showNormalGrid ? 'is-disabled' : 'is-normal-active'}`}>
                    <div className="layout-box-top">
                      <label className="luxury-toggle-label">
                        <input
                          type="checkbox"
                          className="luxury-toggle-checkbox"
                          checked={layout.showNormalGrid}
                          onChange={(e) => updateLayout({ showNormalGrid: e.target.checked })}
                        />
                        <span className="luxury-toggle-slider" />
                        <span className="luxury-toggle-text">{t.products.normalBoxLabel}</span>
                      </label>
                      <span className="badge badge-green" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11.5 }}>
                        {t.products.itemsCount.replace('{count}', normalCount)}
                      </span>
                    </div>
                    <div className="layout-fields-row">
                      <div>
                        <label className="layout-field-label">{t.products.eyebrowLabel}</label>
                        <input
                          className="form-control luxury-input-pill"
                          value={getDisplayNormalEyebrow()}
                          onChange={(e) => updateLayout({ normalEyebrow: e.target.value })}
                          placeholder={lang === 'km' ? t.products.defaultNormalEyebrow : 'Complete Catalog'}
                        />
                      </div>
                      <div>
                        <label className="layout-field-label">{t.products.sectionTitle}</label>
                        <input
                          className="form-control luxury-input-pill"
                          value={getDisplayNormalTitle()}
                          onChange={(e) => updateLayout({ normalTitle: e.target.value })}
                          placeholder={lang === 'km' ? t.products.defaultNormalTitle : 'All Products'}
                        />
                      </div>
                    </div>
                    <div className="layout-box-actions">
                      <button type="button" className="layout-action-pill" onClick={() => handleBatchBoxPlacement('normal', true)}>
                        {t.products.btnAddAllNormal}
                      </button>
                      <button type="button" className="layout-action-pill is-danger" onClick={() => handleBatchBoxPlacement('normal', false)}>
                        {t.products.btnClearNormal}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="storefront-layout-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {t.products.displayOrderLabel}
                    </label>
                    <select
                      className="sort-select luxury-select-pill"
                      value={layout.order}
                      onChange={(e) => updateLayout({ order: e.target.value })}
                      style={{ height: 36, fontSize: 12.5, borderRadius: 999, padding: '0 14px' }}
                    >
                      <option value="scroll_first">{t.products.orderScrollFirst}</option>
                      <option value="normal_first">{t.products.orderNormalFirst}</option>
                    </select>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.products.syncNote}</span>
                </div>
              </div>

              {/* Products Table */}
              <div className="react-card">
                {/* Category Chips Filter */}
                <div className="admin-category-chips">
                  {['all', "Men's", "Women's", 'Kids', 'Shoes', 'Accessories'].map((cat) => {
                    const count = cat === 'all' ? products.length : products.filter((p) => p.cat === cat).length;
                    const catLabel = cat === 'all'
                      ? t.products.allCategories
                      : cat === "Men's"
                      ? (lang === 'km' ? 'បុរស' : "Men's")
                      : cat === "Women's"
                      ? (lang === 'km' ? 'នារី' : "Women's")
                      : cat === 'Kids'
                      ? (lang === 'km' ? 'កុមារ' : 'Kids')
                      : cat === 'Shoes'
                      ? (lang === 'km' ? 'ស្បែកជើង' : 'Shoes')
                      : (lang === 'km' ? 'គ្រឿងតុបតែង' : 'Accessories');
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`admin-cat-chip ${productCatFilter === cat ? 'is-active' : ''}`}
                        onClick={() => setProductCatFilter(cat)}
                      >
                        <span>{catLabel}</span>
                        <span style={{ opacity: 0.65, fontSize: 11, marginLeft: 4 }}>({count})</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                    {t.products.catalogCount.replace('{count}', filteredProducts.length)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      className="form-control luxury-search-pill"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t.products.searchPlaceholder}
                      style={{ width: 250, height: 38, borderRadius: 999, padding: '0 16px', fontSize: 12.5 }}
                    />
                    <select
                      className="sort-select luxury-select-pill"
                      value={productCatFilter}
                      onChange={(e) => setProductCatFilter(e.target.value)}
                      style={{ height: 38, borderRadius: 999, padding: '0 14px', fontSize: 12.5 }}
                    >
                      <option value="all">{t.products.allCategories}</option>
                      <option value="Men's">{lang === 'km' ? 'បុរស' : "Men's"}</option>
                      <option value="Women's">{lang === 'km' ? 'នារី' : "Women's"}</option>
                      <option value="Kids">{lang === 'km' ? 'កុមារ' : 'Kids'}</option>
                      <option value="Shoes">{lang === 'km' ? 'ស្បែកជើង' : 'Shoes'}</option>
                      <option value="Accessories">{lang === 'km' ? 'គ្រឿងតុបតែង' : 'Accessories'}</option>
                    </select>
                    {quickEditAll ? (
                      <>
                        <button type="button" className="btn-luxury-action-pill is-secondary" onClick={() => setQuickEditAll(false)}>
                          {t.products.btnCancelQuickEdit}
                        </button>
                        <button type="button" className="btn-luxury-action-pill is-primary" onClick={saveQuickEdit}>
                          {t.products.btnSaveQuickEdits}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn-luxury-action-pill is-outline" onClick={enterQuickEdit}>
                        {t.products.btnQuickEdit}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="react-table">
                    <thead>
                      <tr>
                        <th>{t.products.colProduct}</th>
                        <th>{t.products.colCategory}</th>
                        <th>{t.products.colStorefrontBox}</th>
                        <th>{t.products.colPrice}</th>
                        <th>{t.products.colStock}</th>
                        <th>{t.products.colStatus}</th>
                        <th>{t.products.colActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const inScroll = isInScrollBox(p);
                        const inNormal = isInNormalGrid(p);
                        const d = draftEdits[p.sku];

                        return (
                          <tr key={p.sku}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                                <div>
                                  {quickEditAll && d ? (
                                    <input
                                      className="form-control"
                                      value={d.name}
                                      onChange={(e) =>
                                        setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], name: e.target.value } }))
                                      }
                                      style={{ height: 30, fontSize: 12.5, width: 180 }}
                                    />
                                  ) : (
                                    <div style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => { setEditingProduct(p); setModalOpen(true); }}>
                                      {p.name}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {p.sku} · {p.brand || 'Fashion Store KH'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {quickEditAll && d ? (
                                <select
                                  className="sort-select"
                                  value={d.cat}
                                  onChange={(e) =>
                                    setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], cat: e.target.value } }))
                                  }
                                  style={{ height: 30, fontSize: 12 }}
                                >
                                  <option value="Men's">{lang === 'km' ? 'បុរស' : "Men's"}</option>
                                  <option value="Women's">{lang === 'km' ? 'នារី' : "Women's"}</option>
                                  <option value="Kids">{lang === 'km' ? 'កុមារ' : 'Kids'}</option>
                                  <option value="Shoes">{lang === 'km' ? 'ស្បែកជើង' : 'Shoes'}</option>
                                  <option value="Accessories">{lang === 'km' ? 'គ្រឿងតុបតែង' : 'Accessories'}</option>
                                </select>
                              ) : (
                                <span className="badge badge-gray">
                                  {p.cat === "Men's" ? (lang === 'km' ? 'បុរស' : "Men's") : p.cat === "Women's" ? (lang === 'km' ? 'នារី' : "Women's") : p.cat === 'Kids' ? (lang === 'km' ? 'កុមារ' : 'Kids') : p.cat === 'Shoes' ? (lang === 'km' ? 'ស្បែកជើង' : 'Shoes') : (lang === 'km' ? 'គ្រឿងតុបតែង' : p.cat)}
                                </span>
                              )}
                            </td>
                            <td>
                              {quickEditAll && d ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <input
                                      type="checkbox"
                                      checked={d.inScrollBox}
                                      onChange={(e) =>
                                        setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], inScrollBox: e.target.checked } }))
                                      }
                                    />
                                    <span>{t.products.pillScroll}</span>
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <input
                                      type="checkbox"
                                      checked={d.inNormalGrid}
                                      onChange={(e) =>
                                        setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], inNormalGrid: e.target.checked } }))
                                      }
                                    />
                                    <span>{t.products.pillNormal}</span>
                                  </label>
                                </div>
                              ) : (
                                <div className="box-pill-group">
                                  <button
                                    type="button"
                                    className={`box-pill ${inScroll ? 'is-scroll-on' : ''}`}
                                    onClick={() => toggleProductPlacement(p.sku, 'scroll')}
                                  >
                                    {t.products.pillScroll}{inScroll ? ' ✓' : ''}
                                  </button>
                                  <button
                                    type="button"
                                    className={`box-pill ${inNormal ? 'is-normal-on' : ''}`}
                                    onClick={() => toggleProductPlacement(p.sku, 'normal')}
                                  >
                                    {t.products.pillNormal}{inNormal ? ' ✓' : ''}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td>
                              {quickEditAll && d ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  value={d.price}
                                  onChange={(e) =>
                                    setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], price: e.target.value } }))
                                  }
                                  style={{ width: 82, height: 30, fontSize: 12.5 }}
                                />
                              ) : (
                                <>
                                  <strong>{formatUSD(p.price)}</strong>
                                  {p.sale_price ? (
                                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{t.products.salePriceTag} {formatUSD(p.sale_price)}</div>
                                  ) : null}
                                </>
                              )}
                            </td>
                            <td>
                              {quickEditAll && d ? (
                                <input
                                  type="number"
                                  className="form-control"
                                  value={d.stock}
                                  onChange={(e) =>
                                    setDraftEdits((prev) => ({ ...prev, [p.sku]: { ...prev[p.sku], stock: e.target.value } }))
                                  }
                                  style={{ width: 70, height: 30, fontSize: 12.5 }}
                                />
                              ) : (
                                <span className={`stock-pill-health ${p.stock === 0 ? 'is-danger' : p.stock <= 5 ? 'is-warning' : 'is-healthy'}`}>
                                  <span className="stock-dot" />
                                  <span>{p.stock === 0 ? t.products.outOfStock : t.products.inStock.replace('{count}', p.stock)}</span>
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${p.status === 'active' || !p.status ? 'badge-green' : 'badge-gray'}`}>
                                {p.status === 'active' || !p.status ? t.products.statusActive : t.products.statusDraft}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="table-action-pill is-edit"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setModalOpen(true);
                                  }}
                                >
                                  {t.products.btnEdit}
                                </button>
                                <button
                                  type="button"
                                  className="table-action-pill is-delete"
                                  onClick={() => handleDeleteProduct(p.sku)}
                                >
                                  {t.products.btnDelete}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ── 3. ORDERS ── */}
          {activeTab === 'orders' && (
            <div className="react-card">
              {/* Order Status Filter Pills */}
              <div className="admin-category-chips">
                {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`admin-cat-chip ${orderStatusFilter === st ? 'is-active' : ''}`}
                    onClick={() => setOrderStatusFilter(st)}
                  >
                    <span>
                      {st === 'all'
                        ? t.orders.filterAll
                        : st === 'pending'
                        ? t.orders.filterPending
                        : st === 'confirmed'
                        ? t.orders.filterConfirmed
                        : st === 'processing'
                        ? t.orders.filterProcessing
                        : st === 'shipped'
                        ? t.orders.filterShipped
                        : t.orders.filterDelivered}
                    </span>
                    <span style={{ opacity: 0.65, fontSize: 11, marginLeft: 4 }}>
                      ({st === 'all' ? orders.length : orderCounts[st] || 0})
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                  {t.orders.customerOrders} ({filteredOrders.length})
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    className="form-control luxury-search-pill"
                    placeholder={t.orders.searchPlaceholder}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ width: 250, height: 38, borderRadius: 999, padding: '0 16px', fontSize: 12.5 }}
                  />
                  <select
                    className="sort-select luxury-select-pill"
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ height: 38, borderRadius: 999, padding: '0 14px', fontSize: 12.5 }}
                  >
                    <option value="all">{t.orders.allStatuses}</option>
                    <option value="pending">{t.orders.filterPending}</option>
                    <option value="confirmed">{t.orders.filterConfirmed}</option>
                    <option value="processing">{t.orders.filterProcessing}</option>
                    <option value="shipped">{t.orders.filterShipped}</option>
                    <option value="delivered">{t.orders.filterDelivered}</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="react-table">
                  <thead>
                    <tr>
                      <th>{t.orders.colOrderNum}</th>
                      <th>{t.orders.colCustomer}</th>
                      <th>{t.orders.colDate}</th>
                      <th>{t.orders.colPayment}</th>
                      <th>{t.orders.colCourier}</th>
                      <th>{t.orders.colTotal}</th>
                      <th>{t.orders.colStatusAction}</th>
                      <th>{t.orders.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                          {t.orders.noOrders}
                        </td>
                      </tr>
                    ) : filteredOrders.map((o) => {
                      const isCod = (o.payment_method === 'cod') || String(o.payment || '').toLowerCase().includes('cash');
                      const isDelivered = String(o.status || '').toLowerCase() === 'delivered';
                      const isPaid = (o.payment_status === 'paid') || isDelivered;
                      const trackingCode = o.tracking_number && o.tracking_number !== 'PENDING' ? o.tracking_number : null;
                      const courierName = o.courier && o.courier !== 'Pending Assignment' ? o.courier : 'J&T Express 🚚';

                      return (
                        <tr key={o.num}>
                          <td>
                            <strong>{o.num}</strong>
                            <div style={{ marginTop: 5 }}>
                              <button
                                type="button"
                                className="btn-5stage-pill"
                                onClick={() => setLifecycleOrder(o)}
                              >
                                {t.orders.btn5StageFlow}
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer?.phone}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', maxWidth: 190, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              📍 {o.customer?.address}
                            </div>
                          </td>
                          <td style={{ fontSize: 12 }}>{o.date}</td>
                          <td>
                            {isCod ? (
                              <div>
                                <span
                                  className="badge"
                                  style={{
                                    background: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                                    color: isPaid ? '#059669' : '#b45309',
                                    border: isPaid ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                                    fontWeight: 700,
                                    fontSize: 11,
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {isPaid ? t.orders.badgeCodPaid : t.orders.badgeCodUnpaid}
                                </span>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                                  {isPaid ? (lang === 'km' ? 'ប្រគល់ប្រាក់រួច' : 'Paid in Cash') : (lang === 'km' ? 'ទូទាត់ពេលដឹកដល់' : 'Pay on Delivery')}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span
                                  className="badge badge-green"
                                  style={{
                                    fontSize: 11,
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {t.orders.badgeKhqrPaid}
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{courierName}</div>
                            {trackingCode ? (
                              <code
                                style={{
                                  fontSize: 11,
                                  color: '#0284c7',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.25)',
                                  padding: '2px 9px',
                                  borderRadius: 999,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 3,
                                }}
                              >
                                {trackingCode}
                              </code>
                            ) : (
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, display: 'inline-block' }}>
                                {lang === 'km' ? 'មិនទាន់មាន Tracking' : 'No tracking yet'}
                              </span>
                            )}
                          </td>
                          <td>
                            <strong>{formatUSD(o.total)}</strong>
                            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{formatKHR(o.total)}</div>
                          </td>
                          <td style={{ minWidth: 165 }}>
                            <select
                              className="sort-select luxury-select-pill"
                              value={o.status || 'pending'}
                              onChange={(e) => updateOrderStatus(o.num, e.target.value)}
                              style={{ height: 34, fontSize: 12, width: '100%', marginBottom: 6, padding: '0 10px' }}
                            >
                              <option value="pending">{t.orders.statusPending}</option>
                              <option value="processing">{t.orders.statusProcessing}</option>
                              <option value="shipped">{t.orders.statusShipped}</option>
                              <option value="delivered">{t.orders.statusDelivered}</option>
                            </select>

                            {/* Quick Next Stage Action Button */}
                            {(!o.status || o.status === 'pending') && (
                              <button
                                type="button"
                                className="table-action-pill is-edit"
                                style={{
                                  fontSize: 11,
                                  height: 28,
                                  width: '100%',
                                  color: '#b45309',
                                  background: 'rgba(245, 158, 11, 0.08)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}
                                onClick={() => updateOrderStatus(o.num, 'processing')}
                              >
                                <span>📦</span>
                                <span>{t.orders.btnStartPackaging}</span>
                              </button>
                            )}
                            {o.status === 'processing' && (
                              <button
                                type="button"
                                className="table-action-pill"
                                style={{
                                  fontSize: 11,
                                  height: 28,
                                  width: '100%',
                                  background: 'linear-gradient(135deg, #c5a059 0%, #b38938 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  boxShadow: '0 2px 8px rgba(197, 160, 89, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                }}
                                onClick={() => {
                                  setDispatchOrder(o);
                                  setDispatchCourier(o.courier && o.courier !== 'Pending Assignment' ? o.courier : 'J&T Express 🚚');
                                  setDispatchTracking(o.tracking_number && o.tracking_number !== 'PENDING' ? o.tracking_number : `JT-${Math.floor(100000 + Math.random() * 900000)}KH`);
                                }}
                              >
                                <span>🚚</span>
                                <span>{t.orders.btnDispatchCourier}</span>
                              </button>
                            )}
                            {o.status === 'shipped' && (
                              <div style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: 11,
                                    height: 26,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 12px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#b45309',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: 999,
                                    fontWeight: 700,
                                  }}
                                  title={lang === 'km' ? 'អតិថិជនទទួលទំនិញ និងប្រគល់ប្រាក់ រួចចូលមកបញ្ជាក់លើ Website' : 'Customer receives goods and pays cash, then confirms on website'}
                                >
                                  {t.orders.btnAwaitingCustomer}
                                </span>
                                <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                                  {t.orders.customerControlled}
                                </span>
                              </div>
                            )}
                            {o.status === 'delivered' && (
                              <div style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: 11,
                                    height: 26,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 12px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#059669',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 999,
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.orders.btnDeliveredPaid}
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-action-pill is-receipt"
                              onClick={() => setReceiptOrder(o)}
                            >
                              {t.orders.btnReceipt}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* ── 4. INVENTORY ── */}
          {activeTab === 'inventory' && (
            <div>
              {/* Inventory Health Summary */}
              <div className="react-kpi-grid" style={{ marginBottom: 18 }}>
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.inventory.totalUnits}</span>
                    <div className="admin-kpi-icon-wrap">🏷️</div>
                  </div>
                  <div className="admin-kpi-val">{products.reduce((s, p) => s + (Number(p.stock) || 0), 0)}</div>
                  <div className="admin-kpi-sub">{t.inventory.acrossCatalog.replace('{count}', products.length)}</div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.inventory.healthyStock}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.25)' }}>✓</div>
                  </div>
                  <div className="admin-kpi-val" style={{ color: '#059669' }}>
                    {products.filter((p) => (Number(p.stock) || 0) > 10).length}
                  </div>
                  <div className="admin-kpi-sub">{t.inventory.healthySub}</div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.inventory.lowStockAlert}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.25)' }}>⚠️</div>
                  </div>
                  <div className="admin-kpi-val" style={{ color: '#d97706' }}>
                    {products.filter((p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 10).length}
                  </div>
                  <div className="admin-kpi-sub">{t.inventory.lowStockSub}</div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.inventory.outOfStock}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.25)' }}>✕</div>
                  </div>
                  <div className="admin-kpi-val" style={{ color: '#dc2626' }}>
                    {products.filter((p) => (Number(p.stock) || 0) === 0).length}
                  </div>
                  <div className="admin-kpi-sub">{t.inventory.outOfStockSub}</div>
                </div>
              </div>

              <div className="react-card">
                <h3 style={{ margin: '0 0 14px' }}>{t.inventory.stockAdjustmentTitle}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="react-table">
                    <thead>
                      <tr>
                        <th>{t.inventory.colProduct}</th>
                        <th>{t.inventory.colCategory}</th>
                        <th>{t.inventory.colCurrentUnits}</th>
                        <th>{t.inventory.colHealth}</th>
                        <th>{t.inventory.colQuickAdjust}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.sku}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img src={p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                              <div>
                                <div style={{ fontWeight: 700 }}>{p.name}</div>
                                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-gray" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11.5 }}>
                              {p.cat === "Men's" ? (lang === 'km' ? 'បុរស' : "Men's") : p.cat === "Women's" ? (lang === 'km' ? 'នារី' : "Women's") : p.cat === 'Kids' ? (lang === 'km' ? 'កុមារ' : 'Kids') : p.cat === 'Shoes' ? (lang === 'km' ? 'ស្បែកជើង' : 'Shoes') : (lang === 'km' ? 'គ្រឿងតុបតែង' : p.cat)}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control luxury-input-pill"
                              value={p.stock || 0}
                              onChange={(e) => adjustInventoryStock(p.sku, e.target.value, true)}
                              style={{ width: 88, height: 34, fontWeight: 700, textAlign: 'center' }}
                            />
                          </td>
                          <td>
                            <span className={`stock-pill-health ${p.stock === 0 ? 'is-danger' : p.stock <= 5 ? 'is-warning' : 'is-healthy'}`}>
                              <span className="stock-dot" />
                              <span>{p.stock === 0 ? t.inventory.outStock : p.stock <= 5 ? t.inventory.lowStock : t.inventory.optimal}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="table-action-pill is-delete"
                                style={{ width: 34, height: 30, padding: 0, fontSize: 11, fontWeight: 700 }}
                                onClick={() => adjustInventoryStock(p.sku, -5)}
                                title="-5 units"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                className="table-action-pill is-delete"
                                style={{ width: 34, height: 30, padding: 0, fontSize: 11, fontWeight: 700 }}
                                onClick={() => adjustInventoryStock(p.sku, -1)}
                                title="-1 unit"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                className="table-action-pill"
                                style={{
                                  width: 34,
                                  height: 30,
                                  padding: 0,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#059669',
                                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                }}
                                onClick={() => adjustInventoryStock(p.sku, 1)}
                                title="+1 unit"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                className="table-action-pill"
                                style={{
                                  width: 34,
                                  height: 30,
                                  padding: 0,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#059669',
                                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                }}
                                onClick={() => adjustInventoryStock(p.sku, 5)}
                                title="+5 units"
                              >
                                +5
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ── 5. USERS & CUSTOMERS ── */}
          {activeTab === 'users' && (
            <div>
              {/* User Metric Pills */}
              <div className="react-kpi-grid" style={{ marginBottom: 18 }}>
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.users.totalAccounts}</span>
                    <div className="admin-kpi-icon-wrap">👥</div>
                  </div>
                  <div className="admin-kpi-val">{users.length || 2}</div>
                  <div className="admin-kpi-sub">{t.users.totalAccountsSub}</div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.users.superAdmin}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(201, 169, 110, 0.16)', color: 'var(--accent-dark)', borderColor: 'rgba(201, 169, 110, 0.3)' }}>🛡️</div>
                  </div>
                  <div className="admin-kpi-val" style={{ color: 'var(--accent-dark)' }}>1</div>
                  <div className="admin-kpi-sub">{t.users.superAdminSub}</div>
                </div>

                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.users.activeCustomers}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.25)' }}>🛍️</div>
                  </div>
                  <div className="admin-kpi-val" style={{ color: '#059669' }}>
                    {users.filter(u => !u.roles?.includes('super_admin')).length || 1}
                  </div>
                  <div className="admin-kpi-sub">{t.users.activeCustomersSub}</div>
                </div>
              </div>

              <div className="react-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>{t.users.cardTitle.replace('{count}', users.length)}</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-luxury-action-pill is-outline" onClick={fetchUsers}>
                      {t.users.refreshBtn}
                    </button>
                    <button type="button" className="btn-luxury-action-pill is-primary" onClick={() => setNewUserModal(true)}>
                      {t.users.addUserBtn}
                    </button>
                  </div>
                </div>

                {usersLoading ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{t.users.loadingUsers}</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="react-table">
                      <thead>
                        <tr>
                          <th>{t.users.colUser}</th>
                          <th>{t.users.colEmail}</th>
                          <th>{t.users.colRole}</th>
                          <th>{t.users.colStatus}</th>
                          <th>{t.users.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                                  {(u.roles?.includes('super_admin') ? (avatarPreview || user?.avatar_url || user?.avatar || u.avatar) : (u.avatar || u.avatar_url || (u.email?.includes('hunnengnim') ? '/avatars/hunnengnim.jpg' : null) || (u.email?.includes('neng1207') ? '/avatars/neng.jpg' : null))) ? (
                                    <img
                                      src={u.roles?.includes('super_admin') ? (avatarPreview || user?.avatar_url || user?.avatar || u.avatar) : (u.avatar || u.avatar_url || (u.email?.includes('hunnengnim') ? '/avatars/hunnengnim.jpg' : '/avatars/neng.jpg'))}
                                      alt={u.name}
                                      style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: u.roles?.includes('super_admin') ? '2px solid #d4af37' : '2px solid #3b82f6',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                        display: 'block',
                                      }}
                                      onError={(e) => {
                                        if (!e.currentTarget.dataset.retried) {
                                          e.currentTarget.dataset.retried = 'true';
                                          if (u.email?.includes('hunnengnim')) {
                                            e.currentTarget.src = '/avatars/hunnengnim.jpg';
                                            return;
                                          }
                                          if (u.email?.includes('neng1207')) {
                                            e.currentTarget.src = '/avatars/neng.jpg';
                                            return;
                                          }
                                        }
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextSibling) {
                                          e.currentTarget.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: u.roles?.includes('super_admin') ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'rgba(59, 130, 246, 0.15)',
                                    color: u.roles?.includes('super_admin') ? '#0b0f19' : '#2563eb',
                                    display: u.avatar ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 13,
                                  }}>
                                    {(u.name || 'U')[0].toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700 }}>
                                    {u.email?.includes('hunnengnim') ? 'Nim' : (u.email?.includes('neng1207') ? 'Neng Neng12' : u.name)}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID #{u.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{u.email}</span>
                                {u.email?.includes('gmail.com') || u.email_verified ? (
                                  <span style={{
                                    fontSize: 10.5,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#2563eb',
                                    fontWeight: 700,
                                  }}>
                                    Google ✓
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              {u.roles?.includes('super_admin') ? (
                                <span className="badge badge-gold" style={{ borderRadius: 999, padding: '4px 12px' }}>{t.users.roleSuperAdmin}</span>
                              ) : (
                                <span className="badge badge-gray" style={{ borderRadius: 999, padding: '4px 12px' }}>{t.users.roleCustomer}</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`} style={{ borderRadius: 999, padding: '4px 12px' }}>
                                {u.is_active ? t.users.statusActive : t.users.statusDisabled}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  className="table-action-pill is-edit"
                                  onClick={() => handleToggleUserStatus(u.id)}
                                >
                                  {u.is_active ? t.users.btnDisable : t.users.btnEnable}
                                </button>
                                {!u.roles?.includes('super_admin') && u.id !== 1 && (
                                  <button
                                    type="button"
                                    className="table-action-pill is-delete"
                                    onClick={() => handleDeleteUser(u)}
                                    title={t.users.btnDelete}
                                  >
                                    {t.users.btnDelete}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ── 6. REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="react-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{t.reports.cardTitle}</h3>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{t.reports.cardSubtitle}</div>
                </div>
                <button type="button" className="btn-luxury-action-pill is-primary" onClick={exportCsv}>
                  {t.reports.btnExportCsv}
                </button>
              </div>

              <div className="react-kpi-grid">
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.reports.grossSalesUsd}</span>
                    <div className="admin-kpi-icon-wrap">💵</div>
                  </div>
                  <div className="admin-kpi-val">{formatUSD(totalRevenue)}</div>
                  <div className="admin-kpi-sub">{t.reports.lifetimeTotal}</div>
                </div>
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.reports.grossSalesKhr}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.25)' }}>៛</div>
                  </div>
                  <div className="admin-kpi-val" style={{ fontSize: 20 }}>{formatKHR(totalRevenue)}</div>
                  <div className="admin-kpi-sub">{t.reports.exchangeRateSub}</div>
                </div>
                <div className="admin-kpi-modern">
                  <div className="admin-kpi-head">
                    <span className="admin-kpi-label">{t.reports.ordersRecorded}</span>
                    <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.25)' }}>📦</div>
                  </div>
                  <div className="admin-kpi-val">{orders.length}</div>
                  <div className="admin-kpi-sub">
                    {t.reports.avgOrderSub.replace('{avg}', orders.length ? formatUSD(totalRevenue / orders.length) : '$0.00')}
                  </div>
                </div>
              </div>

              {/* Category Breakdown Progress Bars */}
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>
                  {t.reports.categoryShareTitle}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {categoryStats.map((item) => {
                    const catLabel = item.cat === "Men's" ? (lang === 'km' ? 'បុរស' : "Men's") : item.cat === "Women's" ? (lang === 'km' ? 'នារី' : "Women's") : item.cat === 'Kids' ? (lang === 'km' ? 'កុមារ' : 'Kids') : item.cat === 'Shoes' ? (lang === 'km' ? 'ស្បែកជើង' : 'Shoes') : (lang === 'km' ? 'គ្រឿងតុបតែង' : item.cat);
                    return (
                      <div key={item.cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700 }}>{catLabel}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {t.reports.categoryStatLine.replace('{items}', item.count).replace('{pct}', item.pct).replace('{units}', item.units)}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'var(--warm-gray)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${item.pct}%`,
                              background: 'linear-gradient(90deg, var(--accent) 0%, #b8860b 100%)',
                              borderRadius: 999,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 7. SETTINGS & BOUTIQUE PREFERENCES ── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Dual-Column Layout: Left Sticky Navigation & Right Content Panels */}
              <div className="settings-shell">
                {/* Left Navigation Card */}
                <div className="settings-nav-card">
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                      {t.settings.consoleTitle}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-nav-btn ${settingsSection === 'profile' ? 'active' : ''}`}
                    onClick={() => setSettingsSection('profile')}
                  >
                    <span style={{ fontSize: 18 }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.settings.tabProfile}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{t.settings.tabProfileSub}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`settings-nav-btn ${settingsSection === 'security' ? 'active' : ''}`}
                    onClick={() => setSettingsSection('security')}
                  >
                    <span style={{ fontSize: 18 }}>🔐</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.settings.tabSecurity}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{t.settings.tabSecuritySub}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`settings-nav-btn ${settingsSection === 'store' ? 'active' : ''}`}
                    onClick={() => setSettingsSection('store')}
                  >
                    <span style={{ fontSize: 18 }}>🏬</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.settings.tabStore}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{t.settings.tabStoreSub}</div>
                    </div>
                  </button>
                </div>

                {/* Right Content Panels */}
                <div style={{ minWidth: 0 }}>
                  {/* SECTION 1: PROFILE & AVATAR */}
                  {settingsSection === 'profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                      {/* Left: Avatar Branding Card */}
                      <div className="settings-card" style={{ marginBottom: 0 }}>
                        {/* Centered Avatar Display */}
                        <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                          <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 14px' }}>
                            {avatarPreview || user?.avatar || user?.avatar_url ? (
                              <img
                                src={avatarPreview || user?.avatar || user?.avatar_url}
                                alt="Admin Avatar Preview"
                                style={{
                                  width: 110,
                                  height: 110,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '3.5px solid #d4af37',
                                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.28)',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 110,
                                  height: 110,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #d4af37, #aa7c11)',
                                  border: '3.5px solid #d4af37',
                                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.28)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 48,
                                  color: '#ffffff',
                                }}
                              >
                                👑
                              </div>
                            )}
                            <div style={{
                              position: 'absolute',
                              bottom: 4,
                              right: 4,
                              background: '#10b981',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: '2.5px solid var(--card-bg)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }} />
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>
                            {adminProfileForm.name || 'AdminStore'}
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                            {adminProfileForm.email || 'adminstore@clothingshop.com'}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '3px 12px',
                              borderRadius: 999,
                              background: 'rgba(212, 175, 55, 0.15)',
                              color: '#d4af37',
                              border: '1px solid rgba(212, 175, 55, 0.35)',
                              letterSpacing: '0.4px',
                            }}>
                              👑 SUPER ADMIN
                            </span>
                          </div>
                        </div>

                        {/* File Upload Dropzone */}
                        <label
                          className="avatar-dropzone"
                          style={{
                            border: '1.5px dashed rgba(212, 175, 55, 0.5)',
                            borderRadius: 14,
                            padding: '16px 14px',
                            cursor: 'pointer',
                            display: 'block',
                            textAlign: 'center',
                            background: 'rgba(212, 175, 55, 0.04)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleAvatarFileSelect}
                            style={{ display: 'none' }}
                          />
                          <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {lang === 'km' ? 'ជ្រើសរើសរូបថតពីកុំព្យូទ័រ' : 'Choose Photo from Computer'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {lang === 'km' ? 'PNG, JPG ឬ WEBP មិនលើស 5MB' : 'PNG, JPG or WEBP up to 5MB'}
                          </div>
                        </label>
                      </div>

                      {/* Right: Profile Information Form */}
                      <div className="settings-card" style={{ marginBottom: 0 }}>
                        <div className="settings-card-head">
                          <div>
                            <h4 className="settings-card-title">
                              <span>👑</span>
                              <span>{t.settings.profileTitle}</span>
                            </h4>
                            <div className="settings-card-subtitle">{t.settings.profileSubtitle}</div>
                          </div>
                        </div>

                        <form onSubmit={handleSaveAdminProfile}>
                          <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {t.settings.labelName}
                            </label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">👤</span>
                              <input
                                className="settings-input"
                                value={adminProfileForm.name}
                                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                                placeholder="AdminStore"
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                                {t.settings.labelEmail}
                              </label>
                              <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 700 }}>
                                {lang === 'km' ? 'គណនីមេ' : 'Primary Login'}
                              </span>
                            </div>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">✉️</span>
                              <input
                                type="email"
                                className="settings-input"
                                value={adminProfileForm.email}
                                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                                placeholder="adminstore@clothingshop.com"
                                required
                              />
                            </div>
                            <small style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                              {lang === 'km' ? 'អ៊ីមែលផ្លូវការនេះត្រូវបានប្រើសម្រាប់ Login ចូល Admin Dashboard។' : 'This official email is used to login to the Admin Dashboard console.'}
                            </small>
                          </div>

                          <div className="form-group" style={{ marginBottom: 20 }}>
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {t.settings.labelPhone}
                            </label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">📞</span>
                              <input
                                type="tel"
                                className="settings-input"
                                value={adminProfileForm.phone || ''}
                                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                                placeholder="+855 12 345 678"
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                            <button
                              type="submit"
                              disabled={savingProfile}
                              className="btn btn-primary"
                              style={{
                                padding: '12px 28px',
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                                borderColor: '#d4af37',
                                color: '#0b0f19',
                                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                                cursor: 'pointer',
                              }}
                            >
                              {savingProfile ? t.settings.savingProfile : `✓ ${t.settings.btnSaveProfile}`}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: PASSWORD & SECURITY */}
                  {settingsSection === 'security' && (
                    <div className="settings-card" style={{ maxWidth: 640, marginBottom: 0 }}>
                      <div className="settings-card-head">
                        <div>
                          <h4 className="settings-card-title">
                            <span>🔐</span>
                            <span>{t.settings.securityTitle}</span>
                          </h4>
                          <div className="settings-card-subtitle">
                            {t.settings.securitySubtitle}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleUpdatePassword}>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                          <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>
                            {t.settings.labelCurrentPassword}
                          </label>
                          <div className="settings-input-wrap">
                            <span className="settings-input-icon">🔑</span>
                            <input
                              type={showCurrentPass ? 'text' : 'password'}
                              className="settings-input"
                              placeholder={lang === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Enter current password (store168)'}
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              style={{
                                position: 'absolute',
                                right: 12,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {showCurrentPass ? '👁️' : '👁️‍🗨️'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 16 }}>
                          <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>
                            {t.settings.labelNewPassword}
                          </label>
                          <div className="settings-input-wrap">
                            <span className="settings-input-icon">🔒</span>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              className="settings-input"
                              placeholder={lang === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួ)' : 'Enter strong new password'}
                              value={passwordForm.password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              style={{
                                position: 'absolute',
                                right: 12,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {showNewPass ? '👁️' : '👁️‍🗨️'}
                            </button>
                          </div>

                          {passwordForm.password && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                <span>{lang === 'km' ? 'កម្រិតសុវត្ថិភាពពាក្យសម្ងាត់៖' : 'Password Strength:'}</span>
                                <span style={{ fontWeight: 700, color: passwordForm.password.length >= 10 ? '#10b981' : (passwordForm.password.length >= 6 ? '#f59e0b' : '#ef4444') }}>
                                  {passwordForm.password.length >= 10 ? (lang === 'km' ? 'រឹងមាំខ្លាំង 💪' : 'Strong 💪') : (passwordForm.password.length >= 6 ? (lang === 'km' ? 'មធ្យម 👍' : 'Medium 👍') : (lang === 'km' ? 'ខ្សោយ ⚠️' : 'Weak ⚠️'))}
                                </span>
                              </div>
                              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(100, (passwordForm.password.length / 12) * 100)}%`,
                                  background: passwordForm.password.length >= 10 ? '#10b981' : (passwordForm.password.length >= 6 ? '#f59e0b' : '#ef4444'),
                                  transition: 'width 0.3s ease',
                                }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>
                            {t.settings.labelConfirmPassword}
                          </label>
                          <div className="settings-input-wrap">
                            <span className="settings-input-icon">🛡️</span>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              className="settings-input"
                              placeholder={lang === 'km' ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'}
                              value={passwordForm.password_confirmation}
                              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                              required
                              minLength={6}
                            />
                          </div>
                          {passwordForm.password_confirmation && (
                            <div style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600, color: passwordForm.password === passwordForm.password_confirmation ? '#10b981' : '#ef4444' }}>
                              {passwordForm.password === passwordForm.password_confirmation ? (lang === 'km' ? '✓ ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់ត្រឹមត្រូវ' : '✓ Passwords match') : (lang === 'km' ? '✗ ពាក្យសម្ងាត់មិនត្រូវគ្នាឡើយ' : '✗ Passwords do not match')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                          <button
                            type="submit"
                            disabled={savingPassword}
                            className="btn btn-primary"
                            style={{
                              padding: '12px 28px',
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                              borderColor: '#d4af37',
                              color: '#0b0f19',
                              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                              cursor: 'pointer',
                            }}
                          >
                            {savingPassword ? (lang === 'km' ? 'កំពុងផ្លាស់ប្ដូរ…' : 'Updating Password…') : `🔒 ${t.settings.btnSavePassword}`}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* SECTION 3: STORE & OPERATIONS */}
                  {settingsSection === 'store' && (
                    <div className="settings-card" style={{ marginBottom: 0 }}>
                      <div className="settings-card-head">
                        <div>
                          <h4 className="settings-card-title">
                            <span>🏪</span>
                            <span>{t.settings.storeTitle}</span>
                          </h4>
                          <div className="settings-card-subtitle">
                            {t.settings.storeSubtitle}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSaveStoreSettings}>
                        <div className="settings-form-row">
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelStoreName}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">🏷️</span>
                              <input
                                className="settings-input"
                                value={storeSettings.store_name}
                                onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelTagline}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">✨</span>
                              <input
                                className="settings-input"
                                value={storeSettings.tagline}
                                onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="settings-form-row">
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelSupportEmail}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">✉️</span>
                              <input
                                type="email"
                                className="settings-input"
                                value={storeSettings.email}
                                onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelSupportPhone}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">📞</span>
                              <input
                                className="settings-input"
                                value={storeSettings.phone}
                                onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 18 }}>
                          <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelAddress}</label>
                          <div className="settings-input-wrap">
                            <span className="settings-input-icon">📍</span>
                            <input
                              className="settings-input"
                              value={storeSettings.address}
                              onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="settings-form-row">
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelExchangeRate}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">៛</span>
                              <input
                                type="number"
                                className="settings-input"
                                value={storeSettings.exchange_rate}
                                onChange={(e) => setStoreSettings({ ...storeSettings, exchange_rate: Number(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 700 }}>{t.settings.labelShippingFee}</label>
                            <div className="settings-input-wrap">
                              <span className="settings-input-icon">$</span>
                              <input
                                type="number"
                                step="0.01"
                                className="settings-input"
                                value={storeSettings.delivery_fee}
                                onChange={(e) => setStoreSettings({ ...storeSettings, delivery_fee: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                          <button
                            type="submit"
                            disabled={savingStore}
                            className="btn btn-primary"
                            style={{
                              padding: '12px 28px',
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                              borderColor: '#d4af37',
                              color: '#0b0f19',
                              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                              cursor: 'pointer',
                            }}
                          >
                            {savingStore ? (lang === 'km' ? 'កំពុងរក្សាទុក…' : 'Saving…') : `✓ ${t.settings.btnSaveStore}`}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Add/Edit Modal */}
      <AdminProductModal
        open={modalOpen}
        editingProduct={editingProduct}
        existingSkus={products.map((p) => p.sku)}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        lang={lang}
      />

      {/* POS Receipt Modal */}
      {receiptOrder && (
        <div className="admin-modal-overlay open" onClick={(e) => e.target === e.currentTarget && setReceiptOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: 440, padding: 0, overflow: 'hidden', borderRadius: 16 }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🧾</span>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: 15, margin: 0 }}>Boutique POS Receipt</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Order #{receiptOrder.num}</div>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReceiptOrder(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="pos-receipt-paper">
                <div className="pos-receipt-header">
                  <div style={{ fontSize: 24, marginBottom: 4 }}>⚜️</div>
                  <div className="pos-receipt-logo">FASHION STORE</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>HAUTE COUTURE & READY-TO-WEAR</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Preah Sihanouk Blvd, BKK1, Phnom Penh<br />
                    Tel: +855 23 888 999 · VAT: KH10294812
                  </div>
                </div>

                <div className="pos-receipt-meta-grid">
                  <div><strong>{t.orders.invoiceNumber}:</strong> #{receiptOrder.num}</div>
                  <div><strong>{t.orders.receiptDate}:</strong> {receiptOrder.date || (lang === 'km' ? 'ថ្ងៃនេះ' : 'Today')}</div>
                  <div><strong>Cashier:</strong> Super Admin</div>
                  <div><strong>{t.orders.billTo}:</strong> {receiptOrder.customer?.name || receiptOrder.customer || (lang === 'km' ? 'អតិថិជនទូទៅ' : 'Walk-in Guest')}</div>
                </div>

                <table className="pos-receipt-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>{t.orders.thItem}</th>
                      <th style={{ textAlign: 'center', width: '15%' }}>{t.orders.thQty}</th>
                      <th style={{ textAlign: 'right', width: '20%' }}>{t.orders.thPrice}</th>
                      <th style={{ textAlign: 'right', width: '20%' }}>{t.orders.thTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptOrder.products || []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>
                          {item.name}
                          {item.size ? <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Size: {item.size}</div> : null}
                        </td>
                        <td style={{ textAlign: 'center' }}>×{item.qty}</td>
                        <td style={{ textAlign: 'right' }}>{formatUSD(item.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatUSD(item.price * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pos-receipt-divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>{t.orders.subtotal}</span>
                    <span>{formatUSD(receiptOrder.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>{t.orders.deliveryFee}</span>
                    <span>$0.00 ({lang === 'km' ? 'ឥតគិតថ្លៃ' : 'Free'})</span>
                  </div>
                  <div className="pos-receipt-divider" />
                  <div className="pos-receipt-total-row">
                    <span style={{ fontSize: 15 }}>{lang === 'km' ? 'ទឹកប្រាក់សរុប (USD):' : 'TOTAL USD:'}</span>
                    <span style={{ fontSize: 18, color: 'var(--accent)' }}>{formatUSD(receiptOrder.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span>{lang === 'km' ? 'ទឹកប្រាក់សរុប (KHR):' : 'TOTAL KHR:'}</span>
                    <span>{formatKHR(receiptOrder.total)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.orders.paymentMethod}: <strong>{receiptOrder.payment || 'Cash on Delivery'}</strong></span>
                  {receiptOrder.payment_status === 'paid' || receiptOrder.status === 'delivered' ? (
                    <span className="pos-paid-stamp">✓ {lang === 'km' ? 'ទូទាត់រួច' : 'PAID'}</span>
                  ) : (
                    <span className="pos-paid-stamp" style={{ borderColor: '#d97706', color: '#b45309' }}>⏳ COD {lang === 'km' ? 'មិនទាន់បង់' : 'UNPAID'}</span>
                  )}
                </div>

                <div className="pos-receipt-barcode">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2].map((w, i) => (
                    <div key={i} className="pos-barcode-bar" style={{ width: w }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                  * {receiptOrder.num} *
                </div>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                  {lang === 'km' ? (
                    <>✦ អរគុណសម្រាប់ការទិញទំនិញនៅ Fashion Store! ✦<br />ទំនិញអាចប្ដូរបានក្នុងរយៈពេល ៧ ថ្ងៃដោយមានស្លាកសញ្ញាភ្ជាប់មកជាមួយ។</>
                  ) : (
                    <>✦ Thank you for shopping with Fashion Store! ✦<br />Items eligible for exchange within 7 days with tags attached.</>
                  )}
                </div>
              </div>
            </div>
            <div className="admin-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-luxury-action-pill is-outline" onClick={() => window.print()}>
                {t.orders.printReceipt}
              </button>
              <button type="button" className="btn-luxury-action-pill is-primary" onClick={() => setReceiptOrder(null)}>
                {t.orders.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier Dispatch Modal */}
      {dispatchOrder && (
        <div className="admin-modal-overlay open" onClick={(e) => e.target === e.currentTarget && setDispatchOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: 520, borderRadius: 20 }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🚚</span>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: 16, margin: 0 }}>{t.orders.dispatchTitle}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{dispatchOrder.num} · {dispatchOrder.customer?.name}</div>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDispatchOrder(null)}>✕</button>
            </div>

            <div className="admin-modal-body" style={{ padding: '20px' }}>
              <div style={{ background: 'var(--warm-gray, #f8fafc)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 12 }}>
                <div>📍 <strong>{t.orders.address}:</strong> {dispatchOrder.customer?.address || 'Phnom Penh, Cambodia'}</div>
                <div style={{ marginTop: 4 }}>📞 <strong>{t.orders.phone}:</strong> {dispatchOrder.customer?.phone}</div>
                <div style={{ marginTop: 4 }}>💵 <strong>{t.orders.paymentMethod}:</strong> {dispatchOrder.payment || 'Cash on Delivery'} ({formatUSD(dispatchOrder.total)})</div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>{t.orders.providerLabel}</label>
                <select
                  className="sort-select luxury-select-pill"
                  value={dispatchCourier}
                  onChange={(e) => {
                    setDispatchCourier(e.target.value);
                    const prefix = e.target.value.includes('Virak') ? 'VET' : e.target.value.includes('Grab') ? 'GRB' : e.target.value.includes('Capitol') ? 'CAP' : 'JT';
                    setDispatchTracking(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}KH`);
                  }}
                  style={{ width: '100%', height: 40, padding: '0 14px' }}
                >
                  <option value="J&T Express 🚚">J&T Express 🚚</option>
                  <option value="Virak Buntham (VET) 🚌">Virak Buntham (VET) 🚌</option>
                  <option value="Capitol Express 📦">Capitol Express 📦</option>
                  <option value="Grab Express 🛵">Grab Express 🛵</option>
                  <option value="ហាងដឹកផ្ទាល់ (Store Courier) 🛵">ហាងដឹកផ្ទាល់ (Store Courier) 🛵</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.orders.trackingLabel} *</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: '0 4px', color: '#0284c7' }}
                    onClick={() => {
                      const prefix = dispatchCourier.includes('Virak') ? 'VET' : dispatchCourier.includes('Grab') ? 'GRB' : dispatchCourier.includes('Capitol') ? 'CAP' : 'JT';
                      setDispatchTracking(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}KH`);
                    }}
                  >
                    ⚡ Auto-Generate
                  </button>
                </label>
                <input
                  className="form-control luxury-input-pill"
                  value={dispatchTracking}
                  onChange={(e) => setDispatchTracking(e.target.value)}
                  placeholder="e.g. JT-894210KH"
                  style={{ fontFamily: 'monospace', fontWeight: 700, height: 40 }}
                  required
                />
              </div>

              <div style={{ background: 'rgba(234, 88, 12, 0.08)', border: '1px solid rgba(234, 88, 12, 0.25)', borderRadius: 12, padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 700, color: '#ea580c', marginBottom: 2 }}>📍 {t.orders.step4Title}</div>
                <div>{t.orders.trackingHint}</div>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-luxury-action-pill is-secondary" onClick={() => setDispatchOrder(null)}>
                {t.orders.cancelBtn}
              </button>
              <button
                type="button"
                className="btn-luxury-action-pill is-primary"
                onClick={() => {
                  updateOrderStatus(dispatchOrder.num, 'shipped', {
                    courier: dispatchCourier,
                    tracking_number: dispatchTracking || `JT-${Math.floor(100000 + Math.random() * 900000)}KH`,
                  });
                  setDispatchOrder(null);
                }}
              >
                {t.orders.dispatchConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Stage Order Lifecycle Flow Modal */}
      {lifecycleOrder && (
        <div className="admin-modal-overlay open" onClick={(e) => e.target === e.currentTarget && setLifecycleOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: 680, borderRadius: 16 }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🗺️</span>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: 16, margin: 0 }}>{t.orders.flowModalTitle}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Order #{lifecycleOrder.num} · Customer: {lifecycleOrder.customer?.name}</div>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLifecycleOrder(null)}>✕</button>
            </div>

            <div className="admin-modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Stepper Steps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    stage: 1,
                    icon: '🛒',
                    actor: t.orders.step1Actor,
                    title: t.orders.step1Title,
                    desc: t.orders.step1Desc,
                    statusKey: 'checkout',
                    isDone: true,
                  },
                  {
                    stage: 2,
                    icon: '📥',
                    actor: t.orders.step2Actor,
                    title: t.orders.step2Title,
                    desc: t.orders.step2Desc,
                    statusKey: 'pending',
                    isDone: true,
                  },
                  {
                    stage: 3,
                    icon: '📦',
                    actor: t.orders.step3Actor,
                    title: t.orders.step3Title,
                    desc: t.orders.step3Desc,
                    statusKey: 'processing',
                    isDone: lifecycleOrder.status === 'processing' || lifecycleOrder.status === 'shipped' || lifecycleOrder.status === 'delivered',
                    actionBtn: lifecycleOrder.status === 'pending' ? (
                      <button
                        type="button"
                        className="table-action-pill is-edit"
                        style={{ fontSize: 11, padding: '0 12px', height: 28, color: '#b45309', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                        onClick={() => {
                          updateOrderStatus(lifecycleOrder.num, 'processing');
                          setLifecycleOrder((prev) => ({ ...prev, status: 'processing' }));
                        }}
                      >
                        {t.orders.step3Btn}
                      </button>
                    ) : null,
                  },
                  {
                    stage: 4,
                    icon: '🚚',
                    actor: t.orders.step4Actor,
                    title: t.orders.step4Title,
                    desc: t.orders.step4Desc
                      .replace('{courier}', lifecycleOrder.courier || 'J&T Express 🚚')
                      .replace('{tracking}', lifecycleOrder.tracking_number || 'PENDING'),
                    statusKey: 'shipped',
                    isDone: lifecycleOrder.status === 'shipped' || lifecycleOrder.status === 'delivered',
                    actionBtn: lifecycleOrder.status === 'processing' ? (
                      <button
                        type="button"
                        className="table-action-pill"
                        style={{ fontSize: 11, padding: '0 12px', height: 28, background: 'linear-gradient(135deg, #c5a059 0%, #b38938 100%)', color: '#ffffff', border: 'none', boxShadow: '0 2px 8px rgba(197, 160, 89, 0.35)' }}
                        onClick={() => {
                          setDispatchOrder(lifecycleOrder);
                          setLifecycleOrder(null);
                        }}
                      >
                        {t.orders.step4Btn}
                      </button>
                    ) : null,
                  },
                  {
                    stage: 5,
                    icon: '🏁',
                    actor: t.orders.step5Actor,
                    title: t.orders.step5Title,
                    desc: t.orders.step5Desc,
                    statusKey: 'delivered',
                    isDone: lifecycleOrder.status === 'delivered',
                    actionBtn: lifecycleOrder.status === 'delivered' ? (
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>✅</span>
                        <span>{t.orders.step5Done}</span>
                      </span>
                    ) : lifecycleOrder.status === 'shipped' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#b45309',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: 999,
                            fontWeight: 600,
                          }}
                        >
                          {t.orders.step5Waiting}
                        </span>
                        <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                          {t.orders.customerControlled}
                        </span>
                      </div>
                    ) : null,
                  },
                ].map((step) => {
                  const isCurrent =
                    (step.stage === 2 && (!lifecycleOrder.status || lifecycleOrder.status === 'pending')) ||
                    (step.stage === 3 && lifecycleOrder.status === 'processing') ||
                    (step.stage === 4 && lifecycleOrder.status === 'shipped') ||
                    (step.stage === 5 && lifecycleOrder.status === 'delivered');

                  return (
                    <div
                      key={step.stage}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 12,
                        borderRadius: 14,
                        background: isCurrent ? 'rgba(212, 175, 55, 0.12)' : 'var(--warm-gray, #f8fafc)',
                        border: isCurrent ? '1.5px solid #d4af37' : '1px solid var(--border)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: step.isDone ? (step.stage === 5 ? '#10b981' : '#d4af37') : 'var(--border)',
                          color: step.isDone ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {step.isDone && step.stage < 5 && !isCurrent ? '✓' : step.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', marginRight: 6 }}>
                              {step.actor}
                            </span>
                            <strong style={{ fontSize: 13, color: isCurrent ? 'var(--accent-dark, #b45309)' : 'var(--text-primary)' }}>
                              {step.title}
                            </strong>
                          </div>
                          {isCurrent ? (
                            <span className="badge badge-gold" style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999 }}>
                              {lang === 'km' ? '📍 ដំណាក់កាលសកម្ម' : '📍 ACTIVE STAGE'}
                            </span>
                          ) : step.isDone ? (
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                              {lang === 'km' ? '✓ បានបញ្ចប់' : '✓ Completed'}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {lang === 'km' ? 'រង់ចាំ' : 'Pending'}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                          {step.desc}
                        </div>

                        {step.actionBtn && (
                          <div style={{ marginTop: 8 }}>
                            {step.actionBtn}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="table-action-pill is-edit" onClick={() => setLifecycleOrder(null)}>
                {t.orders.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {newUserModal && (
        <div className="admin-modal-overlay open" onClick={(e) => e.target === e.currentTarget && setNewUserModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🛍️</span>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0 }}>{t.users.modalTitle}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.users.modalSubtitle}</div>
                </div>
              </div>
              <button
                type="button"
                className="table-action-pill"
                style={{ width: 32, height: 32, padding: 0, fontSize: 14 }}
                onClick={() => setNewUserModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="admin-modal-body" style={{ padding: '20px 24px' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: 'rgba(201, 169, 110, 0.12)',
                  border: '1px solid rgba(201, 169, 110, 0.35)',
                  fontSize: 12,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}>
                  {lang === 'km'
                    ? '🛡️ ក្បួនប្រព័ន្ធ៖ ការបង្កើតគណនីគឺសម្រាប់តែអតិថិជនប៉ុណ្ណោះ។ គណនីអ្នកគ្រប់គ្រងជាន់ខ្ពស់ (AdminStore) មានតែមួយគត់ និងមិនអាចបង្កើតស្ទួនឡើយ។'
                    : '🛡️ System Rule: Only Customer accounts can be created. The master administrator account (AdminStore) is unique and cannot be duplicated.'}
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{t.users.labelName}</label>
                  <input
                    className="form-control"
                    placeholder={lang === 'km' ? 'សុខា ចាន់' : 'Enter FullName'}
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{t.users.labelEmail}</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={lang === 'km' ? 'user@gmail.com' : 'Enter Email'}
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    required
                  />
                  <small style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                    {lang === 'km' ? 'អ៊ីមែលត្រូវតែត្រឹមត្រូវតាមទម្រង់ (ឧ. user@gmail.com)។' : 'Email must be valid and formatted correctly (e.g. user@gmail.com).'}
                  </small>
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{t.users.labelPhone}</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder={lang === 'km' ? '012 345 678' : '012 345 678'}
                    value={newUserForm.phone || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{t.users.labelPassword}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewUserPass ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingRight: 42 }}
                      placeholder={lang === 'km' ? '••••••••' : 'Enter Password'}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPass(!showNewUserPass)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showNewUserPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>{lang === 'km' ? 'តួនាទីគណនី' : 'Account Role'}</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: 999,
                    background: 'var(--warm-gray)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    <span>🛍️ {t.users.roleCustomer}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {lang === 'km' ? '🔒 បានចាក់សោ (អនុញ្ញាតត្រឹមតែ ១ Admin)' : '🔒 Locked (Only 1 Admin allowed)'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn-luxury-action-pill is-secondary" onClick={() => setNewUserModal(false)}>
                  {t.users.btnCancel}
                </button>
                <button type="submit" className="btn-luxury-action-pill is-primary">
                  ✨ {t.users.btnCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

