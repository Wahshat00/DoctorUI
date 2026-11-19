const API = window.API_BASE_URL || "http://127.0.0.1:8000";
const $ = id => document.getElementById(id);
const questions = [
"کم شدن علاقه یا لذت بردن از انجام کارها",
"احساس ناراحتی، افسردگی یا ناامیدی",
"مشکل در خوابیدن، ادامه خواب یا خوابیدن بیش از حد",
"احساس خستگی یا کمبود انرژی",
"کم‌اشتهایی یا پرخوری",
"احساس بد نسبت به خود یا احساس شکست و ناامید کردن خود یا خانواده",
"مشکل در تمرکز، مانند هنگام خواندن روزنامه یا تماشای تلویزیون",
"کندی حرکت یا صحبت، یا برعکس بی‌قراری و تحرک بیش از معمول",
"فکر کردن به اینکه بهتر بود مرده بودید یا فکر آسیب زدن به خود"
];
const choices = ["اصلاً (۰)","چند روز (۱)","بیش از نصف روزها (۲)","تقریباً هر روز (۳)"];
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3000)}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function api(path,options={}){const r=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const data=r.status===204?null:await r.json().catch(()=>null);if(!r.ok)throw new Error(typeof data?.detail==="string"?data.detail:`خطای سرور (${r.status})`);return data}
function buildQuestions(){
 $("phqQuestions").innerHTML=questions.map((q,i)=>`<fieldset class="question"><legend>${i+1}. ${q}</legend><div class="choice-row">${choices.map((c,n)=>`<label class="choice"><input type="radio" name="question_${i+1}" value="${n}" required><span>${c}</span></label>`).join("")}</div></fieldset>`).join("");
}
function renderDoctors(doctors){
 const host=$("doctorList");
 if(!Array.isArray(doctors)||!doctors.length){host.innerHTML='<div class="empty-state">هنوز پزشکی ثبت نشده است.</div>';return}
 host.innerHTML=doctors.map(d=>{
  const slots=Array.isArray(d.schedule)?d.schedule:[];
  const available=slots.filter(s=>!s.is_reserved);
  const reserved=slots.filter(s=>s.is_reserved);
  return `<article class="doctor-card"><div class="doctor-top"><div class="doctor-avatar">✚</div><div><h3>${esc(d.name)}</h3><p>پزشک ثبت‌شده در درمان‌یار</p></div></div>
  <p>${esc(d.description||"توضیحاتی ثبت نشده است.")}</p><div class="doctor-meta">☎ ${esc(d.phone_number||"ثبت نشده")}<br>⌖ ${esc(d.address||"ثبت نشده")}</div>
  <div><b class="mini-heading">زمان‌های خالی</b><div class="slots">${available.length?available.map(s=>`<button class="slot" data-action="reserve" data-id="${d.id}" data-start="${esc(s.start)}">${esc(s.start)}${s.end?" تا "+esc(s.end):""}</button>`).join(""):'<span class="empty-slots">زمان خالی در دسترس نیست.</span>'}</div></div>
  ${reserved.length?`<div><b class="mini-heading">زمان‌های رزروشده</b><div class="slots">${reserved.map(s=>`<button class="slot reserved-slot" data-action="cancel" data-id="${d.id}" data-start="${esc(s.start)}">لغو ${esc(s.start)}</button>`).join("")}</div></div>`:""}
  <div class="card-actions"><small class="empty-slots">${available.length} زمان خالی</small><span class="text-button">شناسه پزشک: ${d.id}</span></div></article>`;
 }).join("");
 host.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",async()=>{
  const action=btn.dataset.action;
  try{
   if(action==="reserve"){
    const name=prompt("نام و نام خانوادگی خود را وارد کنید:");if(!name?.trim())return;
    await api(`/doctors/${btn.dataset.id}/reserve`,{method:"POST",body:JSON.stringify({name:name.trim(),start:btn.dataset.start})});
    toast("نوبت با موفقیت رزرو شد.");
   }else{
    if(!confirm("آیا از لغو این نوبت مطمئن هستید؟"))return;
    await api(`/doctors/${btn.dataset.id}/cancel`,{method:"POST",body:JSON.stringify({start:btn.dataset.start})});
    toast("نوبت لغو شد.");
   }
   loadDoctors();
  }catch(e){toast(e.message)}
 }));
}
async function loadDoctors(){
 $("doctorList").innerHTML='<div class="loading">در حال دریافت پزشکان...</div>';
 try{renderDoctors(await api("/doctors"))}
 catch(e){$("doctorList").innerHTML=`<div class="empty-state">دریافت پزشکان ناموفق بود.<br><small>${esc(e.message)} — سرور و تنظیمات CORS را بررسی کن.</small></div>`}
}
$("refreshDoctors").addEventListener("click",loadDoctors);
$("askAi").addEventListener("click",async()=>{
 const question=$("aiQuestion").value.trim();if(!question){toast("سوالت را وارد کن.");return}
 $("aiAnswer").textContent="در حال دریافت پاسخ...";
 try{const result=await api("/ask-ai",{method:"POST",body:JSON.stringify(question)});$("aiAnswer").textContent=typeof result==="string"?result:(result?.answer||JSON.stringify(result))}
 catch(e){$("aiAnswer").textContent="خطا در دریافت پاسخ: "+e.message}
});
$("depressionForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);
 const payload={age:Number(fd.get("age")),question_1:Number(fd.get("question_1")),question_2:Number(fd.get("question_2")),question_3:Number(fd.get("question_3")),question_4:Number(fd.get("question_4")),question_5:Number(fd.get("question_5")),question_6:Number(fd.get("question_6")),question_7:Number(fd.get("question_7")),question_8:Number(fd.get("question_8")),question_9:Number(fd.get("question_9")),sleep_quality:Number(fd.get("sleep_quality")),study_pressure:Number(fd.get("study_pressure")),financial_pressure:Number(fd.get("financial_pressure"))};
 if(fd.get("gender"))payload.gender=fd.get("gender");
 const btn=$("predictBtn");btn.disabled=true;btn.textContent="در حال بررسی...";
 try{
  const result=await api("/predict-depress",{method:"POST",body:JSON.stringify(payload)});
   const probs=result.probabilities||{};

   // ترجمه برچسب‌های انگلیسی نتیجه مدل به فارسی
   const severityTranslations = {
    "minimal": "حداقل",
    "minimal symptoms": "علائم حداقلی",
    "mild": "خفیف",
    "mild depression": "افسردگی خفیف",
    "moderate": "متوسط",
    "moderate depression": "افسردگی متوسط",
    "moderately severe": "نسبتاً شدید",
    "moderately severe depression": "افسردگی نسبتاً شدید",
    "severe": "شدید",
    "severe depression": "افسردگی شدید",
    "none": "بدون علائم",
    "normal": "طبیعی",
    "no depression": "بدون افسردگی"
   };

   function translateSeverity(value) {
    const original = String(value ?? "").trim();
    const key = original.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    return severityTranslations[key] || original || "نامشخص";
   }

   const severityFa = translateSeverity(result.severity);
   $("predictionResult").innerHTML=`<h3>نتیجه خودارزیابی: ${esc(severityFa)}</h3><p>این خروجی پیش‌بینی مدل است و تشخیص قطعی محسوب نمی‌شود.</p><div class="prob-list">${Object.entries(probs).map(([k,v])=>`<div class="prob-row"><span>${esc(translateSeverity(k))}</span><b>${esc(v)}٪</b></div>`).join("")}</div>`;
 }catch(err){$("predictionResult").textContent="خطا: "+err.message}
 finally{btn.disabled=false;btn.textContent="مشاهده نتیجه"}
});
buildQuestions();loadDoctors();