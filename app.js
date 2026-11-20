
(() => {
  const API = (window.APP_CONFIG?.API_BASE_URL || "https://doctor-website-backend.fastapicloud.dev").replace(/\/$/, "");
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  let doctorsCache = [];
  let toastTimer;

  const questions = [
    "کم‌شدن علاقه یا لذت بردن از انجام کارها",
    "احساس ناراحتی، افسردگی یا ناامیدی",
    "مشکل در به‌خواب‌رفتن، خواب ماندن یا خوابیدن بیش از حد",
    "احساس خستگی یا کمبود انرژی",
    "کم‌اشتهایی یا پرخوری",
    "احساس بد نسبت به خود؛ یا اینکه فردی شکست‌خورده هستی یا خانواده‌ات را ناامید کرده‌ای",
    "مشکل در تمرکز روی کارهایی مانند مطالعه یا تماشای تلویزیون",
    "کندی در حرکت یا صحبت، یا برعکس بی‌قراری و تحرک بیش از معمول",
    "فکر اینکه بهتر بود مرده بودی یا فکر آسیب‌زدن به خودت"
  ];

  const severityNames = {
    "Minimal": "حداقل",
    "Mild": "خفیف",
    "Moderate": "متوسط",
    "Moderately Severe": "نسبتاً شدید",
    "Severe": "شدید"
  };

  const severityDescriptions = {
    "Minimal": "پاسخ‌های شما نشان‌دهنده سطح حداقلی از نشانه‌های بررسی‌شده هستند.",
    "Mild": "برخی نشانه‌های خفیف در پاسخ‌های شما مشاهده شده‌اند.",
    "Moderate": "پاسخ‌های شما نشان‌دهنده نشانه‌هایی با شدت متوسط هستند.",
    "Moderately Severe": "پاسخ‌های شما نشان‌دهنده نشانه‌هایی با شدت نسبتاً زیاد هستند.",
    "Severe": "پاسخ‌های شما نشان‌دهنده نشانه‌هایی با شدت زیاد هستند."
  };

  function notify(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  async function api(path, options={}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? {"Content-Type":"application/json"} : {}),
        ...(options.headers || {})
      }
    });

    const raw = await response.text();
    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!response.ok) {
      const detail = data?.detail;
      const message = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map(x => x.msg).join("، ")
          : JSON.stringify(data) || `خطای سرور (${response.status})`;

      throw new Error(message);
    }

    return data;
  }

  function page(name) {
    $$(".page").forEach(p => p.classList.toggle("active", p.id === `page-${name}`));
    $$(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.page === name));

    $("#mainNav").classList.remove("open");
    window.scrollTo({top:0, behavior:"smooth"});

    if (name === "doctors") loadDoctors();
    if (name === "admin") {
      loadAdminDoctors();
      loadAppointments();
    }
  }

  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (btn) {
      e.preventDefault();
      page(btn.dataset.page);
    }
  });

  $("#menuToggle").addEventListener("click", () => {
    $("#mainNav").classList.toggle("open");
  });

  function renderQuestions() {
    $("#questionsList").innerHTML = questions.map((q,i) => `
      <div class="question-item">
        <div class="question-text">${i+1}. ${q}</div>
        <div class="radio-options">
          ${["اصلاً","چند روز","بیش از نیمی از روزها","تقریباً هر روز"].map((label,n) => `
            <label>
              <input type="radio" name="question_${i+1}" value="${n}" required>
              ${n} · ${label}
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  renderQuestions();

  function doctorSchedule(doctor) {
    const schedule = doctor.schedule || doctor.available_times || doctor.slots || [];
    return Array.isArray(schedule) ? schedule : [];
  }

  function doctorId(d) {
    return d.id ?? d.doctor_id ?? d.ID;
  }

  function doctorName(d) {
    return d.name || d.full_name || "پزشک";
  }

  function slotStart(s) {
    return typeof s === "string" ? s : (s.start || s.datetime || s.time || "");
  }

  function slotReserved(s) {
    return typeof s === "object" && (s.is_reserved === true || s.reserved === true);
  }

  function formatDate(value) {
    if (!value) return "زمان نامشخص";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleString("fa-IR", {dateStyle:"medium", timeStyle:"short"});
  }

  async function getDoctors() {
    const data = await api("/doctors");
    return Array.isArray(data) ? data : (data?.doctors || data?.items || []);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c]));
  }

  function doctorCard(d) {
    const id = doctorId(d);

    return `
      <article class="doctor-card">
        <div class="doctor-top">
          <div class="doctor-avatar">✿</div>
          <div>
            <h3>${escapeHtml(doctorName(d))}</h3>
            <span class="phone">${escapeHtml(d.phone_number || d.phone || "مشاور سلامت روان")}</span>
          </div>
        </div>

        <p class="doctor-description">
          ${escapeHtml(d.description || "اطلاعاتی برای معرفی این پزشک ثبت نشده است.")}
        </p>

        <div class="doctor-meta">⌖ ${escapeHtml(d.address || "آدرس ثبت نشده")}</div>

        <button class="btn btn-primary reserve-open" data-doctor-id="${escapeHtml(String(id ?? ""))}">
          مشاهده زمان‌ها و رزرو
        </button>

        <div class="slots-area hidden" id="slots-${escapeHtml(String(id ?? ""))}"></div>
      </article>
    `;
  }

  async function loadDoctors() {
    $("#doctorsGrid").innerHTML = '<div class="loading-card">در حال دریافت فهرست پزشکان...</div>';

    try {
      doctorsCache = await getDoctors();
      renderDoctorGrid(doctorsCache);
    } catch (err) {
      $("#doctorsGrid").innerHTML = `
        <div class="empty-state">
          ارتباط با بک‌اند برقرار نشد.<br>
          ${escapeHtml(err.message)}<br>
          <small>مطمئن شو FastAPI روی ${API} اجراست و CORS فعال است.</small>
        </div>
      `;
    }
  }

  function renderDoctorGrid(list) {
    $("#doctorsGrid").innerHTML = list.length
      ? list.map(doctorCard).join("")
      : '<div class="empty-state">هنوز پزشکی ثبت نشده است.</div>';
  }

  $("#refreshDoctors").addEventListener("click", loadDoctors);

  $("#doctorSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();

    renderDoctorGrid(doctorsCache.filter(d =>
      `${doctorName(d)} ${d.description || ""} ${d.address || ""}`.toLowerCase().includes(q)
    ));
  });

  $("#doctorsGrid").addEventListener("click", async e => {
    const button = e.target.closest(".reserve-open");
    if (!button) return;

    const id = button.dataset.doctorId;
    const doctor = doctorsCache.find(d => String(doctorId(d)) === id);
    if (!doctor) return;

    const area = $(`#slots-${CSS.escape(id)}`);
    area.classList.toggle("hidden");

    if (!area.classList.contains("hidden")) {
      renderSlots(doctor, area);
    }
  });

  function renderSlots(doctor, area) {
    const slots = doctorSchedule(doctor);

    if (!slots.length) {
      area.innerHTML = '<p class="doctor-meta">زمانی برای این پزشک در پاسخ API ثبت نشده است.</p>';
      return;
    }

    area.innerHTML = `
      <div class="slot-list">
        ${slots.map(s => {
          const start = slotStart(s);
          const reserved = slotReserved(s);

          return `
            <div class="slot-row">
              <span>${escapeHtml(formatDate(start))}</span>
              ${reserved
                ? '<span class="slot-chip">رزرو شده</span>'
                : `<button class="btn btn-soft slot-book"
                    data-doctor-id="${escapeHtml(String(doctorId(doctor)))}"
                    data-start="${escapeHtml(start)}">رزرو</button>`
              }
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  $("#doctorsGrid").addEventListener("click", async e => {
    const b = e.target.closest(".slot-book");
    if (!b) return;

    const name = prompt("نام و نام خانوادگی برای ثبت نوبت:");
    if (!name?.trim()) return;

    try {
      const result = await api(
        `/doctors/${encodeURIComponent(b.dataset.doctorId)}/reserve`,
        {
          method:"POST",
          body:JSON.stringify({
            name:name.trim(),
            start:b.dataset.start
          })
        }
      );

      notify(result?.msg || "درخواست رزرو ثبت شد.");
      await loadDoctors();
    } catch(err) {
      notify(err.message);
    }
  });

  // ارزیابی سلامت روان
  $("#assessmentForm").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.currentTarget;
    const fd = new FormData(form);
    const gender = fd.get("gender");

    const payload = {
      age: Number(fd.get("age")),
      question_1: Number(fd.get("question_1")),
      question_2: Number(fd.get("question_2")),
      question_3: Number(fd.get("question_3")),
      question_4: Number(fd.get("question_4")),
      question_5: Number(fd.get("question_5")),
      question_6: Number(fd.get("question_6")),
      question_7: Number(fd.get("question_7")),
      question_8: Number(fd.get("question_8")),
      question_9: Number(fd.get("question_9")),
      sleep_quality: Number(fd.get("sleep_quality")),
      study_pressure: Number(fd.get("study_pressure")),
      financial_pressure: Number(fd.get("financial_pressure")),
      gender: gender
    };

    const resultBox = $("#assessmentResult");
    resultBox.className = "result-box";
    resultBox.textContent = "در حال بررسی پاسخ‌های شما...";

    try {
      const result = await api("/predict-depress", {
        method:"POST",
        body:JSON.stringify(payload)
      });

      const severity = result.severity;
      const severityFa = severityNames[severity] || "نامشخص";
      const description = severityDescriptions[severity] || "نتیجه ارزیابی دریافت شد.";

      const probabilities = result.probabilities || {};

      const probabilityHtml = Object.entries(probabilities)
        .map(([key, value]) => {
          const label = severityNames[key] || key;
          const number = Number(value);
          const safeNumber = Number.isFinite(number)
            ? Math.min(100, Math.max(0, number))
            : 0;

          return `
            <div class="probability-row">
              <div class="probability-info">
                <span>${escapeHtml(label)}</span>
                <b>${Number.isFinite(number) ? number.toFixed(2) : "0.00"}٪</b>
              </div>
              <div class="probability-track">
                <div class="probability-fill" style="width:${safeNumber}%"></div>
              </div>
            </div>
          `;
        }).join("");

      // هشدار جداگانه برای پاسخ مثبت به سؤال نهم
      const selfHarmWarning = payload.question_9 > 0
        ? `
          <div class="assessment-notice urgent-notice">
            <b>مهم: لطفاً این بخش را جدی بگیر</b>
            <p>
              پاسخ شما به پرسش مربوط به افکار مرگ یا آسیب‌زدن به خود مثبت بوده است.
              نتیجه این مدل نمی‌تواند میزان خطر را مشخص کند.
              لطفاً در اسرع وقت با یک متخصص سلامت روان یا فرد مورد اعتماد صحبت کن.
              اگر در حال حاضر احساس می‌کنی ممکن است به خودت آسیب بزنی،
              تنها نمان و فوراً از خدمات اورژانسی محل زندگی‌ات کمک بگیر.
            </p>
          </div>
        `
        : "";

      resultBox.className = "result-box assessment-success";

      resultBox.innerHTML = `
        <div class="assessment-result-card">
          <div class="assessment-result-icon">♡</div>

          <h3>نتیجه ارزیابی شما</h3>

          <div class="severity-result">
            ${escapeHtml(severityFa)}
          </div>

          <p>${escapeHtml(description)}</p>

          <div class="probability-section">
            <h4>جزئیات نتیجه ارزیابی</h4>
            ${probabilityHtml || "<p>جزئیات بیشتری از مدل دریافت نشد.</p>"}
          </div>

          ${selfHarmWarning}

          <div class="assessment-notice">
            <b>توجه مهم</b>
            <p>
              این نتیجه صرفاً تخمین مدل هوش مصنوعی بر اساس پاسخ‌های شماست
              و تشخیص پزشکی محسوب نمی‌شود. برای بررسی دقیق‌تر و دریافت
              راهنمایی مناسب با روان‌شناس یا روان‌پزشک مشورت کنید.
            </p>
            <p>
              درصدهای بالا نشان‌دهنده خروجی احتمالاتی مدل هستند،
              نه درصد احتمال ابتلای قطعی شما.
            </p>
          </div>
        </div>
      `;

      resultBox.scrollIntoView({behavior:"smooth", block:"center"});

    } catch(err) {
      resultBox.className = "result-box error";
      resultBox.textContent = `ارسال پاسخ ناموفق بود: ${err.message}`;
    }
  });

  // چت‌بات
  $("#chatForm").addEventListener("submit", async e => {
    e.preventDefault();

    const input = $("#chatInput");
    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user-message");
    input.value = "";

    const pending = addMessage(
      "در حال دریافت پاسخ...",
      "assistant-message"
    );

    try {
      const response = await fetch(`${API}/ask-ai`, {
        method:"POST",
        headers: {
          "Content-Type":"application/json"
        },
        body:JSON.stringify({text:text})
      });

      const raw = await response.text();

      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw;
      }

      if (!response.ok) {
        const detail = data?.detail;

        const errorMessage =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map(item => item.msg).join("، ")
              : JSON.stringify(data) || `خطای سرور (${response.status})`;

        throw new Error(errorMessage);
      }

      const answer = typeof data === "string"
        ? data
        : data?.answer || data?.response || data?.message;

      pending.textContent = answer || JSON.stringify(data);

    } catch(err) {
      pending.textContent = `خطا در دریافت پاسخ: ${err.message}`;
      pending.classList.add("error");
      console.error("Ask AI Error:", err);
    }
  });

  function addMessage(text, cls) {
    const el = document.createElement("div");
    el.className = `message ${cls}`;
    el.textContent = text;

    $("#chatMessages").appendChild(el);
    $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;

    return el;
  }

  // مدیریت پزشکان
  $("#showDoctorForm").addEventListener("click", () => {
    $("#doctorForm").classList.remove("hidden");
  });

  $("#hideDoctorForm").addEventListener("click", () => {
    $("#doctorForm").classList.add("hidden");
  });

  $("#doctorForm").addEventListener("submit", async e => {
    e.preventDefault();

    const body = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const result = await api("/create-doctor", {
        method:"POST",
        body:JSON.stringify(body)
      });

      notify(result?.msg || "پزشک با موفقیت ثبت شد.");

      e.currentTarget.reset();
      e.currentTarget.classList.add("hidden");

      await loadAdminDoctors();
      await loadDoctors();

    } catch(err) {
      notify(err.message);
    }
  });

  async function loadAdminDoctors() {
    $("#adminDoctorsList").innerHTML =
      '<div class="loading-card">در حال دریافت اطلاعات...</div>';

    try {
      doctorsCache = await getDoctors();

      $("#adminDoctorsList").innerHTML = doctorsCache.length
        ? doctorsCache.map(d => `
          <div class="admin-row">
            <div>
              <b>${escapeHtml(doctorName(d))}</b>
              <small>
                ${escapeHtml(d.phone_number || "")} ·
                ${escapeHtml(d.address || "")}
              </small>
            </div>
            <button class="btn-danger delete-doctor"
              data-id="${escapeHtml(String(doctorId(d)))}">
              حذف پزشک
            </button>
          </div>
        `).join("")
        : '<div class="empty-state">پزشکی ثبت نشده است.</div>';

    } catch(err) {
      $("#adminDoctorsList").innerHTML =
        `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    }
  }

  $("#adminDoctorsList").addEventListener("click", async e => {
    const b = e.target.closest(".delete-doctor");
    if (!b) return;

    if (!confirm("از حذف این پزشک مطمئنی؟")) return;

    try {
      const r = await api(
        `/doctors/${encodeURIComponent(b.dataset.id)}/delete`,
        {method:"DELETE"}
      );

      notify(r?.msg || "پزشک حذف شد.");
      await loadAdminDoctors();

    } catch(err) {
      notify(err.message);
    }
  });

  // تب‌های پنل مدیریت
  $$(".admin-tab").forEach(b => b.addEventListener("click", () => {
    $$(".admin-tab").forEach(x => x.classList.toggle("active", x === b));

    $$(".admin-panel").forEach(x =>
      x.classList.toggle("active", x.id === `admin-${b.dataset.adminTab}`)
    );

    if (b.dataset.adminTab === "appointments") {
      loadAppointments();
    }
  }));

  $("#refreshAppointments").addEventListener("click", loadAppointments);

  async function loadAppointments() {
    const el = $("#appointmentsList");
    el.innerHTML = '<div class="loading-card">در حال بررسی نوبت‌ها...</div>';

    try {
      doctorsCache = await getDoctors();
      const rows = [];

      doctorsCache.forEach(d => {
        const reserved = doctorSchedule(d).filter(slotReserved);

        rows.push(`
          <div class="admin-row appointment-row">
            <div>
              <b>${escapeHtml(doctorName(d))}</b>
              <small>${reserved.length} نوبت رزروشده</small>

              <div class="appointment-slots">
                ${reserved.length
                  ? reserved.map(s => `
                    <span class="slot-chip">
                      ${escapeHtml(formatDate(slotStart(s)))}
                      ${s.reserved_by ? ` · ${escapeHtml(s.reserved_by)}` : ""}
                    </span>
                  `).join("")
                  : '<span class="slot-chip free">نوبت رزروشده‌ای در پاسخ API نیست</span>'
                }
              </div>
            </div>
          </div>
        `);
      });

      el.innerHTML = rows.length
        ? rows.join("")
        : '<div class="empty-state">پزشکی ثبت نشده است.</div>';

    } catch(err) {
      el.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    }
  }

})();
