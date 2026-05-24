# LURA Beauty Collection — دليل الرفع على GitHub + Cloudflare

## الملفات:
- `index.html` — صفحة الموقع الرئيسية
- `style.css` — التصميم
- `products.js` — قاعدة بيانات المنتجات (عدّليها مباشرة أو من لوحة التحكم)
- `app.js` — منطق التطبيق

---

## خطوات الرفع على GitHub Pages (مجاني):

### 1. أنشئي Repository جديد
- اذهبي إلى github.com وسجلي الدخول
- اضغطي (+) ثم "New repository"
- الاسم: `lura-beauty-store`
- اختاري Public
- اضغطي "Create repository"

### 2. ارفعي الملفات
- في صفحة الـ Repository الجديد، اضغطي "uploading an existing file"
- ارفعي الملفات الأربعة: index.html, style.css, products.js, app.js
- اضغطي "Commit changes"

### 3. فعّلي GitHub Pages
- اذهبي إلى Settings > Pages
- من Source اختاري: Deploy from a branch
- Branch: main / root
- اضغطي Save
- بعد دقيقة سيكون موقعك على: `https://اسمك.github.io/lura-beauty-store`

---

## ربط Cloudflare للحصول على نطاق خاص:

### 1. أضيفي موقعك في Cloudflare
- سجلي الدخول على cloudflare.com
- Pages > Create a project > Connect to Git
- اختاري الـ Repository: lura-beauty-store
- Framework preset: None
- Build command: (اتركيه فارغاً)
- Build output directory: / (أو اتركيه)
- اضغطي Deploy

### 2. النطاق
- ستحصلين على: `lura-beauty-store.pages.dev`
- يمكنك إضافة نطاقك الخاص من: Pages > Custom domains

---

## تحديث المنتجات لاحقاً:
- افتحي `products.js` في GitHub وعدّليه مباشرة
- أو استخدمي لوحة التحكم في الموقع (التغييرات مؤقتة — تحتاجين تصدير وتحديث الملف)
