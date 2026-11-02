/* ویزارد ۶ مرحله‌ای ساخت سایت؛ ذخیره‌ی خودکار پیش‌نویس روی سرور */
(function () {
  'use strict';
  var TYPES = [['business', '💼 کسب‌وکار'], ['shop', '🛍️ فروشگاه'], ['portfolio', '🎨 نمونه‌کار'], ['blog', '📝 وبلاگ'], ['restaurant', '🍽️ رستوران'], ['realestate', '🏠 املاک']];
  var GOALS = [['sell', '🛒 فروش آنلاین'], ['booking', '📅 دریافت رزرو'], ['introduce', '🏢 معرفی کسب‌وکار'], ['leads', '📞 جذب مشتری (تماس)'], ['content', '✍️ انتشار محتوا']];
  var TONES = [['friendly', 'صمیمی'], ['formal', 'رسمی'], ['energetic', 'پرانرژی']];
  var FEATS = [['hero', 'بنر اصلی (همیشه روشن)'], ['products', 'محصولات'], ['services', 'خدمات'], ['gallery', 'گالری'], ['team', 'تیم'], ['faq', 'سوالات متداول'], ['testimonials', 'نظر مشتریان'], ['articles', 'مقالات'], ['podcast', 'پادکست'], ['booking', 'رزرو'], ['contact', 'تماس']];
  var GOAL_FEATS = { sell: ['products'], booking: ['booking', 'services'], introduce: ['services', 'team'], leads: ['contact', 'faq'], content: ['articles'] };

  var $ = function (id) { return document.getElementById(id); };
  var S = { step: 1, d: { businessName: '', businessType: '', description: '', subdomain: '', items: [], goal: '', features: {}, tone: 'friendly', phone: '', email: '', address: '', logo: '', primaryColor: '#8b5cf6', secondaryColor: '#ec4899' } };
  var saveTimer, subTimer, subOk = null, busy = false;

  $('suffix').textContent = '.' + (window.BASE_DOMAIN || 'yoursite.com');

  function err(m) { $('err').textContent = m || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function labelOf(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return '—'; }

  /* ---------- ذخیره ---------- */
  function save(now) {
    clearTimeout(saveTimer);
    $('saveState').textContent = 'در حال ذخیره…';
    var run = function () {
      return API.put('/api/onboarding/draft', { step: S.step, data: S.d })
        .then(function () { $('saveState').textContent = '✓ پیش‌نویس ذخیره شد'; })
        .catch(function () { $('saveState').textContent = 'ذخیره نشد؛ اینترنت را بررسی کن'; });
    };
    if (now) return run();
    saveTimer = setTimeout(run, 600);
  }

  /* ---------- گزینه‌ها ---------- */
  function opts(boxId, list, key, after) {
    var box = $(boxId); box.innerHTML = '';
    list.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'wz-opt'; b.textContent = o[1]; b.dataset.v = o[0];
      b.addEventListener('click', function () { S.d[key] = o[0]; paintOpts(boxId, key); if (after) after(o[0]); save(); });
      box.appendChild(b);
    });
    paintOpts(boxId, key);
  }
  function paintOpts(boxId, key) {
    Array.prototype.forEach.call($(boxId).children, function (b) { b.classList.toggle('on', b.dataset.v === S.d[key]); });
  }

  /* ---------- مرحله ۱: زیردامنه ---------- */
  function checkSub() {
    var v = S.d.subdomain, h = $('subHint');
    subOk = null;
    if (!v) { h.textContent = ''; return; }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(v)) { h.className = 'wz-hint bad'; h.textContent = '۳ تا ۳۰ کاراکتر: حروف کوچک انگلیسی، عدد و خط تیره (نه در ابتدا یا انتها)'; subOk = false; return; }
    h.className = 'wz-hint'; h.textContent = 'در حال بررسی…';
    clearTimeout(subTimer);
    subTimer = setTimeout(function () {
      API.get('/api/onboarding/subdomain?s=' + encodeURIComponent(v)).then(function (r) {
        if (v !== S.d.subdomain) return;
        subOk = r.available; h.className = 'wz-hint ' + (r.available ? 'ok' : 'bad'); h.textContent = r.message;
      }).catch(function () { h.textContent = ''; });
    }, 400);
  }

  /* ---------- مرحله ۲: آیتم‌ها ---------- */
  function paintItems() {
    var box = $('items'); box.innerHTML = '';
    S.d.items.forEach(function (it, i) {
      var r = document.createElement('div'); r.className = 'wz-row';
      r.innerHTML = '<input type="text" placeholder="نام" maxlength="100" value="' + esc(it.name) + '">' +
        '<input type="text" inputmode="numeric" placeholder="قیمت (تومان)" value="' + esc(it.price || '') + '">' +
        '<input type="text" placeholder="توضیح کوتاه" maxlength="300" value="' + esc(it.desc) + '">' +
        '<button type="button" class="btn btn-ghost" aria-label="حذف">✕</button>';
      var inp = r.querySelectorAll('input');
      inp[0].addEventListener('input', function () { it.name = inp[0].value; save(); });
      inp[1].addEventListener('input', function () { it.price = inp[1].value; save(); });
      inp[2].addEventListener('input', function () { it.desc = inp[2].value; save(); });
      r.querySelector('button').addEventListener('click', function () { S.d.items.splice(i, 1); paintItems(); save(); });
      box.appendChild(r);
    });
    $('addItem').style.display = S.d.items.length >= 10 ? 'none' : '';
  }

  /* ---------- مرحله ۴: سوییچ‌ها ---------- */
  function applyGoalDefaults() {
    var f = {}; FEATS.forEach(function (x) { f[x[0]] = false; });
    f.hero = true; f.contact = true;
    if (S.d.businessType === 'shop' || S.d.businessType === 'restaurant' || S.d.businessType === 'realestate') f.products = true;
    if (S.d.businessType === 'portfolio') f.gallery = true;
    if (S.d.businessType === 'blog') f.articles = true;
    if (S.d.businessType === 'business') f.services = true;
    (GOAL_FEATS[S.d.goal] || []).forEach(function (k) { f[k] = true; });
    S.d.features = f;
  }
  function paintSwitches() {
    var box = $('switches'); box.innerHTML = '';
    FEATS.forEach(function (x) {
      var row = document.createElement('label'); row.className = 'wz-sw';
      var on = x[0] === 'hero' ? true : !!S.d.features[x[0]];
      row.innerHTML = '<span>' + x[1] + '</span><input type="checkbox"' + (on ? ' checked' : '') + (x[0] === 'hero' ? ' disabled' : '') + '>';
      row.querySelector('input').addEventListener('change', function (e) { S.d.features[x[0]] = e.target.checked; save(); });
      box.appendChild(row);
    });
  }

  /* ---------- مرحله ۵: پیش‌نمایش و لوگو ---------- */
  function paintPreview() {
    var p = $('prev');
    p.style.background = 'linear-gradient(135deg,' + S.d.primaryColor + ',' + S.d.secondaryColor + ')';
    $('prevLogo').innerHTML = S.d.logo ? '<img src="' + esc(S.d.logo) + '" alt="" style="height:40px;border-radius:6px">' : '◆ ' + esc(S.d.businessName || 'نام سایت');
    $('prevTag').textContent = { friendly: 'با ما راحت‌تر است', formal: 'تخصص، اعتماد و کیفیت', energetic: 'همین امروز شروع کن!' }[S.d.tone];
    $('prevBtn').textContent = { sell: 'مشاهده‌ی محصولات', booking: 'رزرو وقت', introduce: 'بیشتر بدانید', leads: 'تماس بگیرید', content: 'خواندن مطالب' }[S.d.goal] || 'شروع کنیم';
  }
  $('logoFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    $('logoHint').className = 'wz-hint'; $('logoHint').textContent = 'در حال آپلود…';
    API.upload('/api/upload', f).then(function (r) {
      S.d.logo = r.url; $('logoHint').className = 'wz-hint ok'; $('logoHint').textContent = '✓ لوگو آپلود شد'; paintPreview(); save();
    }).catch(function (er) { $('logoHint').className = 'wz-hint bad'; $('logoHint').textContent = er.message; });
  });

  /* ---------- مرحله ۶: مرور ---------- */
  function paintSummary() {
    var on = FEATS.filter(function (x) { return x[0] === 'hero' || S.d.features[x[0]]; }).map(function (x) { return x[1].replace(' (همیشه روشن)', ''); });
    var rows = [['نام', S.d.businessName], ['نوع', labelOf(TYPES, S.d.businessType)], ['آدرس', S.d.subdomain + '.' + (window.BASE_DOMAIN || 'yoursite.com')],
      ['محصولات و خدمات', S.d.items.filter(function (i) { return i.name.trim(); }).length ? S.d.items.filter(function (i) { return i.name.trim(); }).length + ' مورد' : 'نمونه‌ی ویرایش‌شدنی'],
      ['هدف', labelOf(GOALS, S.d.goal)], ['بخش‌ها', on.join('، ')], ['لحن', labelOf(TONES.map(function (t) { return [t[0], t[1]]; }), S.d.tone)],
      ['تلفن', S.d.phone || '—'], ['ایمیل', S.d.email || '—']];
    $('summary').innerHTML = rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
  }

  /* ---------- ناوبری ---------- */
  function validate(step) {
    if (step === 1) {
      if (S.d.businessName.trim().length < 2) return 'نام کسب‌وکار را وارد کن.';
      if (!S.d.businessType) return 'نوع کسب‌وکار را انتخاب کن.';
      if (subOk === false) return 'آدرس سایت قابل استفاده نیست.';
      if (!S.d.subdomain || subOk === null) return 'یک آدرس معتبر برای سایت انتخاب کن و صبر کن بررسی شود.';
    }
    if (step === 3 && !S.d.goal) return 'هدف سایت را انتخاب کن.';
    if (step === 5 && S.d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.d.email)) return 'ایمیل معتبر وارد کن.';
    return '';
  }
  function show(n) {
    S.step = n; err('');
    Array.prototype.forEach.call(document.querySelectorAll('.wz-step'), function (el) { el.classList.toggle('show', +el.dataset.s === n); });
    Array.prototype.forEach.call($('bar').children, function (b, i) { b.classList.toggle('on', i < n); });
    $('prevBtn2').style.visibility = n === 1 ? 'hidden' : 'visible';
    $('nextBtn').textContent = n === 6 ? '🚀 ساخت سایت' : 'بعدی';
    if (n === 4) paintSwitches();
    if (n === 5) paintPreview();
    if (n === 6) paintSummary();
    window.scrollTo({ top: 0 });
  }
  $('prevBtn2').addEventListener('click', function () { if (S.step > 1) { show(S.step - 1); save(true); } });
  $('nextBtn').addEventListener('click', function () {
    if (busy) return;
    var m = validate(S.step); if (m) return err(m);
    if (S.step === 3 && !Object.keys(S.d.features).length) applyGoalDefaults();
    if (S.step < 6) { show(S.step + 1); return save(true); }
    busy = true; $('nextBtn').disabled = true; err('');
    API.put('/api/onboarding/draft', { step: 6, data: S.d }).then(function () {
      return API.post('/api/onboarding/submit', { data: S.d });
    }).then(function (r) { location.href = 'building.html?id=' + encodeURIComponent(r.buildId); })
      .catch(function (e) { busy = false; $('nextBtn').disabled = false; err(e.message); });
  });

  /* ---------- اتصال فیلدها ---------- */
  [['businessName', 'input'], ['description', 'input'], ['phone', 'input'], ['email', 'input'], ['address', 'input'], ['primaryColor', 'input'], ['secondaryColor', 'input']].forEach(function (f) {
    $(f[0]).addEventListener(f[1], function () { S.d[f[0]] = $(f[0]).value; paintPreview(); save(); });
  });
  $('subdomain').addEventListener('input', function () { S.d.subdomain = $('subdomain').value.trim().toLowerCase(); checkSub(); save(); });
  $('addItem').addEventListener('click', function () { S.d.items.push({ name: '', price: '', desc: '' }); paintItems(); save(); });

  function fill() {
    ['businessName', 'description', 'phone', 'email', 'address', 'subdomain', 'primaryColor', 'secondaryColor'].forEach(function (k) { $(k).value = S.d[k] || ''; });
    opts('typeOpts', TYPES, 'businessType'); opts('goalOpts', GOALS, 'goal', function () { applyGoalDefaults(); });
    opts('toneOpts', TONES, 'tone', paintPreview);
    paintItems(); paintPreview();
    if (S.d.subdomain) checkSub();
  }

  API.get('/api/onboarding/draft').then(function (r) {
    if (r.draft) {
      Object.keys(r.draft.data).forEach(function (k) { S.d[k] = r.draft.data[k]; });
      S.step = Math.min(6, Math.max(1, r.draft.step));
    }
    fill(); show(S.step);
  }).catch(function (e) {
    if (e.status === 401) return location.replace('login.html?next=wizard.html');
    fill(); show(1);
  });
})();
