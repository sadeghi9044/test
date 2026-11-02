/* کلاینت ساده‌ی API — کوکی سشن به‌صورت خودکار (HttpOnly) فرستاده می‌شود */
(function () {
  async function request(method, url, body) {
    const opts = { method: method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try { res = await fetch(url, opts); }
    catch (e) {
      const err = new Error('ارتباط با سرور برقرار نشد. اینترنت یا سرور را بررسی کن.');
      err.network = true; throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((data && data.error) || 'خطایی رخ داد (' + res.status + ')');
      err.status = res.status; err.data = data || {};
      throw err;
    }
    return data;
  }

  // ارسال فایل خام (تصویر) — بدون multipart
  async function upload(url, file) {
    let res;
    try {
      res = await fetch(url, { method: 'POST', credentials: 'same-origin', body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' } });
    } catch (e) {
      const err = new Error('ارتباط با سرور برقرار نشد. اینترنت یا سرور را بررسی کن.'); err.network = true; throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((data && data.error) || (res.status === 413 ? 'حجم فایل زیاد است (حداکثر ۵ مگابایت).' : 'خطایی رخ داد (' + res.status + ')'));
      err.status = res.status; err.data = data || {};
      throw err;
    }
    return data;
  }

  window.API = {
    upload: upload,
    get: function (u) { return request('GET', u); },
    post: function (u, b) { return request('POST', u, b === undefined ? {} : b); },
    put: function (u, b) { return request('PUT', u, b); },
    patch: function (u, b) { return request('PATCH', u, b); },
    del: function (u) { return request('DELETE', u); }
  };

  /* اجرای اسکریپت اصلی صفحه بعد از آماده شدن داده‌ی اولیه:
     اسکریپت اصلی با type="text/plain" و id نوشته می‌شود و اینجا در scope سراسری اجرا می‌شود
     (تا onclickهای inline و توابع سراسری مثل قبل کار کنند). */
  window.Boot = {
    run: async function (scriptId, loader) {
      try {
        window.__BOOT = await loader();
      } catch (e) {
        if (e && e.__redirected) return;
        console.error(e);
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#f0f0ff;font-family:Vazirmatn,sans-serif;padding:24px;text-align:center;z-index:99999';
        box.textContent = (e && e.message) || 'خطا در بارگذاری صفحه';
        document.body.appendChild(box);
        return;
      }
      const tpl = document.getElementById(scriptId);
      const s = document.createElement('script');
      s.textContent = tpl.textContent;
      document.body.appendChild(s);
    },
    redirect: function (url) {
      window.location.href = url;
      const e = new Error('redirect'); e.__redirected = true; return e;
    }
  };
})();
