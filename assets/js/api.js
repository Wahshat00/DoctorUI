(() => {
  const base = () => (window.APP_CONFIG?.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  async function request(path, options = {}) {
    let response;
    try { response = await fetch(`${base()}${path}`, { ...options, headers: { ...(options.body === undefined ? {} : {"Content-Type":"application/json"}), ...(options.headers || {}) } }); }
    catch { throw new Error("اتصال به سرور برقرار نشد. اجرای FastAPI و تنظیم CORS را بررسی کنید."); }
    const raw = response.status === 204 ? "" : await response.text();
    let data = null; if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }
    if (!response.ok) {
      let detail = data?.detail;
      if (Array.isArray(detail)) detail = detail.map(x => `${(x.loc || []).join(".")}: ${x.msg}`).join(" | ");
      throw new Error(typeof detail === "string" ? detail : `درخواست ناموفق بود (HTTP ${response.status})`);
    }
    return data;
  }
  window.API = {
    get: path => request(path),
    post: (path, body) => request(path, {method:"POST", body:JSON.stringify(body)}),
    patch: (path, body) => request(path, {method:"PATCH", body:JSON.stringify(body)}),
    delete: (path, body) => request(path, {method:"DELETE", ...(body === undefined ? {} : {body:JSON.stringify(body)})})
  };
})();
