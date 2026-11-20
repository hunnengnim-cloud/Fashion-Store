import React, { useEffect, useMemo, useState } from 'react';
import { api, isAdminUser, notify, setAuth } from '../lib/store';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CambodiaFlagIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  GoogleIcon,
  ShieldCheckIcon,
  TruckIcon,
  UkFlagIcon,
} from '../components/Icons';

const T = {
  en: {
    langBtnKm: 'ភាសាខ្មែរ',
    langBtnEn: 'English',
    backToShop: 'Back to Shop',
    brandName: 'Fashion Store',
    adminConsole: 'Admin Console',
    welcomeBack: 'Welcome Back',
    createCustomerAccount: 'Create Account',
    adminSubtitle: 'Sign in to store management dashboard',
    customerLoginSubtitle: 'Sign in to access your orders and checkout',
    customerRegisterSubtitle: 'Register a new customer account',
    customerTab: 'Customer',
    adminTab: 'Administrator',
    signInMode: 'Sign In',
    registerMode: 'Create Account',
    adminNoticeTitle: 'Administrator Account is Unique',
    adminNoticeDesc: 'Only the authorized administrator may log in. Customer registration is available on the Customer tab.',
    fullName: 'Full Name *',
    fullNamePlaceholder: 'Enter full name',
    adminAccountLabel: 'Username or Email *',
    adminPlaceholder: 'Enter email or username',
    adminHint: 'Master administrator username',
    emailLabel: 'Email Address *',
    emailPlaceholder: 'Enter email address',
    password: 'Password *',
    passwordPlaceholder: 'Enter password',
    confirmPassword: 'Confirm Password *',
    confirmPasswordPlaceholder: 'Confirm password',
    verifying: 'Verifying…',
    btnAdminLogin: 'Sign In to Dashboard',
    btnCustomerLogin: 'Sign In',
    btnCustomerRegister: 'Create Account',
    adminAutofill: 'Demo Admin: AdminStore / store168',
    autofillBtn: 'Auto-fill',
    noAccountPrompt: "Don't have an account?",
    registerLink: 'Create one',
    hasAccountPrompt: 'Already have an account?',
    loginLink: 'Sign in',
    editorialBrand: 'Fashion Store',
    editorialCollection: 'Autumn / Winter 2026',
    editorialEyebrow: 'Haute Couture & Ready-to-Wear',
    editorialQuote1: 'Elegance is not standing out,',
    editorialQuote2: 'but being remembered.',
    editorialDesc: 'Discover bespoke tailoring, synchronized wishlists, instant Bakong KHQR checkout, and express delivery.',
    editorialBadge1: 'Same-Day Express Delivery in Phnom Penh',
    editorialBadge2: 'Secure Shopping & Bakong KHQR Payments',
    editorialLocation: 'Phnom Penh · BKK1 Flagship',
    editorialRights: 'Fashion Store KH © 2026',
    footerRights: '© 2026 Fashion Store. All rights reserved.',
    footerLocation: 'BKK1, Phnom Penh · Cambodia',
    toastWelcome: 'Welcome back, ',
    toastSuccessRegister: 'Account created successfully for ',
    errorInvalidLogin: 'Incorrect credentials or non-existent email domain.',
    adminBlockedRegister: 'New account creation is strictly for Customers only. Admin account is unique.',
    customerCreatedFail: 'Could not create account. Please check your details.',
    signInWithGoogle: 'Continue with Google',
    orDivider: 'Or continue with email',
    googleConnectTitle: 'Sign in with Google / Real Email',
    googleModalSubtitle: 'Direct verification with a secure 6-digit code sent to your real email inbox.',
    googleAccountPrompt: 'Real Gmail or Email Address *',
    googleEmailPlaceholder: 'yourname@gmail.com',
    btnSubmitGoogle: 'Continue with Google / Email',
    verifyingRealGoogle: 'Signing in to Email account…',
    googleModalFooter: '100% verified — only real email owners with code can sign in',
    googleEmailValid: '• A 6-digit code will be sent to this email. Fake emails will not receive a code.',
    googleEmailCustom: '• A 6-digit code will be sent to this email. Fake emails will not receive a code.',
    otpEmailHint: '• Enter your real Gmail. Fake or non-existent emails will never receive a code.',
    otpModalTitleStep1: 'Sign in with Google',
    otpModalSubtitleStep1: 'Enter your Gmail to receive a secure 6-digit verification code.',
    otpEmailPrompt: 'Gmail Address *',
    btnSendOtp: 'Get 6-Digit Code →',
    sendingOtp: 'Signing in to Email account…',
    otpModalTitleStep2: 'Enter 6-Digit Code',
    otpModalSubtitleStep2: 'We sent a 6-digit verification code to',
    otpChangeEmail: 'Change email',
    otpCodePrompt: '6-Digit Verification Code',
    btnVerifyOtp: 'Verify & Sign In',
    verifyingOtp: 'Verifying code…',
    otpResendWait: 'Resend code in',
    otpResendBtn: 'Resend Code',
    otpSecurityFooter: 'Only verified real email owners can sign in',
    setPasswordTitle: 'Set Password for Next Time',
    setPasswordSubtitle: 'Sign in successful! Set a password so you can log in with email & password next time.',
    newPasswordLabel: 'New Password *',
    newPasswordPlaceholder: 'At least 6 characters',
    confirmNewPasswordLabel: 'Confirm New Password *',
    btnSavePassword: 'Save Password & Enter Shop →',
    btnSkipPassword: 'Skip for Now (Enter Shop)',
    passwordSavedSuccess: 'Password saved! You can now use it to log in next time.',
    passwordMismatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters.',
    googleInitializing: 'Google Sign-In is initializing. Please try again in a few seconds.',
    googleAuthFailed: 'Google authentication failed.',
    googlePopupBlocked: 'Could not open Google popup. Please allow popups or use email/password.',
    googleNotReady: 'Google OAuth Client ID is not configured. Please use email and password.',
  },
  km: {
    langBtnKm: 'ភាសាខ្មែរ',
    langBtnEn: 'English',
    backToShop: 'ត្រឡប់ទៅទំព័រដើម',
    brandName: 'ហាងម៉ូដសម្លៀកបំពាក់',
    adminConsole: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
    welcomeBack: 'សូមស្វាគមន៍ការត្រឡប់មកវិញ',
    createCustomerAccount: 'បង្កើតគណនីថ្មី',
    adminSubtitle: 'ចូលកាន់ផ្ទាំងគ្រប់គ្រងទិន្នន័យហាង',
    customerLoginSubtitle: 'ចូលគណនីដើម្បីទិញទំនិញ និងពិនិត្យការបញ្ជាទិញ',
    customerRegisterSubtitle: 'ចុះឈ្មោះបង្កើតគណនីអតិថិជនថ្មី',
    customerTab: 'អតិថិជន',
    adminTab: 'អ្នកគ្រប់គ្រង',
    signInMode: 'ចូលគណនី',
    registerMode: 'ចុះឈ្មោះ',
    adminNoticeTitle: 'គណនីអ្នកគ្រប់គ្រងមានតែមួយគត់',
    adminNoticeDesc: 'មិនអនុញ្ញាតឱ្យបង្កើតគណនីអ្នកគ្រប់គ្រងថ្មីឡើយ។ មានតែអ្នកគ្រប់គ្រងផ្លូវការប៉ុណ្ណោះដែលអាចចូលគ្រប់គ្រងបាន។',
    fullName: 'ឈ្មោះពេញ *',
    fullNamePlaceholder: 'បញ្ចូលឈ្មោះពេញ (ឧ. សុខា ចាន់)',
    adminAccountLabel: 'ឈ្មោះគណនី ឬ អ៊ីមែល *',
    adminPlaceholder: 'បញ្ចូលអ៊ីមែល ឬ ឈ្មោះគណនី',
    adminHint: 'ឈ្មោះគណនីអ្នកគ្រប់គ្រងចម្បងតែមួយគត់',
    emailLabel: 'អាសយដ្ឋានអ៊ីមែល *',
    emailPlaceholder: 'បញ្ចូលអាសយដ្ឋានអ៊ីមែល',
    password: 'ពាក្យសម្ងាត់ *',
    passwordPlaceholder: 'បញ្ចូលពាក្យសម្ងាត់',
    confirmPassword: 'បញ្ជាក់ពាក្យសម្ងាត់ *',
    confirmPasswordPlaceholder: 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់',
    verifying: 'កំពុងផ្ទៀងផ្ទាត់…',
    btnAdminLogin: 'ចូលផ្ទាំងគ្រប់គ្រង',
    btnCustomerLogin: 'ចូលគណនី',
    btnCustomerRegister: 'បង្កើតគណនី',
    adminAutofill: 'គណនីសាកល្បង: AdminStore / store168',
    autofillBtn: 'បំពេញស្វ័យប្រវត្តិ',
    noAccountPrompt: 'មិនទាន់មានគណនីមែនទេ?',
    registerLink: 'ចុះឈ្មោះទីនេះ',
    hasAccountPrompt: 'មានគណនីរួចហើយមែនទេ?',
    loginLink: 'ចូលគណនីទីនេះ',
    editorialBrand: 'ហាងម៉ូដសម្លៀកបំពាក់',
    editorialCollection: 'រដូវស្លឹកឈើជ្រុះ / រដូវរងា ឆ្នាំ២០២៦',
    editorialEyebrow: 'ម៉ូដសម្លៀកបំពាក់ទាន់សម័យ និងប្រណិត',
    editorialQuote1: 'ភាពថ្លៃថ្នូរមិនមែនគ្រាន់តែលេចធ្លោទេ',
    editorialQuote2: 'តែជាការចងចាំដិតក្នុងចិត្ត។',
    editorialDesc: 'ស្វែងរកសម្លៀកបំពាក់កាត់ដេរប្រណិត បញ្ជីទំនិញពេញចិត្ត ការទូទាត់រហ័សតាម KHQR និងសេវាដឹកជញ្ជូនរហ័សទូទាំងរាជធានីភ្នំពេញ។',
    editorialBadge1: 'សេវាដឹកជញ្ជូនរហ័សក្នុងថ្ងៃតែមួយនៅរាជធានីភ្នំពេញ',
    editorialBadge2: 'សុវត្ថិភាពខ្ពស់ និងការទូទាត់តាម KHQR',
    editorialLocation: 'បឹងកេងកង១, រាជធានីភ្នំពេញ',
    editorialRights: 'រក្សាសិទ្ធិគ្រប់យ៉ាង © ២០២៦',
    footerRights: '© ២០២៦ រក្សាសិទ្ធិគ្រប់យ៉ាង',
    footerLocation: 'បឹងកេងកង១, រាជធានីភ្នំពេញ · ប្រទេសកម្ពុជា',
    toastWelcome: 'សូមស្វាគមន៍ការត្រឡប់មកវិញ ',
    toastSuccessRegister: 'បង្កើតគណនីអតិថិជនជោគជ័យសម្រាប់ ',
    errorInvalidLogin: 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ។',
    adminBlockedRegister: 'ការចុះឈ្មោះគឺសម្រាប់តែអតិថិជនប៉ុណ្ណោះ។ គណនីអ្នកគ្រប់គ្រងមានតែមួយគត់។',
    customerCreatedFail: 'មិនអាចបង្កើតគណនីបានឡើយ។ សូមពិនិត្យមើលព័ត៌មានរបស់អ្នកឡើងវិញ។',
    signInWithGoogle: 'ចូលគណនីជាមួយ Google',
    orDivider: 'ឬបន្តជាមួយអ៊ីមែល',
    googleConnectTitle: 'ចូលគណនីជាមួយ Google',
    googleModalSubtitle: 'ផ្ទៀងផ្ទាត់ដោយផ្ទាល់តាមរយៈលេខកូដសម្ងាត់ ៦ ខ្ទង់ផ្ញើទៅកាន់ Email របស់អ្នក។',
    googleAccountPrompt: 'អាសយដ្ឋាន Gmail *',
    googleEmailPlaceholder: 'yourname@gmail.com',
    btnSubmitGoogle: 'ចូលគណនីជាមួយ Google',
    verifyingRealGoogle: 'កំពុងចូលទៅកាន់គណនី Email…',
    googleModalFooter: 'ធានា ១០០% ថាមានតែម្ចាស់ Email ពិតប្រាកដទើបអាចចូលបាន',
    googleEmailValid: '• លេខកូដ ៦ ខ្ទង់នឹងត្រូវផ្ញើទៅកាន់ Email នេះផ្ទាល់',
    googleEmailCustom: '• លេខកូដ ៦ ខ្ទង់នឹងត្រូវផ្ញើទៅកាន់ Email នេះផ្ទាល់',
    otpEmailHint: '',
    otpModalTitleStep1: 'ចូលគណនីជាមួយ Google',
    otpModalSubtitleStep1: 'បញ្ចូល Gmail របស់អ្នកដើម្បីទទួលលេខកូដសម្ងាត់ផ្ទៀងផ្ទាត់ ៦ ខ្ទង់។',
    otpEmailPrompt: 'អាសយដ្ឋាន Gmail *',
    btnSendOtp: 'ទទួលលេខកូដ ៦ ខ្ទង់ →',
    sendingOtp: 'កំពុងចូលទៅកាន់គណនី Email…',
    otpModalTitleStep2: 'បញ្ចូលលេខកូដផ្ទៀងផ្ទាត់ ៦ ខ្ទង់',
    otpModalSubtitleStep2: 'លេខកូដសម្ងាត់ ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់',
    otpChangeEmail: 'ផ្លាស់ប្ដូរ Email',
    otpCodePrompt: 'លេខកូដ ៦ ខ្ទង់ (OTP)',
    btnVerifyOtp: 'ផ្ទៀងផ្ទាត់ & ចូលគណនី',
    verifyingOtp: 'កំពុងផ្ទៀងផ្ទាត់លេខកូដ…',
    otpResendWait: 'ផ្ញើម្ដងទៀតក្នុង',
    otpResendBtn: 'ផ្ញើលេខកូដម្ដងទៀត',
    otpSecurityFooter: 'ធានា ១០០% ថាមានតែម្ចាស់ Email ពិតប្រាកដទើបអាចចូលបាន',
    setPasswordTitle: 'បង្កើតពាក្យសម្ងាត់សម្រាប់ចូលលើកក្រោយ',
    setPasswordSubtitle: 'ចូលគណនីជោគជ័យ! បង្កើតពាក្យសម្ងាត់ផ្ទាល់ខ្លួន ដើម្បីអាច Login ជាមួយ Email និង Password នៅលើកក្រោយបាន។',
    newPasswordLabel: 'ពាក្យសម្ងាត់ថ្មី *',
    newPasswordPlaceholder: 'យ៉ាងតិច ៦ ខ្ទង់',
    confirmNewPasswordLabel: 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី *',
    btnSavePassword: 'រក្សាទុកពាក្យសម្ងាត់ & ចូលទិញទំនិញ →',
    btnSkipPassword: 'រំលងពេលនេះ (ចូលភ្លាមៗ)',
    passwordSavedSuccess: 'ពាក្យសម្ងាត់ត្រូវបានរក្សាទុកជោគជ័យ! លោកអ្នកអាចប្រើប្រាស់វាសម្រាប់ Login លើកក្រោយបាន។',
    passwordMismatch: 'ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាឡើយ។',
    passwordTooShort: 'ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៦ ខ្ទង់។',
    googleInitializing: 'សេវា Google កំពុងដំណើរការ។ សូមព្យាយាមម្ដងទៀតក្នុងពេលបន្តិចទៀត។',
    googleAuthFailed: 'ការផ្ទៀងផ្ទាត់តាមរយៈ Google មិនជោគជ័យឡើយ។',
    googlePopupBlocked: 'មិនអាចបើកផ្ទាំង Google បានទេ។ សូមអនុញ្ញាត Popups ឬចូលដោយប្រើអ៊ីមែល/ពាក្យសម្ងាត់។',
    googleNotReady: 'មិនទាន់បានកំណត់ Google OAuth នៅឡើយទេ។ សូមប្រើប្រាស់អ៊ីមែល និងពាក្យសម្ងាត់។',
  },
};

export default function AuthPage({ onNavigate }) {
  // Language state: 'km' (Khmer) or 'en' (English)
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('fs_lang') || 'km';
    } catch {
      return 'km';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('fs_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  const t = T[lang] || T.km;

  // Role tab: 'customer' or 'admin'
  const [roleTab, setRoleTab] = useState('customer');
  // Mode: 'login' or 'register' (register is strictly available for customer only)
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formUnlocked, setFormUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Helper to get only genuine Google Client IDs (not emails or corrupted values)
  const getValidGoogleClientId = () => {
    try {
      const stored = localStorage.getItem('cs_google_client_id');
      if (stored && (stored.includes('@') || !stored.includes('.apps.googleusercontent.com'))) {
        localStorage.removeItem('cs_google_client_id');
      }
      const envId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
      if (envId && envId.includes('.apps.googleusercontent.com') && !envId.includes('@')) {
        return envId;
      }
      const validStored = localStorage.getItem('cs_google_client_id');
      if (validStored && validStored.includes('.apps.googleusercontent.com') && !validStored.includes('@')) {
        return validStored;
      }
    } catch (_) {}
    return null;
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  // Clean corrupted client ID on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cs_google_client_id');
      if (stored && (stored.includes('@') || !stored.includes('.apps.googleusercontent.com'))) {
        localStorage.removeItem('cs_google_client_id');
      }
    } catch (_) {}
  }, []);

  const launchGoogleOAuth = (clientId) => {
    if (!window.google?.accounts?.oauth2) {
      notify(t.googleInitializing, 'default');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse?.access_token) {
            setGoogleLoading(true);
            const res = await api.post(
              '/auth/google',
              {
                access_token: tokenResponse.access_token,
                device_name: 'react_web',
              },
              false
            );
            setGoogleLoading(false);
            if (res.ok && res.data?.data?.token) {
              const { token, user } = res.data.data;
              setAuth(token, user);
              notify(`${t.toastWelcome}${user.name}!`, 'success');
              onNavigate('/');
              return;
            }
            notify(res.data?.message || t.googleAuthFailed, 'error');
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.warn('GIS error:', err);
      notify(t.googlePopupBlocked, 'error');
    }
  };

  const handleGoogleSignInClick = () => {
    const activeClientId = getValidGoogleClientId();
    if (activeClientId && window.google?.accounts?.oauth2) {
      launchGoogleOAuth(activeClientId);
      return;
    }
    notify(t.googleNotReady, 'error');
  };

  // Clear inputs on mount and when switching modes or roles
  useEffect(() => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setFormUnlocked(false);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    const t1 = setTimeout(() => {
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
    }, 120);
    return () => clearTimeout(t1);
  }, [mode, roleTab]);

  // When switching to admin, force mode to 'login' because admin cannot be registered
  const handleRoleSwitch = (newRole) => {
    setRoleTab(newRole);
    if (newRole === 'admin') {
      setMode('login');
    }
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setFormUnlocked(false);
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ── 1. LOGIN MODE ───────────────────────────────────────────
    if (mode === 'login') {
      const res = await api.post(
        '/login',
        {
          email: email.trim(),
          password,
          role: roleTab,
          device_name: 'react_web',
        },
        false
      );

      setLoading(false);

      if (res.ok && res.data?.data?.token) {
        const { token, user } = res.data.data;
        setAuth(token, user);
        notify(`${t.toastWelcome}${user.name}!`, 'success');
        onNavigate(isAdminUser(user) || roleTab === 'admin' ? '/admin' : '/');
      } else {
        const errMsg =
          res.data?.errors?.email?.[0] ||
          res.data?.message ||
          t.errorInvalidLogin;
        notify(errMsg, 'error');
      }
      return;
    }

    // ── 2. REGISTER MODE (STRICTLY CUSTOMER ONLY) ────────────────
    if (roleTab === 'admin') {
      setLoading(false);
      notify(t.adminBlockedRegister, 'error');
      return;
    }

    const res = await api.post(
      '/register',
      {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm || password,
      },
      false
    );

    setLoading(false);

    if (res.ok && res.data?.data?.token) {
      const { token, user } = res.data.data;
      setAuth(token, user);
      notify(`${t.toastSuccessRegister}${user.name}!`, 'success');
      onNavigate('/');
    } else {
      const firstErr = res.data?.errors ? Object.values(res.data.errors).flat()[0] : null;
      notify(firstErr || res.data?.message || t.customerCreatedFail, 'error');
    }
  };

  return (
    <div className={`auth-fullscreen-shell ${lang === 'km' ? 'lang-km' : 'lang-en'}`}>
      {/* ── Left Editorial Panel (Full Viewport Height) ── */}
      <div className="auth-fullscreen-editorial">
        <div className="auth-editorial-top-bar">
          <div className="auth-editorial-brand-tag">
            <span>⚜️ {t.editorialBrand}</span>
          </div>
          <div className="auth-editorial-badge">
            {t.editorialCollection}
          </div>
        </div>

        <div className="auth-editorial-center">
          <div className="auth-editorial-collection-eyebrow">
            {t.editorialEyebrow}
          </div>
          <h1 className="auth-editorial-big-quote">
            "{t.editorialQuote1}<br />
            <em>{t.editorialQuote2}</em>"
          </h1>
          <p className="auth-editorial-desc">
            {t.editorialDesc}
          </p>

          <div className="auth-editorial-perks">
            <div className="auth-highlight-pill">
              <TruckIcon size={15} />
              <span>{t.editorialBadge1}</span>
            </div>
            <div className="auth-highlight-pill">
              <ShieldCheckIcon size={15} />
              <span>{t.editorialBadge2}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, opacity: 0.75, letterSpacing: '0.04em' }}>
          <span>{t.editorialLocation}</span>
          <span>{t.editorialRights}</span>
        </div>
      </div>

      {/* ── Right Form Panel (Full Viewport Height & Clean) ── */}
      <div className="auth-fullscreen-form-pane">
        <div className="auth-pane-top">
          <div
            className="auth-pane-brand"
            onClick={() => onNavigate('/')}
            title={lang === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Return to Home'}
            style={lang === 'km' ? { fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif", fontWeight: 700, fontSize: 24 } : undefined}
          >
            {t.brandName}<span>.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language Switcher */}
            <div className="auth-lang-switch" role="group" aria-label="Select Language">
              <button
                type="button"
                className={`auth-lang-btn ${lang === 'km' ? 'is-active' : ''}`}
                onClick={() => handleLangChange('km')}
                title="ប្ដូរទៅភាសាខ្មែរ"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CambodiaFlagIcon size={15} />
                <span>{t.langBtnKm}</span>
              </button>
              <button
                type="button"
                className={`auth-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
                onClick={() => handleLangChange('en')}
                title="Switch to English"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UkFlagIcon size={15} />
                <span>{t.langBtnEn}</span>
              </button>
            </div>

            <button
              type="button"
              className="auth-pane-back-link"
              onClick={() => onNavigate('/')}
            >
              <ArrowLeftIcon size={14} />
              <span>{t.backToShop}</span>
            </button>
          </div>
        </div>

        <div className="auth-form-card-clean">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2
              style={{
                fontFamily: lang === 'km' ? "'Kantumruy Pro', 'Battambang', sans-serif" : "'Playfair Display', Georgia, serif",
                fontSize: lang === 'km' ? 22 : 24,
                fontWeight: 700,
                margin: '0 0 4px',
                color: 'var(--text-primary)',
                lineHeight: 1.35,
              }}
            >
              {roleTab === 'admin'
                ? t.adminConsole
                : mode === 'login'
                ? t.welcomeBack
                : t.createCustomerAccount}
            </h2>
            <p className="auth-subtitle">
              {roleTab === 'admin'
                ? t.adminSubtitle
                : mode === 'login'
                ? t.customerLoginSubtitle
                : t.customerRegisterSubtitle}
            </p>
          </div>

          {/* Role Tabs: Customer vs Admin */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`auth-role-tab ${roleTab === 'customer' ? 'is-active' : ''}`}
              onClick={() => handleRoleSwitch('customer')}
            >
              <span>🛍️ {t.customerTab}</span>
            </button>
            <button
              type="button"
              className={`auth-role-tab ${roleTab === 'admin' ? 'is-active' : ''}`}
              onClick={() => handleRoleSwitch('admin')}
            >
              <span>🛡️ {t.adminTab}</span>
            </button>
          </div>

          {/* Customer Mode: Toggle Login vs Register */}
          {roleTab === 'customer' && (
            <div className="auth-mode-switch">
              <button
                type="button"
                className={`auth-mode-btn ${mode === 'login' ? 'is-active' : ''}`}
                onClick={() => setMode('login')}
              >
                {t.signInMode}
              </button>
              <button
                type="button"
                className={`auth-mode-btn ${mode === 'register' ? 'is-active' : ''}`}
                onClick={() => setMode('register')}
              >
                {t.registerMode}
              </button>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Decoy fields to intercept browser credential autofill */}
            <div
              style={{
                position: 'absolute',
                top: -9999,
                left: -9999,
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
              tabIndex={-1}
              aria-hidden="true"
            >
              <input type="text" name="prevent_autofill_email" tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_pwd" tabIndex={-1} autoComplete="off" />
            </div>

            {roleTab === 'customer' && mode === 'register' && (
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">{t.fullName}</label>
                <input
                  name="user_fullname_clean"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  autoComplete="off"
                  readOnly={!formUnlocked}
                  onFocus={() => setFormUnlocked(true)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">
                {roleTab === 'admin'
                  ? t.adminAccountLabel
                  : t.emailLabel}
              </label>
              <input
                type={roleTab === 'admin' ? 'text' : 'email'}
                name="user_email_clean"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  roleTab === 'admin'
                    ? t.adminPlaceholder
                    : t.emailPlaceholder
                }
                autoComplete="off"
                readOnly={!formUnlocked}
                onFocus={() => setFormUnlocked(true)}
                required
              />
              {roleTab === 'admin' && (
                <small style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                  {t.adminHint}
                </small>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: mode === 'register' ? 10 : 14 }}>
              <label className="form-label">{t.password}</label>
              <div className="input-wrap" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="user_password_clean"
                  className="form-control"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="new-password"
                  readOnly={!formUnlocked}
                  onFocus={() => setFormUnlocked(true)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted, #888)',
                    zIndex: 2,
                  }}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {roleTab === 'customer' && mode === 'register' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">{t.confirmPassword}</label>
                <div className="input-wrap" style={{ position: 'relative' }}>
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    name="user_password_confirm_clean"
                    className="form-control"
                    style={{ paddingRight: 44 }}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                    readOnly={!formUnlocked}
                    onFocus={() => setFormUnlocked(true)}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted, #888)',
                      zIndex: 2,
                    }}
                  >
                    {showPasswordConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={loading}
            >
              <span>
                {loading
                  ? t.verifying
                  : roleTab === 'admin'
                  ? t.btnAdminLogin
                  : mode === 'login'
                  ? t.btnCustomerLogin
                  : t.btnCustomerRegister}
              </span>
              {!loading && <ArrowRightIcon size={16} />}
            </button>
          </form>

          {/* Customer Google Auth Option */}
          {roleTab === 'customer' && (
            <>
              <div className="auth-divider">
                <span>{t.orDivider}</span>
              </div>

              <button
                type="button"
                className="btn-google-auth"
                onClick={handleGoogleSignInClick}
                disabled={loading || googleLoading}
              >
                <GoogleIcon size={18} />
                <span>{googleLoading ? t.verifyingRealGoogle : t.signInWithGoogle}</span>
              </button>
            </>
          )}

          {/* Quick Helper for Admin or Customer Demo */}
          {roleTab === 'admin' ? (
            <div className="auth-quick-hint">
              {t.adminAutofill}{' '}
              <button
                type="button"
                className="auth-quick-link"
                onClick={() => {
                  setFormUnlocked(true);
                  setEmail('adminstore@clothingshop.com');
                  setPassword('store168');
                }}
              >
                ({t.autofillBtn})
              </button>
            </div>
          ) : (
            <div className="auth-quick-hint">
              {mode === 'login' ? (
                <>
                  {t.noAccountPrompt}{' '}
                  <button
                    type="button"
                    className="auth-quick-link"
                    onClick={() => setMode('register')}
                  >
                    {t.registerLink}
                  </button>
                </>
              ) : (
                <>
                  {t.hasAccountPrompt}{' '}
                  <button
                    type="button"
                    className="auth-quick-link"
                    onClick={() => setMode('login')}
                  >
                    {t.loginLink}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="auth-pane-footer">
          <span>{t.footerRights}</span>
          <span>{t.footerLocation}</span>
        </div>
      </div>
    </div>
  );
}
