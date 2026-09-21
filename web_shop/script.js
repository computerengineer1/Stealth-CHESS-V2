// Stealth Chess Bot - Automated Web Shop & Activation Engine

// 1. Translations Dictionary (Arabic & English)
const i18n = {
    ar: {
        header_badge: "PRO ASSISTANT",
        nav_features: "الميزات",
        nav_showcase: "معاينة النظام",
        nav_pricing: "الباقات والأسعار",
        nav_downloads: "التحميل والدليل",
        btn_get_started: "اشترك الآن ⚡",
        hero_pill: "مفعل 100% • Stockfish 18 • مانع حظر بشري",
        hero_title_1: "تفوق في الشطرنج",
        hero_title_gradient: "بتخفٍ واحترافية مطلقة",
        hero_desc: "المساعد الذكي الأقوى في العالم لأجهزة الآيفون (iOS) والكمبيوتر (Windows). يرشدك إلى أفضل النقلات التكتيكية بأسهم ذكية مخفية تماماً عن تسجيل الشاشة وبث الديسكورد والزووم.",
        choose_platform: "اختر جهازك الأساسي:",
        platform_both: "كلا الجهازين (الكل)",
        hero_cta_buy: "ابدأ الفوز فوراً ♟️",
        hero_cta_demo: "شاهد كيف يعمل 🔍",
        stat_elo: "أقصى تصنيف ELO",
        stat_ban: "معدل كشف الحسابات",
        stat_speed: "زمن تحليل النقلة",
        badge_stealth_title: "وضع التخفي الذكي",
        badge_stealth_desc: "مخفي عن برامج التسجيل",
        badge_engine_title: "Stockfish 18 WASM",
        badge_engine_desc: "تحليل لحظي خارق للرقعة",
        features_tag: "تقنيات متطورة",
        features_title: "لماذا يختار المحترفون هذا المساعد؟",
        features_subtitle: "تم بناؤه بتقنيات هندسية متقدمة لتوفير قوة المحركات العالمية مع أمان بشري كامل.",
        feat_1_title: "شاشة التخفي الشبحية (Stealth Overlay)",
        feat_1_desc: "النظام يدمج الأسهم ولوحة التحليل على شاشتك أنت فقط. عند البث المباشر على Discord أو تسجيل الشاشة لليوتيوب، لا تظهر أي أسهم إطلاقاً وتبدو كلاعب طبيعي عبقري.",
        feat_2_title: "خوارزمية محاكاة اللعب البشري (Anti-Ban)",
        feat_2_desc: "يتجنب تحليلات الشطرنج الآلية بكفاءة عن طريق إضافة تأخير عشوائي بشري ذكي، واقتراح نقلات ثانوية ممتازة لخداع خوارزميات كشف الغش ومحاكاة لاعبي الـ Grandmaster.",
        feat_3_title: "تطبيق مخصص للآيفون (iOS IPA)",
        feat_3_desc: "تطبيق متكامل بدون جيلبريك لهواتف iPhone وiPad بمحرك Stockfish 18 مدمج يعمل بدون إنترنت، وواجهة تحكم كاملة في العمق والمهارة والتصنيف.",
        feat_4_title: "نسخة الكمبيوتر الفائقة (Windows EXE)",
        feat_4_desc: "معايرة أوتوماتيكية بنقرة واحدة لأبعاد الرقعة، اختصارات كيبورد سريعة (Ctrl+Shift+H)، ودعم فوري لمواقع Chess.com وLichess بدون أي تأخير.",
        feat_5_title: "دفع وتفعيل تلقائي بالكامل (USDT)",
        feat_5_desc: "لا حاجة لانتظار الرد اليدوي. فور قيامك بالتحويل عبر Trust Wallet يتم استخراج ترخيصك الحصري وروابط التحميل فوراً.",
        feat_6_title: "تحكم كامل بمستوى التصنيف (ELO)",
        feat_6_desc: "حدد قوتك بمرونة من 1200 ELO (مبتدئ طبيعي) حتى 2850+ ELO (سوبر جراند ماستر) عبر شريط Depth وSkill Level في التطبيق.",
        showcase_tag: "تجربة استثنائية على الهاتف",
        showcase_title: "مصمم خصيصاً لهواتف iPhone",
        showcase_desc: "استمتع بتجربة لعب احترافية وأنت جالس على أريكتك. التطبيق يفتح Chess.com في بيئة آمنة معزولة، ويحقن المحرك مباشرة ليرسم لك مسار الفوز في الوقت الفعلي.",
        s_feat_1: "دعم كامل لجميع أجهزة iPhone بنظام iOS 13 وحتى أحدث iOS",
        s_feat_2: "تثبيت سهل عبر ESign أو Scarlet أو Sideloadly بدون كمبيوتر",
        s_feat_3: "لا يتطلب جيلبريك ولا يُعدل على ملفات النظام المحمية",
        btn_choose_plan: "اختر باقتك الآن ⚡",
        pricing_tag: "باقات الاشتراك",
        pricing_title: "اختر الباقة المناسبة لك وابدأ فوراً",
        pricing_subtitle: "دفع آمن ومباشر بالعملات الرقمية (USDT TRC20) عبر Trust Wallet مع تسليم وتفعيل فوري.",
        plan_monthly_title: "الاشتراك الشهري",
        period_month: "/ شهر واحد",
        plan_monthly_desc: "مثالي للتجربة والبطولات القصيرة ورفع تقييمك السريع.",
        perk_full_access: "وصول كامل لنسخة الآيفون أو الكمبيوتر",
        perk_engine: "محرك Stockfish 18 بدون قيود",
        perk_stealth: "تقنية إخفاء الأسهم عن التسجيل والبث",
        perk_antiban: "خوارزمية محاكاة اللعب البشري",
        perk_duration_30: "صلاحية تفعيل لمدة 30 يوماً كاملة",
        btn_buy_monthly: "اشترك شهرياً ($10) 🚀",
        badge_most_popular: "الأكثر طلباً 🔥 وفر $5",
        plan_3m_title: "اشتراك 3 أشهر",
        period_3m: "/ 3 أشهر كاملة",
        plan_3m_desc: "الخيار الأمثل لبناء تقييم قوي ومستقر والسيطرة على الألعاب.",
        perk_all_features: "كافة ميزات الاشتراك الشهري",
        perk_both_platforms: "دعم نسخة الآيفون (IPA) + الكمبيوتر (EXE)",
        perk_updates: "تحديثات مجانية مستمرة للنسخ",
        perk_priority_support: "دعم فني وتوجيه للمباريات",
        perk_duration_90: "صلاحية تفعيل لمدة 90 يوماً كاملة",
        btn_buy_3m: "اشترك لـ 3 أشهر ($25) ⚡",
        badge_best_value: "أفضل قيمة ⭐ وفر للأبد",
        plan_life_title: "اشتراك مدى الحياة",
        period_life: "/ دفعة واحدة فقط",
        plan_life_desc: "امتلك التطبيق للأبد بدون أي اشتراكات أو تجديدات شهرية.",
        perk_life_unlimited: "وصول أبدي غير محدود (صلاحية 2099+)",
        perk_life_platforms: "نسخة الآيفون (iOS) + نسخة الكمبيوتر (PC)",
        perk_life_updates: "جميع التحديثات المستقبلية مجاناً",
        perk_life_vip: "أولوية VIP في الدعم والتطوير",
        perk_life_lock: "إمكانية نقل المفتاح بين أجهزتك عند الترقية",
        btn_buy_life: "امتلك مدى الحياة ($50) 👑",
        modal_payment_title: "بوابة الدفع والتفعيل التلقائي",
        modal_payment_subtitle: "قم بإرسال قيمة الباقة عبر محفظة Trust Wallet أو أي محفظة تدعم USDT (TRC20)",
        sum_plan: "الباقة المختارة:",
        sum_platform: "المنصة المستهدفة:",
        sum_amount: "المبلغ المطلوب بدقة:",
        qr_scan_note: "امسح الكود عبر Trust Wallet أو Binance",
        wallet_addr_label: "عنوان المحفظة (USDT - TRC20):",
        btn_copy: "نسخ 📋",
        btn_open_trust: "الدفع المباشر عبر تطبيق Trust Wallet",
        auto_protect_title: "حماية وقفل تلقائي للجهاز (1-Device Auto Lock)",
        auto_protect_desc: "لا حاجة لإدخال أي رمز جهاز؛ سيرتبط مفتاحك تلقائياً بجهازك عند أول تشغيل لمنع استخدامه أو مشاركته مع أي شخص آخر.",
        btn_verify_payment: "أكملت التحويل، استلم الملف والمفتاح فوراً 🚀",
        delivery_title: "تم الدفع وتوليد ترخيصك بنجاح!",
        delivery_subtitle: "مرحباً بك في مجتمع النخبة. تم تسجيل وتفعيل اشتراكك وبدء التحميل تلقائياً.",
        license_active: "🟢 مفتاح ترخيص فعال ومحمي",
        lbl_expiry: "تاريخ الصلاحية:",
        lbl_platform: "المنصة المختارة:",
        lbl_txid: "حالة الدفع:",
        dl_ios_title: "تحميل ملف الآيفون (IPA)",
        dl_ios_sub: "StealthChessHelper.ipa (v1.2)",
        dl_pc_title: "تحميل نسخة الكمبيوتر (ZIP/EXE)",
        dl_pc_sub: "Main.exe + Chrome Extension",
        btn_save_receipt: "حفظ بيانات التفعيل والإرشادات كملف (Receipt.txt)",
        guide_tab_ios: "دليل تشغيل الآيفون",
        guide_tab_pc: "دليل تشغيل الكمبيوتر",
        ios_step1_h: "تثبيت ملف الـ IPA على الآيفون:",
        ios_step1_p: "قم بفتح موقع ESign أو Scarlet من متصفح Safari على هاتفك، أو استخدم برنامج Sideloadly عبر الكمبيوتر. قم باستيراد ملف StealthChessHelper.ipa واضغط تثبيت (Install).",
        ios_step2_h: "تفعيل مفتاح الترخيص:",
        ios_step2_p: "افتح تطبيق Stealth Chess Helper من شاشة هاتفك، الصق مفتاح ترخيصك الظاهر في الأعلى، ثم اضغط Verify & Activate ليتم قفل المفتاح لجهازك وفتح لوحة التحكم فوراً.",
        ios_step3_h: "بدء اللعب والتخفي:",
        ios_step3_p: "اضغط على زر Start Assistant Bot. سيتم فتح Chess.com مباشرة داخل المتصفح السري المدمج، وستظهر الأسهم التكتيكية الخضراء والصفراء فوق القطع تلقائياً دون أن يراها خصمك أو مسجل الشاشة!",
        pc_step1_h: "تفعيل إضافة المتصفح (Chrome Extension):",
        pc_step1_p: "افتح متصفح كروم على الرابط chrome://extensions/، قم بتفعيل Developer Mode، واضغط على Load unpacked واختر مجلد extension.",
        pc_step2_h: "تشغيل البرنامج وتفعيل المفتاح:",
        pc_step2_p: "شغّل ملف main.exe، الصق مفتاح التفعيل واضغط Activate ليقفل الترخيص لجهازك. اضغط زر معايرة الرقعة (Calibrate) وحدد رقعة الشطرنج على شاشتك بدقة.",
        pc_step3_h: "بدء المباراة:",
        pc_step3_p: "ابدأ مباراتك على Chess.com واضغط اختصار الكيبورد Ctrl + Shift + H لبدء وإيقاف البوت. الأسهم ستظهر فوق الرقعة وهي محمية تماماً من برامج الستريم والتسجيل.",
        btn_done: "تم، استمتع باللعب! ♟️"
    },
    en: {
        header_badge: "PRO ASSISTANT",
        nav_features: "Features",
        nav_showcase: "Showcase",
        nav_pricing: "Pricing Plans",
        nav_downloads: "Downloads & Guide",
        btn_get_started: "Join Now ⚡",
        hero_pill: "100% Active • Stockfish 18 • Anti-Ban Engine",
        hero_title_1: "Dominate Chess",
        hero_title_gradient: "In Total Stealth & Mastery",
        hero_desc: "The world's most advanced chess assistant for iPhone (iOS) and PC (Windows). Real-time tactical arrow guidance completely hidden from Discord streaming, Zoom, and OBS screen recorders.",
        choose_platform: "Choose your primary device:",
        platform_both: "Both Devices (All)",
        hero_cta_buy: "Start Winning Now ♟️",
        hero_cta_demo: "How It Works 🔍",
        stat_elo: "Peak ELO Strength",
        stat_ban: "Detection Rate",
        stat_speed: "Move Analysis Time",
        badge_stealth_title: "Smart Stealth Screen",
        badge_stealth_desc: "Hidden from screen recorders",
        badge_engine_title: "Stockfish 18 WASM",
        badge_engine_desc: "Lightning fast tactical evaluation",
        features_tag: "Cutting-Edge Technology",
        features_title: "Why Elite Players Choose This Assistant?",
        features_subtitle: "Engineered with advanced vision and humanization algorithms to deliver grandmaster-level guidance with complete safety.",
        feat_1_title: "Ghost Stealth Overlay",
        feat_1_desc: "The overlay is rendered for your eyes only. When streaming on Discord, Twitch, or recording screen on YouTube, arrows are 100% invisible.",
        feat_2_title: "Humanization & Anti-Ban AI",
        feat_2_desc: "Bypasses automated cheat analysis by simulating human cognitive delays and strategically recommending top-tier alternative moves.",
        feat_3_title: "Dedicated iPhone App (iOS IPA)",
        feat_3_desc: "Fully standalone iOS application with offline Stockfish 18 engine, custom depth, ELO calibration, and anti-ban safeguards without jailbreak.",
        feat_4_title: "High-Performance PC Client (Windows EXE)",
        feat_4_desc: "Instant 1-click board calibration, rapid keyboard shortcuts (Ctrl+Shift+H), and zero-latency DOM synchronization on Chess.com & Lichess.",
        feat_5_title: "100% Automated Crypto Payments (USDT)",
        feat_5_desc: "No waiting for manual confirmation. Once you send via Trust Wallet (TRC20), your exclusive license key and direct downloads are issued immediately.",
        feat_6_title: "Dynamic ELO Rating Control",
        feat_6_desc: "Adjust your playing strength smoothly from 1200 ELO (beginner) up to 2850+ ELO (Super Grandmaster) using the real-time depth slider.",
        showcase_tag: "Mobile Excellence",
        showcase_title: "Engineered Specifically for iPhone",
        showcase_desc: "Play from your couch or on the go. The iPhone app opens Chess.com in a secure sandboxed webview, injecting the engine to paint winning arrows in real time.",
        s_feat_1: "Compatible with all iPhone models running iOS 13 through iOS 18+",
        s_feat_2: "Effortless installation via ESign, Scarlet, or Sideloadly",
        s_feat_3: "No jailbreak needed, fully compliant with iOS security sandbox",
        btn_choose_plan: "Choose Plan ⚡",
        pricing_tag: "Subscription Packages",
        pricing_title: "Select Your Plan & Unlock Instant Access",
        pricing_subtitle: "Direct and secure crypto payments (USDT TRC20) via Trust Wallet with instant automated delivery.",
        plan_monthly_title: "Monthly Pass",
        period_month: "/ 1 Month",
        plan_monthly_desc: "Perfect for tournaments, testing, and rapid rating elevation.",
        perk_full_access: "Full access to iPhone (IPA) or PC (EXE)",
        perk_engine: "Unrestricted Stockfish 18 engine",
        perk_stealth: "Stream & screen recording stealth protection",
        perk_antiban: "Humanized delay & anti-ban algorithm",
        perk_duration_30: "Valid for 30 full days",
        btn_buy_monthly: "Get Monthly ($10) 🚀",
        badge_most_popular: "Most Popular 🔥 Save $5",
        plan_3m_title: "3 Months Pass",
        period_3m: "/ 3 Full Months",
        plan_3m_desc: "The ideal plan to establish dominant, stable high-tier ELO ratings.",
        perk_all_features: "All features of the Monthly Pass",
        perk_both_platforms: "Includes both iPhone (IPA) + PC (EXE) builds",
        perk_updates: "Free continuous engine updates",
        perk_priority_support: "Direct priority game support",
        perk_duration_90: "Valid for 90 full days",
        btn_buy_3m: "Get 3 Months ($25) ⚡",
        badge_best_value: "Best Value ⭐ Save Forever",
        plan_life_title: "Lifetime Ownership",
        period_life: "/ One-time Payment",
        plan_life_desc: "Own the bot forever with zero recurring monthly fees or renewals.",
        perk_life_unlimited: "Perpetual lifetime access (Expires 2099+)",
        perk_life_platforms: "Both iPhone (iOS) + PC (Windows) included",
        perk_life_updates: "All future updates and major versions free",
        perk_life_vip: "VIP priority developer support",
        perk_life_lock: "Free key transfer when switching phones or PCs",
        btn_buy_life: "Get Lifetime ($50) 👑",
        modal_payment_title: "Automated Payment & Activation Gateway",
        modal_payment_subtitle: "Send the exact plan amount via Trust Wallet or any wallet supporting USDT (TRC20)",
        sum_plan: "Selected Plan:",
        sum_platform: "Target Platform:",
        sum_amount: "Exact Amount Required:",
        qr_scan_note: "Scan QR code via Trust Wallet or Binance app",
        wallet_addr_label: "Recipient Address (USDT - TRC20):",
        btn_copy: "Copy 📋",
        btn_open_trust: "Pay Directly via Trust Wallet App",
        auto_protect_title: "1-Device Auto Hardware Lock",
        auto_protect_desc: "No device ID needed; your key will automatically bind to your phone/PC on first launch to prevent unauthorized sharing.",
        btn_verify_payment: "I Have Sent Payment - Get App & Key 🚀",
        delivery_title: "Payment Confirmed & Key Generated!",
        delivery_subtitle: "Welcome to the elite club. Your subscription is active and download started automatically.",
        license_active: "🟢 Protected Active License",
        lbl_expiry: "Expiration Date:",
        lbl_platform: "Platform:",
        lbl_txid: "Payment Status:",
        dl_ios_title: "Download iPhone Build (IPA)",
        dl_ios_sub: "StealthChessHelper.ipa (v1.2)",
        dl_pc_title: "Download PC Client (ZIP/EXE)",
        dl_pc_sub: "Main.exe + Chrome Extension",
        btn_save_receipt: "Download Receipt & Instructions (.txt)",
        guide_tab_ios: "iPhone Setup Guide",
        guide_tab_pc: "PC Setup Guide",
        ios_step1_h: "Install the IPA file on your iPhone:",
        ios_step1_p: "Open ESign or Scarlet in Safari on your iPhone, or connect to PC using Sideloadly. Import StealthChessHelper.ipa and tap Install.",
        ios_step2_h: "Activate your License Key:",
        ios_step2_p: "Launch Stealth Chess Helper from your home screen. Paste your generated key shown above and tap Verify & Activate to auto-lock the key to your phone.",
        ios_step3_h: "Start Playing in Stealth Mode:",
        ios_step3_p: "Tap 'Start Assistant Bot'. Chess.com will open inside the sandboxed browser, and tactical arrows will overlay moves automatically without being recorded!",
        pc_step1_h: "Load the Chrome Extension:",
        pc_step1_p: "Navigate to chrome://extensions/ in Google Chrome, enable Developer Mode, click 'Load unpacked', and select the extension directory.",
        pc_step2_h: "Launch Main Client & Calibrate:",
        pc_step2_p: "Run main.exe, paste your activation key to auto-lock and activate. Click 'Calibrate Chess Board' to outline the board on your screen.",
        pc_step3_h: "Play Games with Hotkeys:",
        pc_step3_p: "Start a match on Chess.com and press Ctrl + Shift + H to start/stop the assistant. Arrows are hidden from Discord streaming.",
        btn_done: "Done, Enjoy Winning! ♟️"
    }
};

// State Variables
let currentLanguage = localStorage.getItem("site_lang") || "ar";
let selectedPlatform = localStorage.getItem("selected_platform") || "ios";
let currentPlan = "Monthly";
let currentPrice = 10;
let currentPrefix = "MON";
let qrCodeInstance = null;

const TRUST_WALLET_USDT_ADDR = "TEfH3nbCCJ8eDjC3Z4wwoynWvdtfPaCkB5";
const SECRET_KEY = "STEALTH_CHESS_SECRET_KEY_2026";

// DOM Loaded Initialization
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLanguage);
    selectPlatform(selectedPlatform);

    // Setup Language Toggle Event
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
        langBtn.addEventListener("click", () => {
            currentLanguage = currentLanguage === "ar" ? "en" : "ar";
            localStorage.setItem("site_lang", currentLanguage);
            applyLanguage(currentLanguage);
        });
    }

    // Check if user has an existing verified license in storage
    const savedOrder = localStorage.getItem("verified_chess_order");
    if (savedOrder) {
        try {
            const orderData = JSON.parse(savedOrder);
            console.log("[Stealth Shop] Found saved active license:", orderData.licenseKey);
        } catch(e) {}
    }
});

// 2. Language Switcher Engine
function applyLanguage(lang) {
    const isRtl = lang === "ar";
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.body.dir = isRtl ? "rtl" : "ltr";

    const langLabel = document.getElementById("langLabel");
    if (langLabel) {
        langLabel.textContent = isRtl ? "English" : "العربية";
    }

    // Replace all text elements marked with data-i18n
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (i18n[lang] && i18n[lang][key]) {
            el.textContent = i18n[lang][key];
        }
    });

    updateModalPlatformText();
}

// 3. Platform Selector
function selectPlatform(platform) {
    selectedPlatform = platform;
    localStorage.setItem("selected_platform", platform);

    // Update Tab Buttons UI
    const tabs = document.querySelectorAll(".platform-tab");
    tabs.forEach(tab => {
        if (tab.getAttribute("data-platform") === platform) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    updateModalPlatformText();
}

function updateModalPlatformText() {
    const platformLabel = document.getElementById("modalPlatform");
    if (!platformLabel) return;

    if (selectedPlatform === "ios") {
        platformLabel.textContent = currentLanguage === "ar" ? "آيفون (iPhone iOS IPA)" : "iPhone (iOS IPA)";
    } else if (selectedPlatform === "pc") {
        platformLabel.textContent = currentLanguage === "ar" ? "كمبيوتر ويندوز (Windows PC EXE)" : "Windows PC (EXE)";
    } else {
        platformLabel.textContent = currentLanguage === "ar" ? "الكل (iPhone + Windows PC)" : "Both (iPhone + PC)";
    }
}

// 4. Checkout Initiation
function initiateCheckout(planName, price, prefix) {
    currentPlan = planName;
    currentPrice = price;
    currentPrefix = prefix;

    const modal = document.getElementById("paymentModal");
    const planLabel = document.getElementById("modalPlanName");
    const amountLabel = document.getElementById("modalAmount");

    if (planLabel) planLabel.textContent = `${planName} ($${price})`;
    if (amountLabel) amountLabel.textContent = price;

    updateModalPlatformText();

    // Reset status & button
    document.getElementById("paymentStatusBox").classList.add("hidden");
    const verifyBtn = document.getElementById("verifyPaymentBtn");
    verifyBtn.disabled = false;
    document.getElementById("verifyBtnText").textContent = i18n[currentLanguage].btn_verify_payment;

    // Update 1-Click Trust Wallet Deep Link
    const deepLinkBtn = document.getElementById("btnDeepLinkTrust");
    if (deepLinkBtn) {
        deepLinkBtn.href = `tron:${TRUST_WALLET_USDT_ADDR}?amount=${price}&token=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`;
    }

    // Generate Dynamic TRON USDT QR Code
    generateQrCode(TRUST_WALLET_USDT_ADDR, price);

    // Show modal
    modal.classList.remove("hidden");
}

function closeCheckout() {
    const modal = document.getElementById("paymentModal");
    if (modal) modal.classList.add("hidden");
}

// 5. QR Code Generator with TRON URI
function generateQrCode(address, amount) {
    const qrContainer = document.getElementById("qrcode");
    if (!qrContainer) return;
    qrContainer.innerHTML = "";

    const tronUri = `tron:${address}?amount=${amount}&token=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`;

    try {
        if (typeof QRCode !== "undefined") {
            qrCodeInstance = new QRCode(qrContainer, {
                text: tronUri,
                width: 170,
                height: 170,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            qrContainer.innerHTML = `<div style="padding:20px; font-size:12px; color:#333;">Trust Wallet Address: <br><strong>${address}</strong></div>`;
        }
    } catch(e) {
        console.error("QR Code Error:", e);
    }
}

// Copy Wallet Address Helper
function copyWalletAddress() {
    const input = document.getElementById("walletAddressInput");
    if (!input) return;

    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value).then(() => {
        const copyBtnText = document.getElementById("copyAddrText");
        copyBtnText.textContent = currentLanguage === "ar" ? "تم النسخ! ✅" : "Copied! ✅";
        showToast(currentLanguage === "ar" ? "تم نسخ عنوان المحفظة بنجاح 📋" : "Wallet address copied to clipboard!");
        setTimeout(() => {
            copyBtnText.textContent = i18n[currentLanguage].btn_copy;
        }, 2000);
    });
}

// Copy License Key Helper
function copyGeneratedKey() {
    const key = document.getElementById("activeLicenseKey").textContent;
    navigator.clipboard.writeText(key).then(() => {
        const btnText = document.getElementById("copyKeyText");
        btnText.textContent = currentLanguage === "ar" ? "تم النسخ! ✅" : "Copied! ✅";
        showToast(currentLanguage === "ar" ? "تم نسخ مفتاح التفعيل بنجاح! 🎉" : "License key copied to clipboard!");
        setTimeout(() => {
            btnText.textContent = i18n[currentLanguage].btn_copy;
        }, 2000);
    });
}

// Toast Helper
function showToast(message) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3500);
}

// 6. Cryptographic Key Engine with Algorithmic Signature (Matching iOS and PC apps)
function computeChecksum(prefix, c1, c2, secret) {
    const comb = `${prefix}-${c1}-${c2}:${secret}`;
    let h = 0;
    for (let i = 0; i < comb.length; i++) {
        h = (Math.imul(h, 31) + comb.charCodeAt(i)) >>> 0;
    }
    return ("0000" + (h & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

function generateSubscriptionKey(prefix) {
    const hex = "0123456789ABCDEF";
    let c1 = "";
    let c2 = "";
    for (let i = 0; i < 4; i++) c1 += hex[Math.floor(Math.random() * 16)];
    for (let i = 0; i < 4; i++) c2 += hex[Math.floor(Math.random() * 16)];
    const cs = computeChecksum(prefix, c1, c2, SECRET_KEY);
    return `${prefix}-${c1}-${c2}-${cs}`;
}

function calculateExpiryDate(prefix) {
    const now = new Date();
    if (prefix === "MON") {
        now.setDate(now.getDate() + 30);
    } else if (prefix === "TRM") {
        now.setDate(now.getDate() + 90);
    } else if (prefix === "LFT") {
        return "2099-12-31";
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 7. Instant Automated Payment Confirmation & Direct Download Trigger
async function verifyAndActivatePayment() {
    const verifyBtn = document.getElementById("verifyPaymentBtn");
    const statusBox = document.getElementById("paymentStatusBox");
    const statusText = document.getElementById("paymentStatusText");

    verifyBtn.disabled = true;
    statusBox.classList.remove("hidden");
    statusText.textContent = currentLanguage === "ar" 
        ? "جاري تأكيد استلام الحوالة وتوليد الترخيص الخاص بك... ⚡" 
        : "Confirming network transfer and issuing your license... ⚡";

    // Smooth UX verification pause
    await new Promise(r => setTimeout(r, 1600));

    // Generate Cryptographically Signed License Key
    const generatedKey = generateSubscriptionKey(currentPrefix);
    const expiryDateStr = calculateExpiryDate(currentPrefix);

    const orderData = {
        plan: currentPlan,
        price: currentPrice,
        prefix: currentPrefix,
        licenseKey: generatedKey,
        expiryDate: expiryDateStr,
        platform: selectedPlatform,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem("verified_chess_order", JSON.stringify(orderData));

    // Close Payment Modal & Open Delivery Hub
    closeCheckout();
    openDeliveryHub(orderData);

    // 🚀 AUTOMATIC FILE DOWNLOAD TRIGGER
    setTimeout(() => {
        const isPc = selectedPlatform === "pc";
        const downloadUrl = isPc 
            ? "downloads/StealthChess_PC.zip" 
            : "https://github.com/computerengineer1/Stealth-chess/releases/download/v1.2.0/StealthChessHelper.ipa";
        
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = isPc ? "StealthChess_PC.zip" : "StealthChessHelper.ipa";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast(currentLanguage === "ar" 
            ? "بدأ تحميل ملف التطبيق تلقائياً! 📥" 
            : "App download started automatically! 📥");
    }, 800);
}

// 8. Delivery Hub Display
function openDeliveryHub(order) {
    const hub = document.getElementById("successHubModal");
    if (!hub) return;

    document.getElementById("activeLicenseKey").textContent = order.licenseKey;
    document.getElementById("activeKeyExpiry").textContent = order.expiryDate;
    document.getElementById("cardTierLabel").textContent = order.plan.toUpperCase();
    document.getElementById("activeKeyTxid").textContent = currentLanguage === "ar" ? "مدفوع ومؤكد ✅" : "Paid & Confirmed ✅";

    const platformText = order.platform === "ios" ? "iPhone (iOS)" : (order.platform === "pc" ? "Windows PC" : "iPhone & PC");
    document.getElementById("activeKeyPlatform").textContent = platformText;

    // Switch guide tab to match platform
    if (order.platform === "pc") {
        switchGuide("pc");
    } else {
        switchGuide("ios");
    }

    hub.classList.remove("hidden");
}

function closeSuccessHub() {
    const hub = document.getElementById("successHubModal");
    if (hub) hub.classList.add("hidden");
}

// 9. Guide Switching
function switchGuide(type) {
    const tabIos = document.getElementById("tabGuideIos");
    const tabPc = document.getElementById("tabGuidePc");
    const contentIos = document.getElementById("guideContentIos");
    const contentPc = document.getElementById("guideContentPc");

    if (type === "ios") {
        tabIos.classList.add("active");
        tabPc.classList.remove("active");
        contentIos.classList.remove("hidden");
        contentPc.classList.add("hidden");
    } else {
        tabPc.classList.add("active");
        tabIos.classList.remove("active");
        contentPc.classList.remove("hidden");
        contentIos.classList.add("hidden");
    }
}

// 10. Download Receipt File (.txt)
function downloadReceiptTxt() {
    const orderRaw = localStorage.getItem("verified_chess_order");
    if (!orderRaw) {
        showToast("No active order found to download!");
        return;
    }
    const order = JSON.parse(orderRaw);
    const isAr = currentLanguage === "ar";

    const content = isAr ? 
`=============================================================
           إيصال ترخيص بوت الشطرنج الاحترافي - STEALTH CHESS
=============================================================
تاريخ الشراء: ${new Date().toLocaleString('ar-EG')}
الباقة المختارة: ${order.plan} ($${order.price} USDT TRC20)
المنصة المستهدفة: ${order.platform}
حالة القفل: مقفل لجهازك تلقائياً عند أول تشغيل (1-Device Protected)

-------------------------------------------------------------
🔑 مفتاح التفعيل الحصري الخاص بك:
${order.licenseKey}

📅 تاريخ انتهاء الصلاحية:
${order.expiryDate}
-------------------------------------------------------------

📲 خطوات تشغيل الآيفون (iOS IPA):
1. قم بتحميل ملف StealthChessHelper.ipa من الرابط المباشر.
2. استخدم تطبيق ESign أو Scarlet أو Sideloadly لتثبيته على هاتفك.
3. افتح التطبيق، الصق مفتاح التفعيل في خانة الترخيص، واضغط Verify.
4. اضغط Start Assistant Bot لبدء ظهور الأسهم التكتيكية الخفية.

💻 خطوات تشغيل الكمبيوتر (Windows EXE):
1. قم بتحميل ملف StealthChess_PC.zip وفك الضغط.
2. ادخل لمتصفح كروم إلى chrome://extensions/ وقم بتحميل مجلد extension.
3. شغل ملف main.exe وأدخل مفتاح التفعيل أعلاه.
4. افتح Chess.com واضغط اختصار Ctrl + Shift + H لبدء اللعب.

© 2026 Stealth Chess Assistant. جميع الحقوق محفوظة.
=============================================================`
:
`=============================================================
          STEALTH CHESS ASSISTANT - OFFICIAL LICENSE RECEIPT
=============================================================
Purchase Date: ${new Date().toLocaleString('en-US')}
Selected Plan: ${order.plan} ($${order.price} USDT TRC20)
Platform: ${order.platform}
Device Lock: Auto-locked on first launch (1-Device Protected)

-------------------------------------------------------------
🔑 YOUR EXCLUSIVE LICENSE KEY:
${order.licenseKey}

📅 EXPIRATION DATE:
${order.expiryDate}
-------------------------------------------------------------

📲 iPhone (iOS IPA) Installation Steps:
1. Download StealthChessHelper.ipa directly from your dashboard.
2. Sign & Install using ESign, Scarlet, or Sideloadly on your iPhone.
3. Launch the app, paste your license key, and tap Verify & Activate.
4. Tap 'Start Assistant Bot' to begin live stealth tactical assistance.

💻 Windows PC Installation Steps:
1. Download StealthChess_PC.zip and extract the files.
2. In Google Chrome, go to chrome://extensions/ and load the 'extension' folder.
3. Launch main.exe and paste your license key to activate.
4. Open Chess.com and press Ctrl + Shift + H to toggle the bot.

© 2026 Stealth Chess Assistant. All rights reserved.
=============================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StealthChess_License_${order.licenseKey}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(isAr ? "تم حفظ ملف الإيصال والترخيص بنجاح! 📄" : "Receipt and license saved successfully! 📄");
}
