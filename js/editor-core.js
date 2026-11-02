/* ==========================================================
   هسته‌ی مشترک ادیتور سایت — همه‌ی صفحه‌های editor-*.html از این فایل استفاده می‌کنند.
   وظیفه: بارگذاری سایت، ساخت منوی کناری و هدر، اتصال فرم‌ها، پیش‌نمایش زنده و ذخیره.
   نکته: ذخیره همیشه «کل داده‌ی ادیتور» را می‌فرستد (سرور آن را اعتبارسنجی و جایگزین می‌کند)،
   پس هر صفحه فقط بخشی را نشان می‌دهد ولی چیزی از بخش‌های دیگر پاک نمی‌شود.
   ========================================================== */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var SITE_ID = q.get('id');
  var ADMIN = q.get('admin') === '1';
  var BASE_DOMAIN = window.BASE_DOMAIN || 'yoursite.com';

  var PRODUCT_TEMPLATES = ['shop', 'restaurant', 'realestate', 'portfolio'];
  var ICONS = { business: '💼', shop: '🛍️', portfolio: '🎨', blog: '📝', restaurant: '🍽️', realestate: '🏠' };

  /* برچسب‌های هر قالب برای بخش محصولات */
  var LABELS = {
    shop:       { list: 'محصولات', noun: 'محصول', add: 'افزودن محصول', empty: 'هنوز محصولی اضافه نکرده‌ای. اولین محصولت را اضافه کن!',
                  name: 'نام محصول', namePh: 'مثلاً: دسته گل رز قرمز', descPh: 'مثلاً: ارسال رایگان در تهران', catPh: 'مثلاً: گل‌های شاخه‌ای',
                  hasPrice: true, stock: 'موجود در انبار', stockOff: 'ناموجود', icon: '🛍️' },
    restaurant: { list: 'منوی غذا', noun: 'آیتم', add: 'افزودن آیتم به منو', empty: 'منو خالی است. اولین آیتم را اضافه کن!',
                  name: 'نام غذا یا نوشیدنی', namePh: 'مثلاً: پیتزا مخصوص', descPh: 'مثلاً: ژامبون، قارچ و پنیر موزارلا', catPh: 'مثلاً: پیتزا',
                  hasPrice: true, stock: 'امروز موجود است', stockOff: 'تمام شده', icon: '🍽️' },
    realestate: { list: 'لیست املاک', noun: 'ملک', add: 'افزودن ملک', empty: 'هنوز ملکی اضافه نکرده‌ای.',
                  name: 'عنوان ملک', namePh: 'مثلاً: آپارتمان ۸۵ متری، ولنجک', descPh: 'مثلاً: ۲ خوابه، پارکینگ، انباری', catPh: 'مثلاً: فروش آپارتمان',
                  hasPrice: true, stock: 'در دسترس', stockOff: 'فروخته شد', icon: '🏠' },
    portfolio:  { list: 'نمونه‌کارها', noun: 'نمونه‌کار', add: 'افزودن نمونه‌کار', empty: 'هنوز نمونه‌کاری نداری.',
                  name: 'عنوان نمونه‌کار', namePh: 'مثلاً: طراحی لوگوی کافه', descPh: 'یک جمله درباره‌ی این کار', catPh: 'مثلاً: برندینگ',
                  hasPrice: false, stock: 'در دسترس', stockOff: 'در دسترس نیست', icon: '🎨' }
  };

  var SECTION_KEYS = ['hero', 'products', 'services', 'gallery', 'team', 'testimonials', 'faq', 'articles', 'podcast', 'booking', 'contact'];
  var SECTION_META = {
    hero: { icon: '🌟', label: 'معرفی (هیرو)', fixed: true }, products: { icon: '🛍️', label: 'محصولات' }, services: { icon: '🧰', label: 'خدمات' },
    gallery: { icon: '🖼️', label: 'گالری' }, team: { icon: '👥', label: 'تیم' }, testimonials: { icon: '💬', label: 'نظر مشتریان' },
    faq: { icon: '❓', label: 'سوالات متداول' }, articles: { icon: '📝', label: 'مقالات' }, podcast: { icon: '🎙️', label: 'پادکست' },
    booking: { icon: '📅', label: 'رزرو' }, contact: { icon: '📞', label: 'تماس', fixed: true }
  };
  var SECTION_LIST = { services: 'services', gallery: 'gallery', team: 'team', faq: 'faq', testimonials: 'testimonials', articles: 'articles', podcast: 'podcasts' };

  var site, DEFAULTS, EDITOR, dirty = false, saving = false, snapshotJson = '';

  /* ---------- ابزارها ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
  }
  function fmtMoney(n) { return Math.floor(Number(n) || 0).toLocaleString('fa-IR'); }
  function safeImg(u) { return /^(\/uploads\/[a-f0-9]{24}\.(png|jpg|gif|webp)|https:\/\/[^\s"'()<>\\]+|data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+=*)$/.test(String(u || '')) ? u : ''; }
  function isProductTpl(t) { return PRODUCT_TEMPLATES.indexOf(t || EDITOR.template) >= 0; }
  function labels() { return LABELS[EDITOR.template] || LABELS.shop; }
  function url(page, extra) {
    var p = new URLSearchParams();
    p.set('id', SITE_ID);
    if (ADMIN) p.set('admin', '1');
    Object.keys(extra || {}).forEach(function (k) { p.set(k, extra[k]); });
    return page + '?' + p.toString();
  }
  function redirect(to) { window.location.href = to; return Object.assign(new Error('redirect'), { __redirected: true }); }

  var toastTimer;
  function toast(msg, isError) {
    var t = document.getElementById('dashToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('error', !!isError);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  /* ---------- مقادیر پیش‌فرض ---------- */
  function buildDefaults() {
    return {
      template: site.template || 'business',
      siteName: site.name,
      logoText: '◆ ' + site.name,
      logoImage: '',
      tagline: 'به سایت ما خوش آمدید',
      primaryColor: '#8b5cf6', secondaryColor: '#ec4899', bgColor: '#ffffff', textColor: '#111111',
      heroTitle: 'به ' + site.name + ' خوش آمدید',
      heroDesc: site.description || 'ما بهترین خدمات را به شما ارائه می‌دهیم.',
      heroBtnText: 'شروع کنیم',
      heroBgImage: '',
      feat1Icon: '⚡', feat1Title: 'سریع و آسان', feat1Desc: 'در کمترین زمان',
      feat2Icon: '✨', feat2Title: 'کیفیت بالا', feat2Desc: 'با بهترین مواد',
      feat3Icon: '💚', feat3Title: 'رضایت تضمینی', feat3Desc: 'پشتیبانی همیشگی',
      contactEmail: 'hello@' + site.subdomain + '.com',
      contactPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
      contactAddress: 'تهران، ایران',
      seoTitle: site.name + ' | بهترین انتخاب',
      seoDescription: site.description || 'سایت ' + site.name,
      seoKeywords: site.name,
      products: [], services: [], gallery: [], team: [], faq: [], testimonials: [], articles: [], podcasts: [], pages: [],
      sections: SECTION_KEYS.map(function (k) { return { key: k, on: k === 'hero' || k === 'contact' }; })
    };
  }

  /* ---------- وضعیت ذخیره ---------- */
  function currentJson() { return JSON.stringify(EDITOR); }
  function touch() {
    dirty = currentJson() !== snapshotJson;
    paintSaveState();
  }
  function paintSaveState() {
    var b = document.getElementById('saveBtn'), s = document.getElementById('saveState');
    if (b) { b.disabled = saving; b.classList.toggle('is-dirty', dirty); }
    if (s) {
      s.textContent = ADMIN ? 'حالت مشاهده (ادمین)' : saving ? 'در حال ذخیره…' : dirty ? 'تغییرات ذخیره‌نشده' : 'همه‌چیز ذخیره است';
      s.className = 'save-state' + (dirty && !saving ? ' dirty' : '');
    }
  }

  /* ذخیره‌ی کل داده؛ promise برمی‌گرداند و در خطا reject می‌شود */
  function save(opts) {
    opts = opts || {};
    if (ADMIN) { toast('حالت مشاهده (ادمین): امکان ذخیره وجود ندارد.', true); return Promise.reject(new Error('readonly')); }
    if (saving) return Promise.reject(new Error('busy'));
    saving = true; paintSaveState();
    return API.put('/api/sites/' + encodeURIComponent(SITE_ID), { editor: EDITOR }).then(function (r) {
      site.name = r.site.name;
      snapshotJson = currentJson(); dirty = false;
      var n = document.getElementById('sideSiteName'); if (n) n.textContent = site.name;
      if (!opts.silent) toast('✓ تغییرات ذخیره شد');
      return r;
    }).catch(function (e) {
      toast(e.message || 'ذخیره انجام نشد', true); throw e;
    }).finally(function () { saving = false; paintSaveState(); });
  }

  /* ---------- آپلود تصویر ---------- */
  var MAX_IMG_MB = 5;
  function upload(file) {
    if (!file) return Promise.resolve(null);
    if (file.size > MAX_IMG_MB * 1024 * 1024) { toast('حجم تصویر باید کمتر از ' + MAX_IMG_MB + ' مگابایت باشد', true); return Promise.resolve(null); }
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) { toast('فقط PNG، JPG، GIF یا WEBP مجاز است', true); return Promise.resolve(null); }
    return API.upload('/api/upload', file).then(function (r) { return r.url; })
      .catch(function (e) { toast(e.message, true); return null; });
  }

  /* ---------- منوی کناری و هدر ---------- */
  var NAV = [
    { id: 'overview', href: 'site-editor.html', icon: '🏠', label: 'نمای کلی' },
    { id: 'design', href: 'editor-design.html', icon: '🎨', label: 'ظاهر و برند' },
    { id: 'content', href: 'editor-content.html', icon: '📝', label: 'صفحه اصلی' },
    { id: 'sections', href: 'editor-sections.html', icon: '🧩', label: 'چیدمان بخش‌ها' },
    { id: 'products', href: 'editor-products.html', icon: '🛍️', label: 'محصولات', needs: 'products' },
    { id: 'contact', href: 'editor-contact.html', icon: '📞', label: 'تماس' },
    { id: 'seo', href: 'editor-seo.html', icon: '🔍', label: 'سئو' },
    { sep: 'محتوا' },
    { id: 'list-services', href: 'editor-list.html', q: { type: 'services' }, icon: '🧰', label: 'خدمات' },
    { id: 'list-articles', href: 'editor-list.html', q: { type: 'articles' }, icon: '📝', label: 'مقالات' },
    { id: 'list-podcasts', href: 'editor-list.html', q: { type: 'podcasts' }, icon: '🎙️', label: 'پادکست‌ها' },
    { id: 'list-gallery', href: 'editor-list.html', q: { type: 'gallery' }, icon: '🖼️', label: 'گالری' },
    { id: 'list-team', href: 'editor-list.html', q: { type: 'team' }, icon: '👥', label: 'تیم' },
    { id: 'list-faq', href: 'editor-list.html', q: { type: 'faq' }, icon: '❓', label: 'سوالات متداول' },
    { id: 'list-testimonials', href: 'editor-list.html', q: { type: 'testimonials' }, icon: '💬', label: 'نظر مشتریان' },
    { id: 'list-pages', href: 'editor-list.html', q: { type: 'pages' }, icon: '📄', label: 'صفحه‌های سفارشی' },
    { id: 'files', href: 'editor-files.html', icon: '🗂️', label: 'کتابخانه فایل‌ها' }
  ];

  function navHtml(active) {
    return NAV.filter(function (n) { return n.needs !== 'products' || isProductTpl(); }).map(function (n) {
      if (n.sep) return '<div class="nav-sep">' + esc(n.sep) + '</div>';
      var label = n.id === 'products' ? labels().list : n.label;
      var icon = n.id === 'products' ? labels().icon : n.icon;
      var on = n.id === active || (n.id === 'products' && active === 'product');
      return '<a href="' + esc(url(n.href, n.q)) + '" data-nav class="' + (on ? 'active' : '') + '"><span class="icon">' + icon + '</span> ' + esc(label) + '</a>';
    }).join('');
  }
  function refreshChrome() {
    var nav = document.getElementById('edNav');
    if (nav) nav.innerHTML = navHtml(document.body.dataset.page);
    var av = document.getElementById('siteAvatar'); if (av) av.textContent = ICONS[EDITOR.template] || '🌐';
  }

  function buildShell(page, opts) {
    var tpl = document.getElementById('pageBody');
    var host = BASE_DOMAIN;
    var sub = site.subdomain + '.' + host;
    var body = tpl ? tpl.content.cloneNode(true) : document.createDocumentFragment();
    var slot = body.querySelector('[data-slot="side"]');
    var hasSide = !!slot || opts.preview !== false;

    var root = document.getElementById('editorRoot');
    root.innerHTML =
      '<div class="dash-layout">' +
        '<aside class="dash-sidebar">' +
          '<div class="dash-brand">✏️ ویرایش سایت</div>' +
          '<div class="dash-user-mini"><div class="avatar" id="siteAvatar">' + (ICONS[EDITOR.template] || '🌐') + '</div>' +
            '<div class="info"><div class="name" id="sideSiteName">' + esc(site.name) + '</div><div class="id">' + esc(sub) + '</div></div></div>' +
          '<nav class="dash-nav" id="edNav"></nav>' +
          '<a href="' + (ADMIN ? 'admin.html' : 'dashboard.html') + '" class="btn btn-ghost ed-back">← بازگشت به پنل</a>' +
        '</aside>' +
        '<main class="dash-main">' +
          '<header class="dash-header">' +
            '<div class="ed-title">' +
              (opts.back ? '<a class="ed-crumb" data-nav href="' + esc(url(opts.back.href)) + '">→ ' + esc(opts.back.label) + '</a>' : '') +
              '<h1 id="edTitle"></h1><div class="ed-sub" id="edSub"></div>' +
            '</div>' +
            '<div class="dash-header-actions">' +
              (hasSide ? '<button type="button" class="btn btn-ghost ed-peek" id="peekBtn">👁 پیش‌نمایش</button>' : '') +
              '<a class="btn btn-ghost" target="_blank" rel="noopener" href="/s/' + encodeURIComponent(site.subdomain) + '">↗ مشاهده سایت</a>' +
              (opts.save === false ? '' :
                '<span class="save-state" id="saveState"></span>' +
                '<button type="button" class="btn btn-primary" id="saveBtn">💾 ذخیره</button>') +
            '</div>' +
          '</header>' +
          '<div class="editor-layout' + (hasSide ? '' : ' single') + '">' +
            '<div class="editor-forms" id="edForms"></div>' +
            (hasSide ? '<div class="editor-preview-wrap" id="edSide"></div>' : '') +
          '</div>' +
        '</main>' +
      '</div>' +
      '<div class="dash-toast" id="dashToast"></div>';

    document.getElementById('edTitle').textContent = opts.title || '';
    document.getElementById('edSub').textContent = opts.sub || site.name + ' — ' + sub;
    document.title = (opts.title || 'ویرایش') + ' | ' + site.name;

    var forms = document.getElementById('edForms');
    if (slot) slot.parentNode.removeChild(slot);
    forms.appendChild(body);

    var side = document.getElementById('edSide');
    if (side) {
      if (slot) { side.appendChild(slot); }
      else {
        side.innerHTML =
          '<div class="preview-device-toggle"><button type="button" class="active" data-device="desktop">🖥️ دسکتاپ</button><button type="button" data-device="mobile">📱 موبایل</button></div>' +
          '<div class="editor-preview-frame" id="previewFrame"><div class="editor-preview-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="url">' + esc(sub) + '</span></div>' +
          '<div class="editor-preview-content" id="previewContent"></div></div>';
        side.querySelectorAll('[data-device]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            side.querySelectorAll('[data-device]').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById('previewFrame').classList.toggle('mobile', btn.dataset.device === 'mobile');
          });
        });
      }
      var peek = document.getElementById('peekBtn');
      if (peek) peek.addEventListener('click', function () { side.classList.toggle('open'); });
      side.addEventListener('click', function (e) { if (e.target === side) side.classList.remove('open'); });
    }

    refreshChrome();
    paintSaveState();

    var sb = document.getElementById('saveBtn');
    if (sb) sb.addEventListener('click', function () { save().catch(function () {}); });

    /* رفتن به صفحه‌ی دیگر با تغییرات ذخیره‌نشده: خودکار ذخیره می‌شود */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-nav]');
      if (!a || !dirty || ADMIN || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      e.preventDefault();
      var go = a.href;
      save({ silent: true }).then(function () { location.href = go; }).catch(function () {
        if (confirm('ذخیره انجام نشد. بدون ذخیره خارج شوم؟')) { dirty = false; location.href = go; }
      });
    });
  }

  /* ---------- اتصال فرم‌ها ---------- */
  function bind(root) {
    root = root || document;

    root.querySelectorAll('[data-key]').forEach(function (el) {
      var key = el.dataset.key;
      if (key in EDITOR) el.value = EDITOR[key] != null ? EDITOR[key] : '';
      el.addEventListener('input', function () { EDITOR[key] = el.value; touch(); renderPreview(); });
    });

    root.querySelectorAll('[data-color-key]').forEach(function (picker) {
      var key = picker.dataset.colorKey;
      var text = root.querySelector('[data-key="' + key + '"]');
      if (EDITOR[key]) picker.value = EDITOR[key];
      picker.addEventListener('input', function () {
        if (text) text.value = picker.value;
        EDITOR[key] = picker.value; touch(); renderPreview();
      });
      if (text) text.addEventListener('input', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(text.value)) { picker.value = text.value; EDITOR[key] = text.value; touch(); renderPreview(); }
      });
    });

    root.querySelectorAll('[data-upload]').forEach(function (fi) {
      fi.addEventListener('change', function () {
        var file = fi.files[0]; if (!file) return;
        toast('در حال آپلود…');
        upload(file).then(function (u) {
          fi.value = '';
          if (!u) return;
          var key = fi.dataset.upload;
          EDITOR[key] = u;
          var t = root.querySelector('[data-key="' + key + '"]'); if (t) t.value = u;
          paintImgPreview(root, key);
          touch(); renderPreview(); toast('تصویر بارگذاری شد');
        });
      });
    });
    root.querySelectorAll('[data-preview]').forEach(function (img) { paintImgPreview(root, img.dataset.preview); });
    root.querySelectorAll('[data-key][data-img]').forEach(function (el) {
      el.addEventListener('input', function () { paintImgPreview(root, el.dataset.key); });
    });

    /* شمارنده‌ی کاراکتر */
    root.querySelectorAll('[data-count]').forEach(function (el) {
      var max = parseInt(el.getAttribute('maxlength') || el.dataset.count, 10);
      var c = document.createElement('div'); c.className = 'char-count';
      el.insertAdjacentElement('afterend', c);
      var upd = function () { c.textContent = el.value.length.toLocaleString('fa-IR') + ' / ' + max.toLocaleString('fa-IR'); c.classList.toggle('warn', el.value.length > max * 0.9); };
      el.addEventListener('input', upd); upd();
    });
  }
  function paintImgPreview(root, key) {
    root.querySelectorAll('[data-preview="' + key + '"]').forEach(function (img) {
      var u = safeImg(EDITOR[key]);
      if (u) { img.src = u; img.classList.remove('hidden'); } else { img.classList.add('hidden'); }
    });
  }

  /* ---------- پیش‌نمایش سایت ---------- */
  function visibleProducts() { return (EDITOR.products || []).filter(function (p) { return p.visible !== false; }); }

  function productCardHtml(p, icon) {
    var img = safeImg(p.image);
    var off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return '<div class="ps-product' + (p.available === false ? ' soldout' : '') + '">' +
      '<div class="ps-product-img">' + (img ? '<img src="' + esc(img) + '" alt="">' : icon) +
        (off ? '<span class="ps-badge">٪' + off.toLocaleString('fa-IR') + '</span>' : '') +
        (p.available === false ? '<span class="ps-soldout">' + esc(labels().stockOff) + '</span>' : '') + '</div>' +
      '<div class="ps-product-body">' +
        (p.category ? '<small>' + esc(p.category) + '</small>' : '') +
        '<h4>' + esc(p.name || 'بدون نام') + '</h4>' +
        (p.desc ? '<p>' + esc(p.desc) + '</p>' : '') +
        (labels().hasPrice ? '<div class="price">' + fmtMoney(p.price) + ' تومان' + (off ? ' <s>' + fmtMoney(p.oldPrice) + '</s>' : '') + '</div>' : '') +
      '</div></div>';
  }

  function renderPreview() {
    var el = document.getElementById('previewContent');
    if (!el) return;
    el.style.setProperty('--p', EDITOR.primaryColor);
    el.style.setProperty('--s', EDITOR.secondaryColor);
    el.style.setProperty('--pb', EDITOR.bgColor);
    el.style.setProperty('--pt', EDITOR.textColor);

    var bg = safeImg(EDITOR.heroBgImage);
    var heroBg = bg ? "background-image:linear-gradient(rgba(255,255,255,.65),rgba(255,255,255,.65)),url('" + esc(bg) + "');background-size:cover;background-position:center;" : '';
    var logo = safeImg(EDITOR.logoImage) ? '<img src="' + esc(safeImg(EDITOR.logoImage)) + '" alt="logo">' : (esc(EDITOR.logoText) || 'لوگو');
    var tpl = EDITOR.template;

    var html =
      '<div class="ps-header"><div class="ps-logo">' + logo + '</div><div class="ps-nav"><span>خانه</span><span>درباره</span><span>تماس</span></div></div>';
    var heroHtml =
      '<div class="ps-hero" style="' + heroBg + '"><h1>' + (esc(EDITOR.heroTitle) || 'عنوان سایت') + '</h1><p>' + esc(EDITOR.heroDesc) + '</p>' +
      '<button type="button" class="ps-cta">' + (esc(EDITOR.heroBtnText) || 'شروع') + '</button></div>';

    function productsHtml() {
      if (tpl === 'portfolio') {
        var g = visibleProducts().slice(0, 6);
        return g.length ? '<div class="ps-gallery">' + g.map(function (p) {
          var i = safeImg(p.image); return '<div class="ps-gallery-item">' + (i ? '<img src="' + esc(i) + '" alt="">' : '🎨') + '</div>';
        }).join('') + '</div>' : '<div class="ps-empty">🎨 هنوز نمونه‌کاری اضافه نکرده‌ای</div>';
      }
      var items = visibleProducts();
      var titles = { shop: 'محصولات ما', restaurant: 'منوی ما', realestate: 'املاک موجود' };
      var ic = isProductTpl(tpl) ? labels().icon : '📦';
      return '<div class="ps-products"><h2>' + (titles[tpl] || 'محصولات') + '</h2><div class="ps-products-grid">' +
        (items.length ? items.map(function (p) { return productCardHtml(p, ic); }).join('')
          : '<div class="ps-empty" style="grid-column:1/-1">' + ic + ' هنوز آیتمی اضافه نکرده‌ای</div>') + '</div></div>';
    }
    function servicesHtml() {
      if ((EDITOR.services || []).length) return listHtml('services');
      if (isProductTpl(tpl)) return '';
      return '<div class="ps-features">' + [1, 2, 3].map(function (n) {
        return '<div class="ps-feat"><div class="ps-feat-icon">' + (esc(EDITOR['feat' + n + 'Icon']) || '⚡') + '</div><h3>' + esc(EDITOR['feat' + n + 'Title']) + '</h3><p>' + esc(EDITOR['feat' + n + 'Desc']) + '</p></div>';
      }).join('') + '</div>';
    }
    function listHtml(key) {
      var arr = (EDITOR[SECTION_LIST[key]] || []).filter(function (x) { return !x.draft; });
      if (!arr.length) return '';
      var first = { services: 'title', gallery: 'caption', team: 'name', faq: 'q', testimonials: 'name', articles: 'title', podcast: 'title' }[key];
      var second = { services: 'desc', gallery: '', team: 'role', faq: 'a', testimonials: 'text', articles: 'summary', podcast: 'desc' }[key];
      return '<div class="ps-products alt"><h2>' + esc(SECTION_META[key].label) + '</h2>' + arr.slice(0, 4).map(function (x) {
        return '<div class="ps-article"><b>' + esc(x[first] || '—') + '</b>' + (second && x[second] ? '<span>' + esc(x[second]) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    var contactHtml = '<div class="ps-contact"><h2>تماس با ما</h2><div>📧 ' + esc(EDITOR.contactEmail) + '</div><div>📱 ' + esc(EDITOR.contactPhone) + '</div><div>📍 ' + esc(EDITOR.contactAddress) + '</div></div>';
    (EDITOR.sections || []).forEach(function (sec) {
      if (!sec.on) return;
      if (sec.key === 'hero') html += heroHtml;
      else if (sec.key === 'products') html += productsHtml();
      else if (sec.key === 'services') html += servicesHtml();
      else if (sec.key === 'booking') html += '<div class="ps-products alt"><h2>رزرو وقت</h2><div class="ps-empty">📅 برای رزرو با ما تماس بگیرید</div></div>';
      else if (sec.key === 'contact') html += contactHtml;
      else html += listHtml(sec.key);
    });
    html += '<div class="ps-footer">© ' + new Date().getFullYear() + ' ' + (esc(EDITOR.siteName) || esc(site.name)) + '</div>';
    el.innerHTML = html;
  }

  /* ---------- شروع ---------- */
  function start(page, opts) {
    opts = opts || {};
    document.body.dataset.page = page;
    if (!SITE_ID) { alert('شناسه سایت مشخص نیست'); redirect('dashboard.html'); return Promise.resolve(); }
    return API.get((ADMIN ? '/api/admin/sites/' : '/api/sites/') + encodeURIComponent(SITE_ID)).then(function (r) {
      site = r.site;
      DEFAULTS = buildDefaults();
      EDITOR = Object.assign({}, DEFAULTS, r.editor || {});
      if (!Array.isArray(EDITOR.products)) EDITOR.products = [];
      if (!Array.isArray(EDITOR.sections) || !EDITOR.sections.length) EDITOR.sections = DEFAULTS.sections;
      Object.keys(SECTION_LIST).forEach(function (k) { if (!Array.isArray(EDITOR[SECTION_LIST[k]])) EDITOR[SECTION_LIST[k]] = []; });
      if (!Array.isArray(EDITOR.pages)) EDITOR.pages = [];
      snapshotJson = currentJson();

      if (opts.needsProducts && !isProductTpl()) { redirect(url('site-editor.html')); return; }

      buildShell(page, opts);
      bind(document.getElementById('edForms'));
      renderPreview();
      window.addEventListener('beforeunload', function (e) { if (dirty && !ADMIN) { e.preventDefault(); e.returnValue = ''; } });
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          if (opts.onSaveShortcut) opts.onSaveShortcut(); else if (opts.save !== false) save().catch(function () {});
        }
      });
      if (opts.ready) opts.ready(api);
    }).catch(function (e) {
      if (e && e.__redirected) return;
      if (e && e.status === 401) { redirect(ADMIN ? 'admin-login.html' : 'login.html?next=dashboard.html'); return; }
      if (e && e.status === 404) { alert('این سایت پیدا نشد یا متعلق به شما نیست'); redirect(ADMIN ? 'admin.html' : 'dashboard.html'); return; }
      console.error(e);
      var root = document.getElementById('editorRoot');
      root.innerHTML = '<div class="ed-fatal">' + esc((e && e.message) || 'خطا در بارگذاری صفحه') + '</div>';
    });
  }

  var api = {
    start: start, bind: bind, save: save, upload: upload, toast: toast, touch: touch,
    renderPreview: renderPreview, refreshChrome: refreshChrome,
    esc: esc, toLatin: toLatin, fmtMoney: fmtMoney, safeImg: safeImg, url: url, redirect: redirect,
    SECTION_META: SECTION_META, SECTION_LIST: SECTION_LIST, isProductTpl: isProductTpl, labels: labels, productCardHtml: productCardHtml,
    get editor() { return EDITOR; },
    get defaults() { return DEFAULTS; },
    get site() { return site; },
    get readOnly() { return ADMIN; },
    get dirty() { return dirty; },
    markClean: function () { snapshotJson = currentJson(); dirty = false; paintSaveState(); },
    resetAll: function () {
      var keep = { products: EDITOR.products, template: EDITOR.template, sections: EDITOR.sections, pages: EDITOR.pages };
      Object.keys(SECTION_LIST).forEach(function (k) { keep[SECTION_LIST[k]] = EDITOR[SECTION_LIST[k]]; });
      EDITOR = Object.assign({}, DEFAULTS, keep);
      touch();
    }
  };
  window.Editor = api;
})();
