const API=window.API_BASE_URL||"http://127.0.0.1:8000";
const $=id=>document.getElementById(id);
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3000)}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function api(path,options={}){const r=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const data=r.status===204?null:await r.json().catch(()=>null);if(!r.ok)throw new Error(typeof data?.detail==="string"?data.detail:`خطای سرور (${r.status})`);return data}
function render(doctors){
 $("doctorCount").textContent=doctors.length;
 const host=$("adminDoctorList");
 if(!doctors.length){host.innerHTML='<div class="empty-state">پزشکی ثبت نشده است.</div>';return}
 host.innerHTML=doctors.map(d=>`<div class="admin-doctor-row"><div class="admin-doctor-info"><div class="doctor-avatar">✚</div><div><b>${esc(d.name)}</b><small>${esc(d.phone_number||"بدون شماره")} · شناسه: ${d.id}</small></div></div><button class="delete-button" data-id="${d.id}">حذف پزشک</button></div>`).join("");
 host.querySelectorAll(".delete-button").forEach(btn=>btn.addEventListener("click",async()=>{
  if(!confirm("از حذف این پزشک مطمئن هستی؟"))return;
  try{await api(`/doctors/${btn.dataset.id}/delete`,{method:"DELETE"});toast("پزشک حذف شد.");load()}
  catch(e){toast(e.message)}
 }));
}
async function load(){
 try{$("serverStatus").textContent="متصل";$("serverStatus").style.color="#087f75";render(await api("/doctors"))}
 catch(e){$("serverStatus").textContent="قطع";$("serverStatus").style.color="#d94848";$("doctorCount").textContent="—";$("adminDoctorList").innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
$("doctorForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
 const btn=$("createDoctorBtn");btn.disabled=true;btn.textContent="در حال ثبت...";
 try{await api("/create-doctor",{method:"POST",body:JSON.stringify(data)});form.reset();$("formMessage").textContent="پزشک با موفقیت ثبت شد.";toast("پزشک ثبت شد.");load()}
 catch(err){$("formMessage").textContent=err.message;toast(err.message)}
 finally{btn.disabled=false;btn.textContent="ثبت پزشک"}
});
$("adminRefresh").addEventListener("click",load);load();