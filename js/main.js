if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============ AUTO ACTIVE NAV LINK ============ */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href && href === path) a.classList.add('active');
  });
})();

/* ============ NAVBAR SCROLL ============ */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}

/* ============ MOBILE MENU ============ */
const mobileToggle = document.getElementById('mobileToggle');
const navLinksEl = document.getElementById('navLinks');
if (mobileToggle && navLinksEl) {
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('open');
    navLinksEl.classList.toggle('open');
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileToggle.classList.remove('open');
      navLinksEl.classList.remove('open');
    });
  });
}

/* ============ SCROLL TO TOP ============ */
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============ PROGRESS BAR ============ */
if (document.querySelector('.progress-bar') && window.gsap) {
  gsap.to('.progress-bar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
  });
}

/* ============ HERO INTRO (CSS-based, no gsap needed - lighter) ============ */
if (document.querySelector('.hero-title') && window.gsap) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.badge', { y: 20, opacity: 0, duration: 0.6 })
    .from('.hero-title', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
    .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
    .from('.hero-btns', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4');
}

/* ============ HERO GLOW PARALLAX (desktop only, light) ============ */
if (window.gsap && window.matchMedia('(pointer: fine)').matches && document.querySelector('.g1')) {
  const g1x = gsap.quickTo('.g1', 'x', { duration: 1.5, ease: 'power2.out' });
  const g1y = gsap.quickTo('.g1', 'y', { duration: 1.5, ease: 'power2.out' });
  const g2x = gsap.quickTo('.g2', 'x', { duration: 1.5, ease: 'power2.out' });
  const g2y = gsap.quickTo('.g2', 'y', { duration: 1.5, ease: 'power2.out' });
  const g3x = gsap.quickTo('.g3', 'x', { duration: 1.5, ease: 'power2.out' });
  const g3y = gsap.quickTo('.g3', 'y', { duration: 1.5, ease: 'power2.out' });

  let rafId = null;
  document.addEventListener('mousemove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      g1x(x * 1.5); g1y(y * 1.5);
      g2x(-x);      g2y(-y);
      g3x(x * 0.5); g3y(y * 0.5);
      rafId = null;
    });
  });
}

/* ============ FADE-UP ON SCROLL ============ */
if (window.gsap) {
  gsap.utils.toArray('.fade-up').forEach(el => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });
}

/* ============ FEATURE CARDS STAGGER ============ */
if (document.querySelector('.feature-card') && window.gsap) {
  gsap.from('.feature-card', {
    y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.features-grid', start: 'top 85%', once: true }
  });
}

/* ============ TIMELINE ============ */
if (document.querySelector('.timeline-line') && window.gsap) {
  gsap.to('.timeline-line', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: 0.5 }
  });

  document.querySelectorAll('.step').forEach(step => {
    gsap.from(step, {
      x: 40, opacity: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: step, start: 'top 85%', once: true }
    });
  });
}

/* ============ COUNTERS ============ */
if (window.gsap) {
  gsap.utils.toArray('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => { el.textContent = Math.floor(obj.v).toLocaleString('fa-IR'); }
    });
  });
}

/* ============ HORIZONTAL SCROLL (Native + Drag) ============ */
const hWrap = document.querySelector('.horizontal-wrap');
if (hWrap) {
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;
  let hasDragged = false;

  hWrap.addEventListener('mousedown', (e) => {
    isDown = true;
    hasDragged = false;
    hWrap.classList.add('dragging');
    startX = e.pageX - hWrap.offsetLeft;
    scrollStart = hWrap.scrollLeft;
  });

  hWrap.addEventListener('mouseleave', () => {
    isDown = false;
    hWrap.classList.remove('dragging');
  });

  hWrap.addEventListener('mouseup', () => {
    isDown = false;
    hWrap.classList.remove('dragging');
  });

  hWrap.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    hasDragged = true;
    const x = e.pageX - hWrap.offsetLeft;
    const walk = (x - startX) * 1.5;
    hWrap.scrollLeft = scrollStart - walk;
  });

  // جلوگیری از باز شدن لینک اگه کاربر drag کرده
  hWrap.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', (e) => {
      if (hasDragged) e.preventDefault();
    });
  });
}

/* ============ DEMO INTERACTION ============ */
const preview = document.getElementById('preview');
if (preview) {
  const templates = {
    business: `
      <div class="mini-nav"><div class="mini-logo">شرکت من</div><div class="mini-links"><span>خانه</span><span>خدمات</span><span>تماس</span></div></div>
      <div class="mini-hero"><h3>به شرکت من خوش آمدید</h3><p>ما بهترین خدمات را به شما ارائه می‌دهیم.</p><button class="mini-btn">شروع کنیم</button></div>
      <div class="mini-features">
        <div class="mini-feat"><div class="mini-dot"></div><span>ویژگی اول</span></div>
        <div class="mini-feat"><div class="mini-dot"></div><span>ویژگی دوم</span></div>
        <div class="mini-feat"><div class="mini-dot"></div><span>ویژگی سوم</span></div>
      </div>`,
    shop: `
      <div class="mini-nav"><div class="mini-logo">فروشگاه</div><div class="mini-links"><span>محصولات</span><span>درباره</span><span>سبد</span></div></div>
      <div class="mini-hero"><h3>خرید آسان و سریع</h3><p>محصولات با کیفیت، ارسال رایگان.</p></div>
      <div class="mini-products">
        <div class="mini-product"><div class="mini-product-img"></div><div class="mini-product-name">محصول ۱</div><div class="mini-product-price">۲۹۹,۰۰۰</div></div>
        <div class="mini-product"><div class="mini-product-img"></div><div class="mini-product-name">محصول ۲</div><div class="mini-product-price">۴۵۰,۰۰۰</div></div>
        <div class="mini-product"><div class="mini-product-img"></div><div class="mini-product-name">محصول ۳</div><div class="mini-product-price">۱۹۹,۰۰۰</div></div>
      </div>`,
    portfolio: `
      <div class="mini-nav"><div class="mini-logo">علی احمدی</div><div class="mini-links"><span>کارها</span><span>درباره</span><span>تماس</span></div></div>
      <div class="mini-hero"><h3>سلام، من علی هستم</h3><p>طراح گرافیک و عکاس.</p><button class="mini-btn">مشاهده کارها</button></div>
      <div class="mini-gallery">
        <div class="mini-gallery-item"></div><div class="mini-gallery-item"></div>
        <div class="mini-gallery-item"></div><div class="mini-gallery-item"></div>
      </div>`
  };

  let currentTemplate = 'business';
  let currentColor = '#8b5cf6';

  function renderPreview() {
    preview.style.setProperty('--pc', currentColor);
    preview.innerHTML = templates[currentTemplate];
  }

  document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplate = btn.dataset.template;
      renderPreview();
    });
  });

  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      currentColor = sw.dataset.color;
      preview.style.setProperty('--pc', currentColor);
    });
  });

  renderPreview();
}

/* ============ FAQ ACCORDION ============ */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (q) q.addEventListener('click', () => item.classList.toggle('open'));
});

/* ============ CONTACT FORM ============ */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('form-status');
    const fd = new FormData(contactForm);
    const payload = {
      name: fd.get('name'), email: fd.get('_replyto') || fd.get('email'),
      subject: fd.get('subject'), message: fd.get('message')
    };
    status.className = 'form-status';
    status.textContent = 'در حال ارسال...';
    status.style.display = 'block';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        status.className = 'form-status success';
        status.textContent = '✓ پیام شما با موفقیت ارسال شد. به زودی پاسخ می‌دهیم.';
        contactForm.reset();
      } else {
        status.className = 'form-status error';
        status.textContent = '✗ ' + (data.error || 'خطا در ارسال. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = '✗ ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';
    }
  });
}

/* ============ AUTH STATE IN NAVBAR ============ */
(function () {
  const navAuth = document.querySelector('.nav-auth');
  if (!navAuth) return;
  fetch('/api/me', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d || !d.user) return;
    const name = String(d.user.name || '');
    const firstName = name.split(' ')[0];
    navAuth.textContent = '';
    const a = document.createElement('a');
    a.href = 'dashboard.html';
    a.className = 'btn btn-ghost nav-cta-login';
    a.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const av = document.createElement('span');
    av.style.cssText = 'width:26px;height:26px;border-radius:50%;background:var(--grad);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;color:white;';
    av.textContent = firstName.charAt(0);
    a.appendChild(av);
    a.appendChild(document.createTextNode(firstName));
    const out = document.createElement('a');
    out.href = '#'; out.className = 'btn btn-primary nav-cta'; out.id = 'logoutBtn'; out.textContent = 'خروج';
    navAuth.appendChild(a); navAuth.appendChild(out);
    out.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('از حساب کاربری خارج می‌شوی؟')) {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' })
          .finally(() => window.location.reload());
      }
    });
  }).catch(() => {});
})();
