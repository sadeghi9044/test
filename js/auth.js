/* ورود / ثبت‌نام با شماره موبایل و کد پیامکی */
(function () {
  const MODE = document.body.dataset.mode; // login | signup
  const $ = (id) => document.getElementById(id);
  const phoneForm = $('phoneForm'), codeForm = $('codeForm'), msg = $('authMessage');
  let phone = '', resendLeft = 0, timerId = null, needName = false;

  function nextUrl() {
    const n = new URLSearchParams(location.search).get('next');
    return n && /^[a-z0-9\-]+\.html(\?(plan|pay)=[A-Za-z0-9\-]{1,30})?$/i.test(n) ? n : 'dashboard.html';
  }
  function show(text, type) { msg.textContent = text; msg.className = 'auth-message ' + (type || 'error'); }
  function hide() { msg.className = 'auth-message'; msg.textContent = ''; }
  function fieldError(id, on) {
    const el = $(id); if (el) el.classList.toggle('error', !!on);
    const er = document.querySelector('.auth-field-error[data-for="' + id + '"]');
    if (er) er.classList.toggle('show', !!on);
  }
  function clearErrors() {
    document.querySelectorAll('.auth-field input').forEach((i) => i.classList.remove('error'));
    document.querySelectorAll('.auth-field-error').forEach((e) => e.classList.remove('show'));
  }
  const toLatin = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  function validPhone(v) {
    let p = toLatin(v).replace(/[\s\-()]/g, '');
    if (p.startsWith('+98')) p = '0' + p.slice(3); else if (p.startsWith('0098')) p = '0' + p.slice(4);
    else if (/^98\d{10}$/.test(p)) p = '0' + p.slice(2); else if (/^9\d{9}$/.test(p)) p = '0' + p;
    return /^09\d{9}$/.test(p) ? p : null;
  }

  function startTimer(sec) {
    resendLeft = sec; clearInterval(timerId);
    const btn = $('resendBtn'), t = $('resendTimer');
    const tick = () => {
      if (resendLeft > 0) { btn.disabled = true; t.textContent = '(' + resendLeft.toLocaleString('fa-IR') + ' ثانیه)'; resendLeft--; }
      else { btn.disabled = false; t.textContent = ''; clearInterval(timerId); }
    };
    tick(); timerId = setInterval(tick, 1000);
  }

  function goStep(n) {
    phoneForm.hidden = n !== 1; codeForm.hidden = n !== 2;
    if (n === 2) { $('cd-code').value = ''; $('cd-code').focus(); }
    else { clearInterval(timerId); $('ph-phone').focus(); }
  }

  async function requestCode() {
    $('sendBtn').disabled = true;
    try {
      const r = await API.post('/api/auth/request-otp', { phone: phone });
      $('sentTo').textContent = phone;
      goStep(2); startTimer(r.resendIn || 60);
      if (r.devCode) show('حالت توسعه — کد تأیید: ' + r.devCode, 'success');
      else show('کد تأیید پیامک شد.', 'success');
      return true;
    } catch (e) {
      if (e.status === 429 && e.data && e.data.retryAfter) { $('sentTo').textContent = phone; goStep(2); startTimer(e.data.retryAfter); }
      show(e.message); return false;
    } finally { $('sendBtn').disabled = false; }
  }

  phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault(); hide(); clearErrors();
    const p = validPhone($('ph-phone').value);
    let bad = false;
    if (!p) { fieldError('ph-phone', true); bad = true; }
    if (MODE === 'signup') {
      if ($('ph-name').value.trim().length < 2) { fieldError('ph-name', true); bad = true; }
      if (!$('ph-terms').checked) { show('برای ادامه باید قوانین را بپذیری.'); bad = true; }
    }
    if (bad) return;
    phone = p;
    await requestCode();
  });

  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault(); hide(); clearErrors();
    const code = toLatin($('cd-code').value).replace(/\D/g, '');
    if (code.length !== 6) { fieldError('cd-code', true); return; }
    const body = { phone: phone, code: code };
    const name = MODE === 'signup' ? $('ph-name').value.trim() : ($('cd-name').value || '').trim();
    if (name) body.name = name;
    if (needName && name.length < 2) { fieldError('cd-name', true); return; }
    $('verifyBtn').disabled = true;
    try {
      await API.post('/api/auth/verify-otp', body);
      show('✓ ورود موفق. در حال انتقال…', 'success');
      setTimeout(() => { location.href = nextUrl(); }, 500);
    } catch (err) {
      $('verifyBtn').disabled = false;
      if (err.status === 422 && err.data.needName) {
        needName = true; $('lateNameWrap').hidden = false; $('cd-name').focus();
        $('authTitle').textContent = 'ساخت حساب جدید';
        show('این شماره هنوز حساب ندارد. برای ساخت حساب، نامت را وارد کن.', 'success');
      } else {
        show(err.message);
        if (err.data && err.data.expired) { $('cd-code').value = ''; }
      }
    }
  });

  $('resendBtn').addEventListener('click', async () => { hide(); $('resendBtn').disabled = true; await requestCode(); });
  $('editPhoneBtn').addEventListener('click', () => { hide(); needName = false; $('lateNameWrap').hidden = true; goStep(1); });
  document.querySelectorAll('.auth-field input').forEach((input) => {
    input.addEventListener('input', () => fieldError(input.id, false));
  });
  $('cd-code').addEventListener('input', (e) => {
    const v = toLatin(e.target.value).replace(/\D/g, '').slice(0, 6);
    e.target.value = v;
  });

  // اگر قبلاً وارد شده، مستقیم برو
  API.get('/api/me').then(() => { location.replace(nextUrl()); }).catch(() => {});
})();
