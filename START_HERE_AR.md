# 🚀 ابدأ من هنا — دليل المالك (بالعربي) — Stealth Chess Helper v1.3

هذا الملف هو **الدليل الوحيد** الذي تحتاجه. كل شيء جاهز في الكود،
وأنت فقط تنفّذ الأوامر بالترتيب. **كل الأدوات مجانية 100%**.

---

## ⭐ أسهل طريقة على الإطلاق: ملف واحد بضغطة زر (PUBLISH.ps1)

في مجلد المشروع يوجد ملف اسمه `PUBLISH.ps1` يقوم بكل شيء تلقائياً:
(تحديث رقم الإصدار + رفع الكود + إنشاء الوسم + بناء APK/IPA تلقائياً على GitHub)

### الخطوات (مرة واحدة فقط):

1. افتح **PowerShell** ونفّذ:
   ```powershell
   cd C:\Users\mahmo\Downloads\Stealth-CHESS-V2
   Set-ExecutionPolicy -Scope Process Bypass -Force
   .\PUBLISH.ps1 -Version "1.3.2"
   ```
2. انتظر 5–15 دقيقة.
3. حمّل الملفات الجديدة من:
   `https://github.com/computerengineer1/Stealth-CHESS-V2/releases`

> إذا طلب منك GitHub تسجيل دخول عند الـ push — استخدم **Personal Access Token**:
> من GitHub ← Settings ← Developer settings ← Personal access tokens ← Fine-grained ← أنشئ توكن بصلاحية `Contents: Read and write` لم مستودعك، والصقه عند طلب كلمة السر.

---

## 🔐 خطوة الخادم المركزي (Cloudflare Worker — مجاني للأبد)

الخادم يجعل كل مفتاح يُقفل على جهاز واحد ويتحكم به من لوحة التحكم.

نفّذ هذه الأوامر **مرة واحدة فقط** من داخل مجلد المشروع:

```powershell
cd C:\Users\mahmo\Downloads\Stealth-CHESS-V2

# 1) سجّل الدخول لحساب Cloudflare المجاني (يفتح المتصفح — اضغط Allow)
npx wrangler login

# 2) أنشئ قاعدة بيانات المفاتيح المجانية KV — انسخ الـ id الذي سيظهر لك
npx wrangler kv namespace create LEDGER

# 3) ضع الـ id في ملف server/wrangler.toml مكان REPLACE_WITH_YOUR_KV_ID
notepad server\wrangler.toml

# 4) ولّد مفاتيحك الخاصة (تُنشأ مرة واحدة فقط وتبقى معك للأبد)
python dev_tools\make_owner_keys.py

# 5) ارفع المفتاح الخاص إلى الخادم السري (لا يراه أي أحد — حتى GitHub)
cd server
npx wrangler secret put PRIVATE_KEY_HEX
#    ← افتح ملف stealth_owner_private_seed.hex وانسخ محتواه (64 حرفاً) ثم الصقه هنا وEnter

# 6) اكتب كلمة سر للوحة التحكم (خاصة بك وحدك)
npx wrangler secret put ADMIN_TOKEN
#    ← اكتب أي عبارة طويلة عشوائية مثل: MyChess77!Admin2026xZ ثم Enter

# 7) انشر الخادم 🎉
npx wrangler deploy
```

7. سينتهي بنجاح ويعطيك رابطاً مثل:
   `https://stealth-chess-license-server.xxxxx.workers.dev`

8. ضع الرابط في مكانين فقط:
   - `config.py` السطر: `LICENSE_API_URL = "ضع الرابط هنا"`
   - `mobile_app/www/app.js` السطر 6: `LICENSE_API_URL: "ضع الرابط هنا",`

9. نفّذ النشر النهائي من الخطوة الأولى (`.\PUBLISH.ps1`) ليخرج APK/IPA مربوط بالخادم.

---

## 🎛️ لوحة التحكم (توليد المفاتيح بضغطة واحدة)

بعد رفع الخادم:
1. افتح ملف `server/admin-panel.html` بأي متصفح على جهازك.
2. أدخل رابط الخادم + الـ ADMIN_TOKEN الذي كتبته.
3. اضغط **Issue Key** ← تختار الباقة (يوم/شهر/3 شهور/عمر) ← **Generate**.
4. أرسل المفتاح للعميل — يعمل على **جهازه فقط** ولا يمكن نسخه لأي أحد.
5. أي تسريب؟ اضغط **Revoke** ويموت المفتاح في نفس الثانية على كل الأجهزة.

---

## ❓ أسئلة شائعة

- **هل Cloudflare مجاني؟** نعم — الخطة المجانية = 100,000 طلب يومياً، ولن تصل لها أصلاً. لا حاجة لبطاقة دفع.
- **المفاتيح القديمة (v1.2 وأقل) لن تعمل** — هذا مقصود لحماية مشروعك من التسريب.
- **لا ترفع أبداً** ملف `stealth_owner_key.pem` إلى GitHub — هو كنزك الوحيد لتوليد المفاتيح. احفظ نسخة منه على فلاشة خارج الإنترنت.
- **الأندرويد:** ثبّت APK مباشرة (السماح بتثبيت من مصادر غير معروفة).
- **الآيفون:** وقّع IPA باستخدام Sideloadly أو AltStore بحساب Apple المجاني.
