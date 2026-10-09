// Stealth Chess Bot - Modern Store & Telegram Activation Engine

// 1. Translations Dictionary (Arabic & English)
const i18n = {
    ar: {
        header_badge: "PRO ASSISTANT",
        nav_features: "الميزات",
        nav_showcase: "معاينة النظام",
        nav_pricing: "الباقات والأسعار",
        nav_downloads: "التحميل والدليل",
        btn_get_started: "تواصل مع المالك ⚡",
        hero_pill: "مفعل 100% • Stockfish 18 • مانع حظر بشري",
        hero_title_1: "تفوق في الشطرنج",
        hero_title_gradient: "بتخفٍ واحترافية مطلقة",
        hero_desc: "المساعد الذكي الأقوى في العالم لأجهزة الآيفون (iOS) والكمبيوتر (Windows). يرشدك إلى أفضل النقلات التكتيكية بأسهم ذكية مخفية تماماً عن تسجيل الشاشة وبث الديسكورد والزووم.",
        choose_platform: "اختر جهازك الأساسي:",
        platform_both: "كلا الجهازين (الكل)",
        hero_cta_buy: "اشترك واحصل على المفتاح ♟️",
        hero_cta_demo: "تحميل التطبيق مجاناً 📥",
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
        feat_5_title: "تحميل مجاني مباشر",
        feat_5_desc: "يمكنك تنزيل وتثبيت ملفات التطبيق فوراً لجهازك، واستلام مفتاح الترخيص الحصري مباشرة عبر تيليجرام من المالك.",
        feat_6_title: "تحكم كامل بمستوى التصنيف (ELO)",
        feat_6_desc: "حدد قوتك بمرونة من 1200 ELO (مبتدئ طبيعي) حتى 2850+ ELO (سوبر جراند ماستر) عبر شريط Depth وSkill Level في التطبيق.",
        showcase_tag: "تجربة استثنائية على الهاتف",
        showcase_title: "مصمم خصيصاً لهواتف iPhone",
        showcase_desc: "استمتع بتجربة لعب احترافية وأنت جالس على أريكتك. التطبيق يفتح Chess.com في بيئة آمنة معزولة، ويحقن المحرك مباشرة ليرسم لك مسار الفوز في الوقت الفعلي.",
        s_feat_1: "دعم كامل لجميع أجهزة iPhone بنظام iOS 13 وحتى أحدث iOS",
        s_feat_2: "تثبيت سهل عبر ESign أو Scarlet أو Sideloadly بدون كمبيوتر",
        s_feat_3: "لا يتطلب جيلبريك ولا يُعدل على ملفات النظام المحمية",
        btn_choose_plan: "حمّل التطبيق الآن ⚡",
        pricing_tag: "باقات الاشتراك والترخيص",
        pricing_title: "اختر باقتك وتواصل معنا لاستلام مفتاحك",
        pricing_subtitle: "التطبيق مجاني للتثبيت، ومفتاح الترخيص يتم إرساله لك يدوياً عبر تيليجرام بعد التواصل مع المالك.",
        plan_monthly_title: "الاشتراك الشهري",
        period_month: "/ شهر واحد",
        plan_monthly_desc: "مثالي للتجربة والبطولات القصيرة ورفع تقييمك السريع.",
        perk_full_access: "وصول كامل لنسخة الآيفون أو الكمبيوتر",
        perk_engine: "محرك Stockfish 18 بدون قيود",
        perk_stealth: "تقنية إخفاء الأسهم عن التسجيل والبث",
        perk_antiban: "خوارزمية محاكاة اللعب البشري",
        perk_duration_30: "صلاحية تفعيل لمدة 30 يوماً كاملة",
        btn_buy_monthly: "طلب الاشتراك الشهري ($10) 💬",
        badge_most_popular: "الأكثر طلباً 🔥 وفر $5",
        plan_3m_title: "اشتراك 3 أشهر",
        period_3m: "/ 3 أشهر كاملة",
        plan_3m_desc: "الخيار الأمثل لبناء تقييم قوي ومستقر والسيطرة على الألعاب.",
        perk_all_features: "كافة ميزات الاشتراك الشهري",
        perk_both_platforms: "دعم نسخة الآيفون (IPA) + الكمبيوتر (EXE)",
        perk_updates: "تحديثات مجانية مستمرة للنسخ",
        perk_priority_support: "دعم فني وتوجيه للمباريات",
        perk_duration_90: "صلاحية تفعيل لمدة 90 يوماً كاملة",
        btn_buy_3m: "طلب اشتراك 3 أشهر ($25) 💬",
        badge_best_value: "أفضل قيمة ⭐ وفر للأبد",
        plan_life_title: "اشتراك مدى الحياة",
        period_life: "/ دفعة واحدة فقط",
        plan_life_desc: "امتلك التطبيق للأبد بدون أي اشتراكات أو تجديدات شهرية.",
        perk_life_unlimited: "وصول أبدي غير محدود (صلاحية 2099+)",
        perk_life_platforms: "نسخة الآيفون (iOS) + نسخة الكمبيوتر (PC)",
        perk_life_updates: "جميع التحديثات المستقبلية مجاناً",
        perk_life_vip: "أولوية VIP في الدعم والتطوير",
        perk_life_lock: "إمكانية نقل المفتاح بين أجهزتك عند الترقية",
        btn_buy_life: "طلب مدى الحياة ($50) 👑",
        
        // Dedicated Downloads Section
        dl_section_tag: "التحميل المباشر والتثبيت",
        dl_section_title: "حمّل التطبيق لجهازك وابدأ التثبيت مجاناً",
        dl_section_subtitle: "الملفات متاحة للتحميل المباشر الآن. عند الضغط سيبدأ التنزيل فوراً، وتستطيع استلام مفتاح التفعيل عبر تيليجرام من المالك.",
        dl_ipa_badge: "للآيفون والآيباد (iOS)",
        dl_ipa_btn: "تحميل ملف IPA (10.8 MB) 🍏",
        dl_pc_badge: "للكمبيوتر (Windows PC)",
        dl_pc_btn: "تحميل حزمة PC ZIP (107 MB) 💻",
        dl_ios_perk1: "بدون جيلبريك (يدعم iOS 13 وحتى أحدث إصدارات iOS)",
        dl_ios_perk2: "تثبيت سهل وسريع عبر Scarlet أو ESign أو Sideloadly",
        dl_ios_perk3: "متصفح مدمج يحقن المحرك مباشرة داخل Chess.com",
        dl_ios_perk4: "محمي بمفتاح ترخيص حصري يرسله المالك بعد التواصل",
        dl_pc_perk1: "متوافق مع Windows 10 و Windows 11 (64-bit)",
        dl_pc_perk2: "شاشة شفافة فوق اللعبة ومخفية تماماً عن بث الديسكورد والزووم",
        dl_pc_perk3: "اختصارات سريعة (Ctrl+Shift+H) للبدء والإيقاف اللحظي",
        dl_pc_perk4: "محمي بمفتاح ترخيص حصري يرسله المالك بعد التواصل",
        dl_guide_quick_title: "طريقة التثبيت السريعة:",
        dl_guide_quick_ios: "قم بتحميل ملف الـ IPA، وافتحه عبر تطبيق ESign أو Scarlet على هاتفك، أو استخدم Sideloadly من الكمبيوتر لتثبيته خلال دقائق.",
        dl_guide_quick_pc: "فك الضغط عن ملف ZIP، حمّل مجلد extension في متصفح كروم (Developer Mode)، ثم شغّل ملف main.exe وأدخل مفتاحك.",
        dl_banner_title: "كيف يعمل نظام التفعيل بالمفتاح؟",
        dl_banner_desc: "يمكنك تنزيل وتثبيت الملفات أعلاه على هاتفك أو كمبيوترك في أي وقت مجاناً. عند فتح البرنامج لأول مرة سيطلب منك مفتاح الترخيص (License Key). للحصول على مفتاحك، تواصل مع المالك مباشرة على تيليجرام @owner_1_1 وسيرسل لك المفتاح في المحادثة مباشرة.",
        btn_get_key_now: "تواصل عبر تيليجرام للحصول على المفتاح ⚡",

        // Activation Popup Modal
        modal_dl_badge: "بدأ التحميل بنجاح 📥",
        modal_dl_title: "تم بدء تحميل التطبيق لجهازك! 🚀",
        modal_dl_subtitle: "يتم تنزيل ملف التطبيق الآن. التطبيق متاح للتثبيت، ولكن يتطلب مفتاح ترخيص حصري لبدء التشغيل.",
        act_box_title: "كيفية استلام مفتاح التفعيل (License Key):",
        act_box_desc: "لتشغيل البوت والحصول على الأسهم التكتيكية الخفية، تحتاج لمفتاح تفعيل رسمي خاص بك. تواصل مباشرة مع المالك عبر محادثة Telegram للحصول على مفتاحك فوراً:",
        q_step1_h: "1. تثبيت التطبيق على جهازك:",
        q_step1_p: "افتح الملف المحمل على الآيفون (عبر Scarlet/ESign/Sideloadly) أو فك ضغط ملف الكمبيوتر وشغل main.exe.",
        q_step2_h: "2. مراسلة المالك على تيليجرام:",
        q_step2_desc: "تواصل مع المالك عبر حسابه الرسمي (@owner_1_1) لطلب مفتاح التفعيل الخاص بك.",
        q_step3_h: "3. تفعيل المفتاح وبدء اللعب:",
        q_step3_desc: "الصق المفتاح في شاشة التفعيل واضغط Activate ليبدأ البوت بالعمل فوراً بتخفٍ تام!",
        btn_modal_tg: "تواصل عبر تيليجرام لاستلام مفتاحك (@owner_1_1) 💬",
        btn_close_sub: "حسناً، فهمت",
        guide_tab_ios: "دليل تشغيل الآيفون",
        guide_tab_pc: "دليل تشغيل الكمبيوتر",
        btn_done: "تم، استمتع باللعب! ♟️"
    },
    en: {
        header_badge: "PRO ASSISTANT",
        nav_features: "Features",
        nav_showcase: "Showcase",
        nav_pricing: "Pricing Plans",
        nav_downloads: "Downloads & Guide",
        btn_get_started: "Contact Owner ⚡",
        hero_pill: "100% Active • Stockfish 18 • Anti-Ban Engine",
        hero_title_1: "Dominate Chess",
        hero_title_gradient: "In Total Stealth & Mastery",
        hero_desc: "The world's most advanced chess assistant for iPhone (iOS) and PC (Windows). Real-time tactical arrow guidance completely hidden from Discord streaming, Zoom, and OBS screen recorders.",
        choose_platform: "Choose your primary device:",
        platform_both: "Both Devices (All)",
        hero_cta_buy: "Subscribe & Get Key ♟️",
        hero_cta_demo: "Download App Free 📥",
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
        feat_5_title: "Direct Free Download",
        feat_5_desc: "You can download and install the app files immediately on your device. The exclusive activation key is delivered directly by the owner on Telegram.",
        feat_6_title: "Dynamic ELO Rating Control",
        feat_6_desc: "Adjust your playing strength smoothly from 1200 ELO (beginner) up to 2850+ ELO (Super Grandmaster) using the real-time depth slider.",
        showcase_tag: "Mobile Excellence",
        showcase_title: "Engineered Specifically for iPhone",
        showcase_desc: "Play from your couch or on the go. The iPhone app opens Chess.com in a secure sandboxed webview, injecting the engine to paint winning arrows in real time.",
        s_feat_1: "Compatible with all iPhone models running iOS 13 through iOS 18+",
        s_feat_2: "Effortless installation via ESign, Scarlet, or Sideloadly",
        s_feat_3: "No jailbreak needed, fully compliant with iOS security sandbox",
        btn_choose_plan: "Download App Now ⚡",
        pricing_tag: "Subscription Packages",
        pricing_title: "Choose Your Plan & Contact for Key",
        pricing_subtitle: "The app is free to download and install. Your license key is sent directly by the owner on Telegram.",
        plan_monthly_title: "Monthly Pass",
        period_month: "/ 1 Month",
        plan_monthly_desc: "Perfect for tournaments, testing, and rapid rating elevation.",
        perk_full_access: "Full access to iPhone (IPA) or PC (EXE)",
        perk_engine: "Unrestricted Stockfish 18 engine",
        perk_stealth: "Stream & screen recording stealth protection",
        perk_antiban: "Humanized delay & anti-ban algorithm",
        perk_duration_30: "Valid for 30 full days",
        btn_buy_monthly: "Request Monthly ($10) 💬",
        badge_most_popular: "Most Popular 🔥 Save $5",
        plan_3m_title: "3 Months Pass",
        period_3m: "/ 3 Full Months",
        plan_3m_desc: "The ideal plan to establish dominant, stable high-tier ELO ratings.",
        perk_all_features: "All features of the Monthly Pass",
        perk_both_platforms: "Includes both iPhone (IPA) + PC (EXE) builds",
        perk_updates: "Free continuous engine updates",
        perk_priority_support: "Direct priority game support",
        perk_duration_90: "Valid for 90 full days",
        btn_buy_3m: "Request 3 Months ($25) 💬",
        badge_best_value: "Best Value ⭐ Save Forever",
        plan_life_title: "Lifetime Ownership",
        period_life: "/ One-time Payment",
        plan_life_desc: "Own the bot forever with zero recurring monthly fees or renewals.",
        perk_life_unlimited: "Perpetual lifetime access (Expires 2099+)",
        perk_life_platforms: "Both iPhone (iOS) + PC (Windows) included",
        perk_life_updates: "All future updates and major versions free",
        perk_life_vip: "VIP priority developer support",
        perk_life_lock: "Free key transfer when switching phones or PCs",
        btn_buy_life: "Request Lifetime ($50) 👑",

        // Dedicated Downloads Section
        dl_section_tag: "Direct Downloads & Installation",
        dl_section_title: "Download & Install the App Free on Any Device",
        dl_section_subtitle: "Files are available for immediate download. When you click, download starts instantly, and you can obtain your license key on Telegram from the owner.",
        dl_ipa_badge: "iPhone & iPad (iOS)",
        dl_ipa_btn: "Download IPA Build (10.8 MB) 🍏",
        dl_pc_badge: "Windows PC (10/11)",
        dl_pc_btn: "Download PC ZIP (107 MB) 💻",
        dl_ios_perk1: "No Jailbreak Required (Supports iOS 13 through iOS 18+)",
        dl_ios_perk2: "Effortless installation via Scarlet, ESign, or Sideloadly",
        dl_ios_perk3: "Sandboxed browser injects engine directly into Chess.com",
        dl_ios_perk4: "Protected by unique license key delivered upon contact",
        dl_pc_perk1: "Fully compatible with Windows 10 and Windows 11 (64-bit)",
        dl_pc_perk2: "Invisible ghost overlay hidden from Discord & OBS screen share",
        dl_pc_perk3: "Quick keyboard shortcuts (Ctrl+Shift+H) for instant toggling",
        dl_pc_perk4: "Protected by unique license key delivered upon contact",
        dl_guide_quick_title: "Quick Setup Guide:",
        dl_guide_quick_ios: "Download the IPA file, open it in ESign or Scarlet on your iPhone, or use Sideloadly on PC to install within minutes.",
        dl_guide_quick_pc: "Extract the ZIP file, load the extension folder in Google Chrome (Developer Mode), run main.exe and enter your key.",
        dl_banner_title: "How Does the License Key System Work?",
        dl_banner_desc: "You can download and install the app files on your iPhone or PC anytime for free. When you first launch the app, it will ask for an official License Key. To receive your key, contact the owner on Telegram @owner_1_1 and he will send your key directly in chat.",
        btn_get_key_now: "Contact on Telegram for Key ⚡",

        // Activation Popup Modal
        modal_dl_badge: "Download Started Successfully 📥",
        modal_dl_title: "Your App Download Has Begun! 🚀",
        modal_dl_subtitle: "The file is downloading now. The app is free to install, but requires an official license key to activate and play.",
        act_box_title: "How to Obtain Your License Key:",
        act_box_desc: "To activate the assistant and enable tactical arrow overlays on the chessboard, you need an official license key. Contact the owner directly on Telegram to get your key instantly:",
        q_step1_h: "1. Install the App on Your Device:",
        q_step1_p: "Install the downloaded IPA on iPhone (via Scarlet/ESign/Sideloadly) or unzip the PC package and launch main.exe.",
        q_step2_h: "2. Message the Owner on Telegram:",
        q_step2_desc: "Contact the owner via his official handle (@owner_1_1) to request your activation key.",
        q_step3_h: "3. Activate the Key & Start Playing:",
        q_step3_desc: "Paste the key in the activation screen and tap Activate to start dominating in complete stealth!",
        btn_modal_tg: "Contact on Telegram for Key (@owner_1_1) 💬",
        btn_close_sub: "Understood, Close",
        guide_tab_ios: "iPhone Setup Guide",
        guide_tab_pc: "PC Setup Guide",
        btn_done: "Done, Enjoy Winning! ♟️"
    }
};

// State Variables
let currentLanguage = localStorage.getItem("site_lang") || "ar";
let selectedPlatform = localStorage.getItem("selected_platform") || "ios";

const OWNER_TELEGRAM = "owner_1_1";
const OWNER_TELEGRAM_URL = "https://t.me/owner_1_1";

// DOM Loaded Initialization
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLanguage);
    selectPlatform(selectedPlatform);
    setupDownloadLinks();

    // Setup Language Toggle Event
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
        langBtn.addEventListener("click", () => {
            currentLanguage = currentLanguage === "ar" ? "en" : "ar";
            localStorage.setItem("site_lang", currentLanguage);
            applyLanguage(currentLanguage);
        });
    }
});

// Setup Download Links (Local vs GitHub Releases CDN Fallback)
function setupDownloadLinks() {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const GITHUB_RELEASE_BASE = "https://github.com/computerengineer1/Stealth-chess/releases/download/v2.0.0";

    const ipaUrl = isLocalhost ? "downloads/StealthChessHelper.ipa" : `${GITHUB_RELEASE_BASE}/StealthChessHelper.ipa`;
    const pcUrl = isLocalhost ? "downloads/StealthChess_PC.zip" : `${GITHUB_RELEASE_BASE}/StealthChess_PC.zip`;

    document.querySelectorAll(".dl-link-ipa").forEach(el => {
        el.href = ipaUrl;
    });

    document.querySelectorAll(".dl-link-pc").forEach(el => {
        el.href = pcUrl;
    });
}

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
}

// 4. Download Trigger with Immediate Popup Message
function triggerAppDownload(platform, event) {
    // If event is present, let the browser download naturally via the href
    const isAr = currentLanguage === "ar";
    
    // Show the Activation Alert Modal
    const modal = document.getElementById("activationModal");
    if (modal) {
        modal.classList.remove("hidden");
    }

    showToast(isAr 
        ? "📥 بدأ تحميل الملف! تواصل مع المالك على تيليجرام لاستلام المفتاح" 
        : "📥 Download started! Contact owner on Telegram to get your key");
}

function closeActivationModal() {
    const modal = document.getElementById("activationModal");
    if (modal) {
        modal.classList.add("hidden");
    }
}

// 5. Contact Owner for a Specific Plan
function contactOwnerForPlan(planName, price) {
    const isAr = currentLanguage === "ar";
    const platformText = selectedPlatform === "ios" 
        ? (isAr ? "الآيفون (iOS IPA)" : "iPhone (iOS IPA)") 
        : (selectedPlatform === "pc" 
            ? (isAr ? "الكمبيوتر (Windows EXE)" : "Windows PC (EXE)") 
            : (isAr ? "كلا الجهازين" : "Both Devices"));

    const msg = isAr
        ? `مرحباً محمود! 👋\nأرغب بالاشتراك في باقة (${planName} - $${price}) لبوت الشطرنج (Stealth Chess) لمنصة (${platformText}).\nيرجى تزويدي بطريقة الدفع ومفتاح التفعيل الخاص بي ♟️`
        : `Hello Mahmoud! 👋\nI would like to activate the (${planName} - $${price}) plan for Stealth Chess Bot on (${platformText}).\nPlease provide payment details and send my license key ♟️`;

    window.open(`${OWNER_TELEGRAM_URL}?text=${encodeURIComponent(msg)}`, "_blank");
}

// 6. Direct Owner Chat from Modal
function openTelegramOwnerChat() {
    const isAr = currentLanguage === "ar";
    const msg = isAr
        ? "مرحباً محمود! 👋\nلقد قمت بتحميل تطبيق بوت الشطرنج (Stealth Chess)، وأرغب بالحصول على مفتاح الترخيص (License Key) لتفعيل البوت وبدء اللعب ♟️"
        : "Hello Mahmoud! 👋\nI downloaded the Stealth Chess app and would like to obtain my License Key to activate the bot and start playing ♟️";

    window.open(`${OWNER_TELEGRAM_URL}?text=${encodeURIComponent(msg)}`, "_blank");
}

// 7. Setup Guide Tab Switching
function switchGuide(type) {
    const tabIos = document.getElementById("tabGuideIos");
    const tabPc = document.getElementById("tabGuidePc");
    const contentIos = document.getElementById("guideContentIos");
    const contentPc = document.getElementById("guideContentPc");

    if (type === "ios") {
        if (tabIos) tabIos.classList.add("active");
        if (tabPc) tabPc.classList.remove("active");
        if (contentIos) contentIos.classList.remove("hidden");
        if (contentPc) contentPc.classList.add("hidden");
    } else {
        if (tabPc) tabPc.classList.add("active");
        if (tabIos) tabIos.classList.remove("active");
        if (contentPc) contentPc.classList.remove("hidden");
        if (contentIos) contentIos.classList.add("hidden");
    }
}

// Toast Helper
function showToast(message) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 4500);
}
