/* Lead.web — движок калькулятора. Один код для двух режимов:
   body[data-mode="client"]   — /kalkulyator/: цена вилкой, без часов, ставки и налога;
   body[data-mode="internal"] — /kp/: часы, ставка, налог, полные КП/ТЗ (доп. функции — в /kp/internal.js). */
var LW=(function(){
"use strict";
const D=LW_DATA,MODE=document.body.dataset.mode==="internal"?"internal":"client",INT=MODE==="internal";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r2=x=>Math.round(x*100)/100,num=x=>Math.round(x).toLocaleString("ru-RU"),rub=x=>r2(x).toLocaleString("ru-RU")+" ₽";
const fd=d=>d?String(d).split("-").reverse().join("."):"";
const iso=d=>d.toISOString().slice(0,10),plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const GN=Object.fromEntries(D.GROUPS),plur=(n,a,b,c)=>{const m=n%10,h=n%100;return n+" "+(m==1&&h!=11?a:m>=2&&m<=4&&(h<10||h>=20)?b:c)};
const BRIEF=[["company","Компания","text","Название компании или проекта"],["niche","Ниша и чем занимаетесь","text","Например: производство кухонь на заказ"],["goals","Цели сайта","area","Заявки, продажи, доверие, запуск нового направления…"],["examples","Примеры сайтов","area","Ссылки на сайты, которые нравятся (и чем)"],["deadline","Желаемые сроки","text","Например: к 1 марта"],["budget","Ориентир по бюджету","text","Например: до 150 000 ₽"],["name","Ваше имя","text",""],["contact","Телефон или Telegram","text","+7… или @username"],["email","Email","email","name@company.ru"],["comment","Комментарий","area","Всё, что важно знать до старта"]];

/* ===== state ===== */
const LS=INT?"lw_kp_state":"lw_calc_state";
const DEFAULT=()=>({v:2,plat:"tilda",type:"landing",pages:5,pnames:"",sel:{},hov:{},custom:[],brief:{},client:"",proj:"",task:"",rate:D.RATE,tax:D.TAX,needs:"",wish:[],risks:"",
 kp:{date:iso(new Date()),valid:plus(14),pay:"50",stages:"",hpd:6,days:"",b:{team:INT,why:true,case1:true,case2:true,list:false}},docs:{kp:true,brief:true,tz:false}});
function migrate(o){o=Object.assign(DEFAULT(),o||{});o.kp=Object.assign(DEFAULT().kp,o.kp||{});o.kp.b=Object.assign(DEFAULT().kp.b,o.kp.b||{});o.docs=Object.assign(DEFAULT().docs,o.docs||{});
 o.sel=o.sel||{};o.hov=o.hov||{};o.brief=o.brief&&typeof o.brief=="object"?o.brief:{};if(!Array.isArray(o.wish))o.wish=[];
 if(!D.PLATS.some(p=>p[0]==o.plat))o.plat="tilda";if(!D.TYPES.some(t=>t[0]==o.type))o.type="landing";
 const s=o.sel,tl=o.plat=="tilda";/* старые пункты конструктора КП */
 if(s.domain){s.dom_reg=s.dom_pay=true}if(s.hosting){s[tl?"tilda_plan":"host_own"]=true}if(s.connect){if(tl)s.t_domain=true;else{s.srv_ssl=s.srv_dns=true}}
 if(tl&&s.f_crm)s.t_crm=true;if(tl&&s.metrika)s.t_analytics=true;["domain","hosting","connect"].forEach(k=>{delete s[k];delete o.hov[k]});
 o.custom=(Array.isArray(o.custom)?o.custom:[]).filter(c=>c&&typeof c=="object").map(c=>({g:GN[c.g]?c.g:"func",n:String(c.n||""),d:String(c.d||""),h:+c.h||0,on:c.on!==false}));
 o.v=2;return o}
let S;try{S=migrate(JSON.parse(localStorage.getItem(LS)||"null")||(INT?JSON.parse(localStorage.getItem("kv_state")||"null"):null))}catch(e){S=migrate(null)}
let fresh=!localStorage.getItem(LS);
if(!INT){S.rate=D.RATE;S.tax=D.TAX}
let VIEW=false;const save=()=>{if(!VIEW)try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}};
const vis=it=>!it.plats||it.plats.includes(S.plat);
function preset(p){S.plat=p.plat;S.type=p.type;if(p.pages!=null)S.pages=p.pages;if(p.pnames!=null)S.pnames=p.pnames;S.sel={};S.hov={};p.on.forEach(id=>S.sel[id]=true)}
const PRESETS=D.PRESETS.slice();

/* compact link state (#c=) */
function compact(withBrief=true){const o={p:S.plat,t:S.type,s:D.ITEMS.filter(i=>S.sel[i.id]&&vis(i)).map(i=>i.id)};if(S.type=="multi"){o.n=S.pages;if(S.pnames.trim())o.pn=S.pnames}
 if(S.custom.length)o.c=S.custom.filter(c=>c.n.trim()).map(c=>[c.g,c.n,c.d,INT?c.h:0,c.on?1:0]);
 if(INT&&Object.keys(S.hov).length)o.h=S.hov;if(withBrief){const b={};BRIEF.forEach(([k])=>{if((S.brief[k]||"").trim())b[k]=S.brief[k]});if(Object.keys(b).length)o.b=b}
 if(INT){if(S.client)o.cl=S.client;if(S.proj)o.pj=S.proj}return o}
function fromCompact(o){const n=migrate(null);n.plat=o.p;n.type=o.t;if(o.n!=null)n.pages=+o.n||0;n.pnames=o.pn||"";(o.s||[]).forEach(id=>n.sel[id]=true);
 n.custom=(o.c||[]).map(a=>({g:a[0],n:a[1],d:a[2]||"",h:+a[3]||0,on:a[4]!==0}));n.hov=o.h||{};n.brief=o.b||{};n.client=o.cl||"";n.proj=o.pj||"";return migrate(n)}
function linkUrl(withBrief=true){return location.origin+location.pathname+"#c="+D.encState(compact(withBrief))}
let banner="";
function readHash(){const H=location.hash;if(!H)return null;
 try{if(H.startsWith("#c=")){const n=fromCompact(D.decState(H.slice(3)));if(INT){n.rate=S.rate;n.tax=S.tax;n.kp=S.kp;n.needs=S.needs;n.wish=S.wish}S=n;banner="Расчёт загружен по ссылке.";history.replaceState(null,"",location.pathname);return "c"}
  if(!INT&&/^#(kp|tz)=/.test(H)){S=migrate(D.decState(H.slice(4)));S.rate=D.RATE;S.tax=D.TAX;banner="Расчёт загружен по ссылке.";history.replaceState(null,"",location.pathname);return "c"}}
 catch(e){console.warn(e);banner="Ссылка повреждена — открыт последний расчёт."}return null}

/* ===== calculation ===== */
const PI=()=>Math.max(0,D.PLATS.findIndex(p=>p[0]==S.plat));
const itemName=it=>Array.isArray(it.n)?it.n[PI()]:it.n,defH=it=>Array.isArray(it.h)?it.h[PI()]:it.h;
const pnL=()=>String(S.pnames||"").split("\n").map(x=>x.trim()).filter(Boolean);
function autoItems(){const a=[],p=PI(),des=D.ITEMS.some(i=>i.g=="design"&&S.sel[i.id]),N=Math.max(0,+S.pages||0);
 if(S.type=="multi"&&N){if(des)a.push({id:"a_pd",g:"design",n:`Дизайн внутренних страниц (${N} шт.)`,h:N*3,d:`Дизайн ${N} внутренних страниц на основе главной.`,auto:1});
  a.push({id:"a_pb",g:"plat",n:`Вёрстка внутренних страниц (${N} шт.)`,h:N*[2,3,4][p],d:pnL().length?`Сборка ${N} внутренних страниц: ${pnL().filter(x=>!/^главная$/i.test(x)).join(", ")}.`:`Сборка ${N} внутренних страниц (перечень согласуется на этапе структуры).`,auto:1})}
 if(S.type=="shop"){if(des)a.push({id:"a_sd",g:"design",n:"Дизайн карточки товара и корзины",h:6,d:"Макеты каталога, карточки товара, корзины и оформления заказа.",auto:1});
  a.push({id:"a_sb",g:"plat",n:"Каталог товаров, корзина и оформление заказа",h:[10,16,30][p],d:"Каталог с категориями и фильтрами, карточка товара, корзина, оформление заказа, уведомления о заказах.",auto:1})}
 return a}
function lines(){const L=[];
 D.ITEMS.concat(autoItems()).forEach(it=>{if(!vis(it)||!(it.auto||S.sel[it.id]))return;const h=S.hov[it.id]!=null?S.hov[it.id]:defH(it);
  L.push({id:it.id,g:it.g,n:itemName(it),h:it.client?0:+h||0,d:it.d,client:!!it.client,ref:it.ref||"",month:it.pay=="month",auto:!!it.auto})});
 D.GROUPS.forEach(([g])=>S.custom.forEach(c=>{if(c.g!=g||!c.on||!c.n.trim())return;const h=INT?+c.h||0:0;
  L.push({id:"",g,n:c.n.trim(),h,d:c.d.trim()||"Дополнительная работа по согласованию с заказчиком.",custom:true,est:!(h>0)})}));
 const ord=Object.fromEntries(D.GROUPS.map((g,i)=>[g[0],i]));return L.sort((a,b)=>ord[a.g]-ord[b.g])}
function totals(L=lines()){const rate=INT?+S.rate||0:D.RATE,tax=INT?+S.tax||0:D.TAX,o=L.filter(l=>!l.month&&!l.client),m=L.filter(l=>l.month);
 const Ho=o.reduce((a,l)=>a+l.h,0),Hm=m.reduce((a,l)=>a+l.h,0),So=Ho*rate,Sm=Hm*rate;
 return {H:Ho,S:So,T:So*tax/100,I:So*(1+tax/100),Hm,Sm,Tm:Sm*tax/100,Im:Sm*(1+tax/100),rate,tax,est:L.filter(l=>l.est).length,client:L.filter(l=>l.client),n:L.length}}
function range(x,step){if(!(x>0))return null;step=step||(x<30000?500:1000);return [Math.max(step,Math.floor(x*(1-D.SPREAD)/step)*step),Math.ceil(x*(1+D.SPREAD)/step)*step]}
const rangeT=(x,suf="")=>{const r=range(x);return r?`от ${num(r[0])} до ${num(r[1])} ₽${suf}`:"—"};
const autoDays=c=>Math.max(1,Math.ceil(c.H/(+S.kp.hpd||6)));
const daysText=c=>INT?((S.kp.days||"").trim()||autoDays(c)+" раб. дн."):(()=>{const d=autoDays(c);const a=Math.max(1,Math.floor(d*(1-D.SPREAD))),b=Math.ceil(d*(1+D.SPREAD));return a==b?`≈ ${a} раб. дн.`:`≈ ${a}–${b} раб. дн.`})();
const noteP=()=>D.NOTES[S.plat];
const platN=()=>D.PLATS[PI()][1],typeN=()=>(D.TYPES.find(t=>t[0]==S.type)||D.TYPES[0])[1]+(S.type=="multi"?` (главная + ${S.pages} внутр. стр.)`:"");
function sched(){const k=S.kp;if(k.pay=="100")return[["Предоплата 100%",100]];if(k.pay=="50")return[["Предоплата",50],["После сдачи работ",50]];
 if(k.pay=="30")return[["Предоплата",30],["После согласования дизайна / прототипа",40],["После сдачи работ",30]];
 return String(k.stages||"").split("\n").map(l=>l.split(";")).filter(a=>a[0].trim()).map(a=>[a[0].trim(),parseFloat((a[1]||"").replace(",","."))||0])}
const clientName=()=>(S.client||S.brief.company||"").trim();
const taskText=()=>(S.task||S.brief.goals||"").trim();

/* ===== UI: configuration, sections, summary ===== */
const CHEV='<svg class="lc-chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const OPEN=new Set(["prep"]);
function tiles(name,list,cur,label){return `<fieldset class="lc-tiles"><legend>${label}</legend><div class="lc-tiles-row">${list.map(([k,n,d])=>`<label class="lc-tile${cur==k?" on":""}"><input type="radio" name="${name}" value="${k}"${cur==k?" checked":""}><span class="lc-tile-n">${esc(n)}</span><span class="lc-tile-d">${esc(d)}</span></label>`).join("")}</div></fieldset>`}
function renderCfg(){const el=$("lcCfg");if(!el)return;
 el.innerHTML=tiles("type",D.TYPES,S.type,"Какой сайт нужен")+tiles("plat",D.PLATS,S.plat,"На чём делаем")+
 (S.type=="multi"?`<div class="lc-pages"><label>Внутренних страниц, кроме главной<input id="lcPages" type="number" min="0" max="200" inputmode="numeric" value="${esc(S.pages)}"></label><label>Названия страниц, по одной в строке (необязательно)<textarea id="lcPn" rows="3" placeholder="Главная&#10;Услуги&#10;О компании">${esc(S.pnames)}</textarea></label></div>`:"")}
function renderPresets(){const el=$("lcPresets");if(!el)return;el.innerHTML=PRESETS.map((p,j)=>`<button type="button" class="lc-chip" data-p="${j}">${esc(p.n)}</button>`).join("")+`<button type="button" class="lc-chip ghost" data-p="x">Очистить</button>`}
function tagsFor(it,l){const t=[];if(it.month)t.push('<em class="lc-tag mo">ежемесячно</em>');if(it.client)t.push(`<em class="lc-tag cl">оплачивает заказчик · ${esc(it.ref)}</em>`);if(it.auto)t.push('<em class="lc-tag">добавлено автоматически</em>');return t.join(" ")}
function renderGroups(){const el=$("lcGroups");if(!el)return;const auto=autoItems(),L=lines(),sub={},cnt={};L.forEach(l=>{sub[l.g]=(sub[l.g]||0)+(l.client?0:l.h);cnt[l.g]=(cnt[l.g]||0)+1});
 const keep=focusKey();let h="";
 D.GROUPS.forEach(([g,gn])=>{const its=D.ITEMS.filter(i=>i.g==g&&vis(i)).concat(auto.filter(i=>i.g==g)),open=OPEN.has(g);
  h+=`<section class="lc-acc${open?" open":""}" data-g="${g}"><h3 class="lc-acc-h"><button type="button" id="gb-${g}" aria-expanded="${open}" aria-controls="gp-${g}"><span class="lc-acc-t">${gn}</span><span class="lc-acc-s" id="gs_${g}">${gsum(g,cnt,sub)}</span>${CHEV}</button></h3>
  <div class="lc-acc-p" id="gp-${g}" role="region" aria-labelledby="gb-${g}"${open?"":" hidden"}><ul class="lc-items">`+its.map(it=>{const on=!!(it.auto||S.sel[it.id]),hv=S.hov[it.id]!=null?S.hov[it.id]:defH(it),nm=itemName(it);
   return `<li class="lc-it${on?" on":""}"><label class="lc-ck"><input type="checkbox" data-id="${it.id}"${on?" checked":""}${it.auto?" disabled":""}><span class="lc-it-b"><span class="lc-it-n">${esc(nm)} ${tagsFor({month:it.pay=="month",client:it.client,ref:it.ref,auto:it.auto})}</span><span class="lc-it-d">${esc(it.d)}</span></span></label>`+
   (INT?(it.client?'<span class="lc-hz">—</span>':`<span class="lc-hin"><input type="number" min="0" step="0.5" value="${hv}" data-h="${it.id}" aria-label="Часы: ${esc(nm)}"><span>${it.pay=="month"?"ч/мес":"ч"}</span></span>`):"")+`</li>`}).join("")+`</ul>
  <div class="lc-extra"><h4>Дополнительно</h4>${S.custom.map((c,j)=>c.g!=g?"":`<div class="lc-crow${c.on?"":" off"}"><input type="checkbox" data-c="${j}"${c.on?" checked":""} aria-label="Учитывать строку"><input class="lc-cn" type="text" value="${esc(c.n)}" data-cn="${j}" placeholder="Название работы" aria-label="Название дополнительной работы">${INT?`<span class="lc-hin"><input type="number" min="0" step="0.5" value="${c.h}" data-ch="${j}" aria-label="Часы: ${esc(c.n||"доп. работа")}"><span>ч</span></span>`:`<em class="lc-tag est">оценим отдельно</em>`}<button type="button" class="lc-x" data-cx="${j}" aria-label="Удалить строку">×</button><textarea class="lc-cd" rows="2" data-cd="${j}" placeholder="Описание: что нужно сделать (необязательно)" aria-label="Описание дополнительной работы">${esc(c.d)}</textarea></div>`).join("")}
  <button type="button" class="lc-add" data-add="${g}">+ Добавить строку</button></div></div></section>`});
 el.innerHTML=h;restoreFocus(keep);updSummary()}
function gsum(g,cnt,sub){const n=cnt[g]||0;if(!n)return"не выбрано";return plur(n,"пункт","пункта","пунктов")+(INT&&sub[g]?` · ${r2(sub[g])} ч`:"")}
function focusKey(){const a=document.activeElement;if(!a||!a.dataset)return null;for(const k of ["id","h","c","cn","ch","cd","cx","add"])if(a.dataset[k]!=null)return [k,a.dataset[k],a.selectionStart];return null}
function restoreFocus(k){if(!k)return;const map={id:"id",h:"h",c:"c",cn:"cn",ch:"ch",cd:"cd",cx:"cx",add:"add"};const attr="data-"+map[k[0]].replace(/[A-Z]/g,m=>"-"+m.toLowerCase());
 const e=document.querySelector(`[${attr}="${CSS.escape(k[1])}"]`);if(e){e.focus({preventScroll:true});try{if(k[2]!=null&&e.setSelectionRange)e.setSelectionRange(k[2],k[2])}catch(x){}}}
function updSummary(){const L=lines(),c=totals(L),sub={},cnt={};L.forEach(l=>{sub[l.g]=(sub[l.g]||0)+(l.client?0:l.h);cnt[l.g]=(cnt[l.g]||0)+1});
 D.GROUPS.forEach(([g])=>{const e=$("gs_"+g);if(e)e.textContent=gsum(g,cnt,sub)});
 const el=$("lcSum");if(el){let h=`<div class="lc-sum-cfg">${esc((D.TYPES.find(t=>t[0]==S.type)||[])[1])} · ${esc(platN())}${S.type=="multi"?` · ${S.pages+1} стр.`:""}</div>`;
  if(INT){h+=`<div class="lc-row"><span>Часов</span><b>${r2(c.H)}</b></div><div class="lc-row"><span>Сумма</span><b>${rub(c.S)}</b></div><div class="lc-row"><span>Налог ${c.tax}%</span><b>${rub(c.T)}</b></div><div class="lc-row big"><span>Итого разово</span><b>${rub(c.I)}</b></div>`+
   (c.Hm?`<div class="lc-row"><span>Ежемесячно (${r2(c.Hm)} ч/мес)</span><b>${rub(c.Im)}/мес</b></div>`:"")+
   `<div class="lc-subs">${D.GROUPS.filter(g=>sub[g[0]]).map(([g,n])=>`<div class="lc-row sm"><span>${n}</span><span>${r2(sub[g])} ч</span></div>`).join("")}</div>`}
  else{h+=`<div class="lc-row big"><span>Разработка, разово</span><b>${c.I?rangeT(c.I):"выберите пункты"}</b></div>`+(c.Im?`<div class="lc-row"><span>Ежемесячно</span><b>${rangeT(c.Im,"/мес")}</b></div>`:"")+(c.H?`<div class="lc-row"><span>Срок</span><b>${daysText(c)}</b></div>`:"")}
  if(c.client.length)h+=`<div class="lc-paid"><span>Оплачивает заказчик:</span><ul>${c.client.map(l=>`<li>${esc(l.n)} — ${esc(l.ref)}</li>`).join("")}</ul></div>`;
  if(c.est)h+=`<p class="lc-est">+ ${plur(c.est,"доп. пункт","доп. пункта","доп. пунктов")} — оценим отдельно</p>`;
  h+=`<p class="lc-note">${INT?esc(noteP()):"Предварительная оценка ±15% по выбранным пунктам. Точную стоимость и срок фиксируем в КП после брифа и созвона."}</p>`;el.innerHTML=h}
 const bar=$("lcBarSum");if(bar)bar.textContent=INT?rub(c.I)+(c.Im?` + ${rub(c.Im)}/мес`:""):(c.I?rangeT(c.I):"выберите пункты");
 save();hooks.onChange&&hooks.onChange()}
function renderBrief(){const el=$("lcBrief");if(!el)return;el.innerHTML=BRIEF.map(([k,l,t,ph])=>`<label class="lc-f${t=="area"?" wide":""}"><span>${l}</span>${t=="area"?`<textarea data-b="${k}" rows="3" placeholder="${esc(ph)}">${esc(S.brief[k]||"")}</textarea>`:`<input data-b="${k}" type="${t=="email"?"email":"text"}"${k=="contact"?' autocomplete="tel"':k=="email"?' autocomplete="email"':k=="name"?' autocomplete="name"':k=="company"?' autocomplete="organization"':""} placeholder="${esc(ph)}" value="${esc(S.brief[k]||"")}">`}</label>`).join("")}
function renderAll(){renderCfg();renderGroups();renderBrief()}
function bind(){
 const cfg=$("lcCfg");if(cfg){cfg.addEventListener("change",e=>{const t=e.target;
   if(t.name=="plat"){S.plat=t.value;D.ITEMS.forEach(i=>{if(Array.isArray(i.h))delete S.hov[i.id]});["a_pb","a_sb"].forEach(k=>delete S.hov[k]);renderCfg();renderGroups();cfg.querySelector(`input[name=plat][value=${t.value}]`).focus();return}
   if(t.name=="type"){S.type=t.value;renderCfg();renderGroups();cfg.querySelector(`input[name=type][value=${t.value}]`).focus()}});
  cfg.addEventListener("input",e=>{const t=e.target;if(t.id=="lcPages"){S.pages=Math.max(0,Math.min(200,+t.value||0));delete S.hov.a_pd;delete S.hov.a_pb;renderGroups()}else if(t.id=="lcPn"){S.pnames=t.value;renderGroups()}})}
 const pr=$("lcPresets");if(pr)pr.addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(!b)return;const j=b.dataset.p;if(j=="x"){S.sel={};S.hov={};S.custom=[]}else preset(PRESETS[+j]);renderCfg();renderGroups();msg(j=="x"?"Выбор очищен.":"Пресет «"+PRESETS[+j].n+"» применён — проверьте разделы ниже.")});
 const G=$("lcGroups");if(!G)return;
 G.addEventListener("click",e=>{const hb=e.target.closest(".lc-acc-h button");if(hb){const s=hb.closest(".lc-acc"),g=s.dataset.g,open=!OPEN.has(g);open?OPEN.add(g):OPEN.delete(g);s.classList.toggle("open",open);hb.setAttribute("aria-expanded",open);$("gp-"+g).hidden=!open;return}
  const a=e.target.closest("[data-add]");if(a){const g=a.dataset.add;S.custom.push({g,n:"",d:"",h:INT?1:0,on:true});renderGroups();const ins=G.querySelectorAll(`#gp-${g} .lc-cn`);ins[ins.length-1].focus();return}
  const x=e.target.closest("[data-cx]");if(x){const j=+x.dataset.cx,g=S.custom[j].g;S.custom.splice(j,1);renderGroups();const ad=G.querySelector(`[data-add="${g}"]`);ad&&ad.focus()}});
 G.addEventListener("change",e=>{const t=e.target,d=t.dataset;if(d.id){S.sel[d.id]=t.checked;if(D.ITEMS.find(i=>i.id==d.id).g=="design")renderGroups();else{t.closest(".lc-it").classList.toggle("on",t.checked);updSummary()}return}
  if(d.c!=null){S.custom[+d.c].on=t.checked;t.closest(".lc-crow").classList.toggle("off",!t.checked);updSummary()}});
 G.addEventListener("input",e=>{const t=e.target,d=t.dataset;if(d.h){S.hov[d.h]=+t.value||0;updSummary()}else if(d.ch!=null){S.custom[+d.ch].h=+t.value||0;updSummary()}else if(d.cn!=null){S.custom[+d.cn].n=t.value;updSummary()}else if(d.cd!=null){S.custom[+d.cd].d=t.value;save()}});
 const B=$("lcBrief");if(B)B.addEventListener("input",e=>{const k=e.target.dataset.b;if(k){S.brief[k]=e.target.value;save();hooks.onChange&&hooks.onChange()}})}
function msg(t){const m=$("lcMsg");if(m){m.textContent=t;clearTimeout(msg._t);msg._t=setTimeout(()=>{if(m.textContent==t)m.textContent=""},6000)}}

/* ===== documents ===== */
const PF=`<div class="d-foot">Lead.web · Сайты, которые приводят заявки · bilarius1-tech.github.io/leadweb</div>`;
const sec=(n,kick,title,body,cls="")=>`<section class="d-pg ${cls}"><div class="d-kick"><span>${n}</span>${kick}</div><h2>${title}</h2>${body}${PF}</section>`;
const grpL=L=>D.GROUPS.map(([g,n])=>[n,L.filter(l=>l.g==g)]).filter(x=>x[1].length);
const lineTag=l=>(l.client?` <em>— оплачивает заказчик, ${esc(l.ref)}</em>`:"")+(l.month?" <em>— ежемесячно</em>":"")+(l.est?" <em>— оценим отдельно</em>":"");
function cover(kind,c){const K={kp:["КП",INT?"Коммерческое предложение":"Предварительное коммерческое предложение"],tz:["ТЗ",INT?"Техническое задание":"Предварительное техническое задание"],brief:["БР","Бриф на разработку сайта"]}[kind];
 const cost=INT?`<b class="d-acc">${rub(c.I)}</b>${c.Im?`<br><small>+ ${rub(c.Im)}/мес</small>`:""}`:`<b class="d-acc">${c.I?rangeT(c.I):"—"}</b>${c.Im?`<br><small>+ ${rangeT(c.Im,"/мес")}</small>`:""}`;
 return `<section class="d-pg d-cover"><div class="d-brand">Lead<b>.</b>web</div><div class="d-cmid"><div class="d-kick"><span>${K[0]}</span>${K[1]}</div>
 <div class="d-h1">${esc(S.proj||"Разработка сайта")}</div>${clientName()?`<div class="d-for">для <b>${esc(clientName())}</b></div>`:""}${taskText()?`<div class="d-task"><small>Задача</small><p>${esc(taskText()).replace(/\n/g,"<br>")}</p></div>`:""}</div>
 <div class="d-cbot"><div><small>Дата</small>${fd(INT?S.kp.date:iso(new Date()))}</div>${kind=="kp"?(INT&&S.kp.valid?`<div><small>Действительно до</small>${fd(S.kp.valid)}</div>`:"")+`<div><small>${INT?"Стоимость":"Ориентир стоимости"}</small>${cost}</div>`:`<div><small>Платформа</small>${esc(platN())}</div><div><small>Тип сайта</small>${esc(typeN())}</div>`}</div>${PF}</section>`}
function contactsPg(n){const K=D.CONTACTS,T=typeof C!="undefined"?C.contacts:{title:"Обсудим ваш проект?",lead:"Напишите или позвоните — ответим сами"};
 return `<section class="d-pg d-contacts"><div class="d-kick"><span>${n}</span>Контакты</div><h2>${esc(T.title)}</h2><p class="d-lead">${esc(T.lead)}</p><div class="d-cl"><a href="${K.tgUrl}"><small>Telegram</small>${esc(K.tg)}</a><a href="${K.tel}"><small>Телефон</small>${esc(K.phone)}</a><a href="mailto:${K.mail}"><small>Почта</small>${esc(K.mail)}</a><a href="${K.site}"><small>Сайт</small>Lead.web</a></div>${PF}</section>`}
function wishL(){return (S.wish||[]).map(x=>String(x).trim()).filter(Boolean)}
function docKP(){const L=lines(),c=totals(L),b=S.kp.b,o=[];let n=0;const N=()=>String(++n).padStart(2,"0");o.push(cover("kp",c));
 {const w=wishL(),nd=(S.needs||"").trim(),ex=(S.brief.examples||"").trim();if(nd||w.length||(!INT&&(S.brief.goals||ex)))o.push(sec(N(),"Ваша задача","Что вы хотите получить",
  (nd?`<p class="d-lead">${esc(nd.length>600?nd.slice(0,600)+"…":nd).replace(/\n/g,"<br>")}</p>`:"")+(w.length?`<ul>${w.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"")+
  (!INT&&S.brief.goals?`<p class="d-lead">${esc(S.brief.goals).replace(/\n/g,"<br>")}</p>`:"")+(!INT&&ex?`<p><b>Примеры сайтов:</b> ${esc(ex).replace(/\n/g,"<br>")}</p>`:"")))}
 o.push(sec(N(),"Что сделаем","Состав работ",`<div class="d-tags"><span>${esc(platN())}</span><span>${esc(typeN())}</span></div><div class="d-scope">${grpL(L).map(([g,a])=>`<div class="d-card"><h3>${g}</h3><ul>${a.map(l=>`<li>${esc(l.n)}${lineTag(l)}</li>`).join("")}</ul></div>`).join("")}</div>`));
 const once=L.filter(l=>!l.month),mon=L.filter(l=>l.month);
 if(INT){o.push(sec(N(),"Расчёт","Стоимость работ",`<table class="d-t"><thead><tr><th>Работа</th><th class="r">Часы</th><th class="r">Стоимость</th></tr></thead><tbody>${grpL(once).map(([g,a])=>`<tr class="gh"><td colspan="3">${g}</td></tr>`+a.map(l=>`<tr><td>${esc(l.n)}${lineTag(l)}</td><td class="r">${l.client?"—":r2(l.h)}</td><td class="r">${l.client?"—":rub(l.h*c.rate)}</td></tr>`).join("")).join("")}</tbody></table>
  <div class="d-tots"><div><span>Ставка за час</span><b>${rub(c.rate)}</b></div><div><span>Часов всего</span><b>${r2(c.H)}</b></div><div><span>Предварительная стоимость</span><b>${rub(c.S)}</b></div><div><span>Налог ${c.tax}%</span><b>${rub(c.T)}</b></div><div class="big"><span>Итого разово</span><b>${rub(c.I)}</b></div></div>`+
  (mon.length?`<h3>Ежемесячные услуги</h3><table class="d-t"><thead><tr><th>Услуга</th><th class="r">Ч/мес</th><th class="r">₽/мес</th></tr></thead><tbody>${mon.map(l=>`<tr><td>${esc(l.n)}</td><td class="r">${r2(l.h)}</td><td class="r">${rub(l.h*c.rate)}</td></tr>`).join("")}</tbody></table><div class="d-tots"><div><span>Налог ${c.tax}%</span><b>${rub(c.Tm)}</b></div><div class="big"><span>Итого в месяц</span><b>${rub(c.Im)}</b></div></div>`:"")+`<p class="d-note">${esc(noteP())}</p>`,"flow"));
  const sc=sched(),sp=sc.reduce((a,x)=>a+x[1],0);
  o.push(sec(N(),"Условия","Оплата и сроки",`<table class="d-t"><thead><tr><th>Платёж</th><th class="r">Доля</th><th class="r">Сумма</th></tr></thead><tbody>${sc.map(([t,p])=>`<tr><td>${esc(t)}</td><td class="r">${p}%</td><td class="r">${rub(c.I*p/100)}</td></tr>`).join("")}</tbody></table>${Math.abs(sp-100)>.01?`<p class="d-warn">Сумма долей: ${sp}% (должно быть 100%)</p>`:""}
  <div class="d-tots"><div class="big"><span>Ориентировочный срок</span><b>${esc(daysText(c))}</b></div>${c.Im?`<div><span>Ежемесячно после запуска</span><b>${rub(c.Im)}</b></div>`:""}${S.kp.valid?`<div><span>Предложение действительно до</span><b>${fd(S.kp.valid)}</b></div>`:""}</div>`))}
 else{o.push(sec(N(),"Ориентир","Предварительная стоимость",`<div class="d-tots wide"><div class="big"><span>Разработка, разово</span><b>${c.I?rangeT(c.I):"—"}</b></div>${c.Im?`<div class="big"><span>Ежемесячные услуги</span><b>${rangeT(c.Im,"/мес")}</b></div>`:""}<div><span>Ориентировочный срок</span><b>${c.H?esc(daysText(c)):"—"}</b></div></div>`+
  (mon.length?`<h3>Ежемесячно</h3><ul>${mon.map(l=>`<li>${esc(l.n)}</li>`).join("")}</ul>`:"")+(c.client.length?`<h3>Оплачивает заказчик напрямую</h3><ul>${c.client.map(l=>`<li>${esc(l.n)} — ${esc(l.ref)}</li>`).join("")}</ul>`:"")+
  (c.est?`<h3>Оценим отдельно</h3><ul>${L.filter(l=>l.est).map(l=>`<li>${esc(l.n)}${l.d?` — ${esc(l.d)}`:""}</li>`).join("")}</ul>`:"")+
  `<p class="d-note">Это предварительная оценка по выбранным пунктам с точностью ±15%. Точную стоимость, срок и график оплаты фиксируем в коммерческом предложении и договоре после брифа и короткого созвона. ${esc(noteP())}</p>`))}
 if(typeof C!="undefined"){
  if(b.team)o.push(sec(N(),"Знакомство",esc(C.team.title),`<p class="d-lead">${esc(C.team.lead)}</p><div class="d-g2">${C.team.people.map(p=>`<div class="d-card"><div class="d-pn">${esc(p.n)}</div><div class="d-pr">${esc(p.r)}</div><div class="d-py">${esc(p.y)}</div><p>«${esc(p.q)}»</p></div>`).join("")}</div>`));
  if(b.why)o.push(sec(N(),"Чем мы отличаемся",esc(C.why.title),`<div class="d-g3">${C.why.items.map((s,j)=>`<div class="d-card"><div class="d-num">0${j+1}</div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("")}</div>`));
  ["case1","case2"].forEach((k,i)=>{if(!b[k])return;const x=C[k];o.push(sec(N(),"Кейс "+(i+1),esc(x.title),`<a class="d-url" href="${esc(x.url)}">${esc(x.url.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a><div class="d-g3"><div class="d-card"><h3>Было</h3><p>${esc(x.was)}</p></div><div class="d-card"><h3>Сделали</h3><ul>${x.did.map(d=>`<li>${esc(d)}</li>`).join("")}</ul></div><div class="d-card dark"><h3>Результат</h3><p>${esc(x.res)}</p></div></div>`))});
  if(b.list)o.push(sec(N(),"Кейсы",esc(C.list.title),C.list.groups.map(([g,a])=>`<h3>${esc(g)}</h3><ul class="d-pl">${a.map(([t,u])=>`<li>${esc(t)} — <a href="${esc(u)}">${esc(u.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a></li>`).join("")}</ul>`).join(""),"flow"))}
 o.push(contactsPg(N()));return `<div class="d-doc" id="doc-kp">${o.join("")}</div>`}
function tzData(){const L=lines(),has=id=>L.some(l=>l.id==id),T=[];
 T.push(["Общие сведения",[["Проект",S.proj||"—"],["Заказчик",clientName()||"—"],["Исполнитель","Команда Lead.web (Алексей и Игорь)"],["Дата",fd(INT?S.kp.date:iso(new Date()))]],"kv"]);
 T.push(["Цели и задачи",[taskText()||"Задача уточняется с заказчиком.","Сайт должен понятно представлять компанию и продукт, вызывать доверие и приводить заявки."],"p"]);
 T.push(["Платформа и тип сайта",[["Платформа",platN()+". "+D.PLAT_D[S.plat]],["Тип сайта",typeN()+". "+D.TYPE_D[S.type]]],"kv"]);
 const bl=L.filter(l=>l.g=="blocks"),st=[];if(bl.length)st.push([S.type=="landing"?"Главная страница (лендинг) — блоки по порядку":"Главная страница — блоки по порядку",bl.map(l=>[l.n,l.d])]);
 L.filter(l=>l.id=="a_pb"||l.id=="a_sb").forEach(l=>st.push([l.n,[["Состав",l.d]]]));if(pnL().length)st.unshift(["Страницы сайта",pnL().map(x=>[x,/^главная$/i.test(x)?"Главная страница":"Внутренняя страница"])]);
 if(st.length)T.push(["Структура сайта",st,"struct"]);
 {const w=wishL(),nd=(S.needs||"").trim();if(nd||w.length){const a=[];if(nd)a.push(["Что нужно клиенту",nd]);w.forEach((x,j)=>a.push(["Пожелание "+(j+1),x]));T.push(["Пожелания клиента",a,"kv"])}}
 const sect=(t,g,extra=[],f=()=>true)=>{const a=L.filter(l=>g.includes(l.g)&&!l.auto&&f(l)).map(l=>[l.n,l.d]).concat(extra).filter((x,i,arr)=>arr.findIndex(y=>y[0]==x[0])==i);if(a.length)T.push([t,a,"kv"])};
 sect("Подготовка",["prep"]);sect("Дизайн",["design"],L.filter(l=>l.id=="a_pd"||l.id=="a_sd").map(l=>[l.n,l.d]));
 sect("Вёрстка и технические требования",["plat"],[["Общие требования","Валидная вёрстка, HTTPS, корректная работа форм, быстрая загрузка, отображение в актуальных версиях браузеров."]]);
 sect("Функции и интеграции",["func"]);sect("SEO, аналитика и юридические требования",["launch"]);
 sect("Домен, хостинг и сервер",["host"],[],l=>!l.client&&!l.month);
 {const m=L.filter(l=>l.month);if(m.length)T.push(["Ежемесячные услуги после запуска",m.map(l=>[l.n,l.d]),"kv"])}
 const give=["Тексты о компании, услугах/товарах и контакты (или согласование текстов исполнителя)","Фото, видео, логотип и фирменный стиль (при наличии)","Примеры сайтов, которые нравятся и не нравятся"];
 if(has("dom_pay")||has("dom_reg"))give.push("Оплата домена на имя заказчика по тарифу регистратора, доступ к кабинету регистратора");
 if(S.plat=="tilda")give.push("Аккаунт и оплаченный тариф Тильды (или доступ к нему)");if(has("host_own"))give.push("Хостинг или VPS, оплаченный по тарифу провайдера, и доступы к нему");
 if(has("f_pay"))give.push("ИП/ООО/самозанятость и подключённая ЮKassa, доступы к кабинету");if(has("f_crm")||has("t_crm"))give.push("Доступ к CRM (Битрикс24/amoCRM) для настройки интеграции");
 if(has("f_tg")||has("t_forms"))give.push("Telegram-аккаунт/чат для уведомлений");if(has("metrika")||has("t_analytics")||has("direct"))give.push("Доступ к Яндекс ID для Метрики, Вебмастера"+(has("direct")?" и Директа; рекламный бюджет":""));
 if(has("srv_dns"))give.push("Доступ к DNS домена для настройки почты");if(has("f_lang"))give.push("Переводы текстов на дополнительные языки");if(has("b_rev"))give.push("Отзывы клиентов");if(has("b_cat")||S.type=="shop")give.push("Список товаров/услуг с описаниями, ценами и фото");
 T.push(["Что предоставляет заказчик",give,"ul"]);
 const stg=[];if(L.some(l=>l.g=="prep"))stg.push("Подготовка: бриф, исследование, структура");if(L.some(l=>l.g=="design"))stg.push("Дизайн: прототип и макеты, согласование с заказчиком");
 stg.push("Разработка: вёрстка, блоки и функции на выбранной платформе");if(has("content"))stg.push("Наполнение контентом");stg.push("Тестирование и запуск: проверка, публикация, подключение домена");
 if(has("seo")||has("metrika")||has("t_analytics")||has("direct"))stg.push("SEO, аналитика"+(has("direct")?" и запуск рекламы":""));if(L.some(l=>l.month))stg.push("Сопровождение: размещение и поддержка по ежемесячному тарифу");T.push(["Этапы работ",stg,"ol"]);
 T.push(["Критерии приёмки",["Все блоки и страницы из ТЗ реализованы и соответствуют согласованным макетам/структуре","Сайт корректно отображается на телефоне, планшете и десктопе","Формы отправляют заявки, уведомления приходят по указанным каналам","Сайт опубликован на домене заказчика и открывается по HTTPS"].concat(has("metrika")||has("t_analytics")?["Метрика собирает данные, цели на заявки срабатывают"]:[],has("cookie")?["Есть баннер cookie, политика конфиденциальности и согласия в формах"]:[],has("f_pay")?["Тестовая оплата проходит успешно"]:[],has("srv_backup")?["Резервная копия создаётся и восстанавливается"]:[],["Заказчику переданы доступы к сайту и инструкции"]),"ul"]);
 {const cu=L.filter(l=>l.custom);if(cu.length)T.push(["Дополнительные работы",cu.map(l=>[l.n+(l.est?" (оценим отдельно)":""),l.d]),"kv"])}
 if(INT&&(S.risks||"").trim())T.push(["Примечания и риски",[S.risks.trim()],"p"]);
 T.push(["Не входит в работы",[noteP().replace("В стоимость не входит: ","")],"p"]);return T}
function docTZ(){const T=tzData(),c=totals();let body="";
 T.forEach(([t,a,k],i)=>{let h=`<div class="d-tzs"><h3><b>${i+1}.</b> ${esc(t)}</h3>`;
  if(k=="kv")h+=`<table class="d-t kv"><tbody>${a.map(([x,y])=>`<tr><td>${esc(x)}</td><td>${esc(y)}</td></tr>`).join("")}</tbody></table>`;
  else if(k=="struct")h+=a.map(([n,r])=>`<h4>${esc(n)}</h4><table class="d-t kv"><tbody>${r.map(([x,y],j)=>`<tr><td>${j+1}. ${esc(x)}</td><td>${esc(y)}</td></tr>`).join("")}</tbody></table>`).join("");
  else if(k=="p")h+=a.map(x=>`<p>${esc(x).replace(/\n/g,"<br>")}</p>`).join("");else h+=`<${k}>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</${k}>`;body+=h+"</div>"});
 return `<div class="d-doc" id="doc-tz">${cover("tz",c)}<section class="d-pg flow"><div class="d-kick"><span>ТЗ</span>${INT?"Техническое задание":"Предварительное техническое задание"}</div><h2>${esc(S.proj||"Разработка сайта")}</h2>${body}${PF}</section>${contactsPg("✓")}</div>`}
function docBrief(){const L=lines(),rows=BRIEF.filter(([k])=>(S.brief[k]||"").trim());
 const body=`<table class="d-t kv"><tbody>${(rows.length?rows:BRIEF.slice(0,6)).map(([k,l])=>`<tr><td>${esc(l)}</td><td>${esc(S.brief[k]||"—").replace(/\n/g,"<br>")}</td></tr>`).join("")}</tbody></table>
 <h3>Выбранная конфигурация</h3><table class="d-t kv"><tbody><tr><td>Тип сайта</td><td>${esc(typeN())}</td></tr><tr><td>Платформа</td><td>${esc(platN())}</td></tr>${pnL().length?`<tr><td>Страницы</td><td>${esc(pnL().join(", "))}</td></tr>`:""}</tbody></table>
 ${grpL(L).map(([g,a])=>`<h4>${g}</h4><ul>${a.map(l=>`<li>${esc(l.n)}${lineTag(l)}${l.custom&&l.d?`<br><small>${esc(l.d)}</small>`:""}</li>`).join("")}</ul>`).join("")}
 <p class="d-note">Ссылка на расчёт: <a href="${esc(linkUrl(false))}">открыть в калькуляторе</a></p>`;
 return `<div class="d-doc" id="doc-brief"><section class="d-pg flow"><div class="d-brand">Lead<b>.</b>web</div><div class="d-kick"><span>БР</span>Бриф на разработку сайта</div><h2>${esc(clientName()||"Новый проект")}</h2><p class="d-date">Дата: ${fd(iso(new Date()))}</p>${body}${PF}</section></div>`}
function renderDocs(which){const el=$("lcDocs");if(!el)return;const map={kp:docKP,tz:docTZ,brief:docBrief};el.innerHTML=which.filter(k=>map[k]).map(k=>map[k]()).join("")}
function printDocs(which){if(!which.length){msg("Отметьте хотя бы один документ.");return}renderDocs(which);document.documentElement.classList.add("lc-printing");
 const t=document.title;document.title=(which.includes("kp")?"КП":which.includes("tz")?"ТЗ":"Бриф")+(clientName()?" — "+clientName():"")+" — Lead.web";
 const done=()=>{document.documentElement.classList.remove("lc-printing");document.title=t;window.removeEventListener("afterprint",done)};window.addEventListener("afterprint",done);setTimeout(()=>{window.print();setTimeout(done,1500)},60)}

/* ===== request summary ===== */
function summaryText(url){const L=lines(),c=totals(L),b=S.brief,o=[];
 o.push("Здравствуйте! Хочу обсудить сайт. Мой расчёт в калькуляторе Lead.web:");
 o.push("• "+(D.TYPES.find(t=>t[0]==S.type)||[])[1]+", "+platN()+(S.type=="multi"?`, ${S.pages+1} стр.`:""));
 o.push("• Разработка: "+(INT?rub(c.I):c.I?rangeT(c.I):"—"));if(c.Im)o.push("• Ежемесячно: "+(INT?rub(c.Im)+"/мес":rangeT(c.Im,"/мес")));
 o.push("• Пунктов: "+L.filter(l=>!l.custom).length+(c.est?`, доп.: ${L.filter(l=>l.est).map(l=>l.n).join("; ")}`:""));
 const who=[b.company&&"Компания: "+b.company,b.niche&&"Ниша: "+b.niche,b.deadline&&"Сроки: "+b.deadline,b.budget&&"Бюджет: "+b.budget,b.name&&"Имя: "+b.name,b.contact&&"Контакт: "+b.contact,b.email&&"Email: "+b.email].filter(Boolean);
 if(who.length)o.push(who.join("; "));if((b.goals||"").trim())o.push("Цели: "+b.goals.trim().slice(0,300));if(url)o.push("Расчёт: "+url);return o.join("\n")}
function copy(t){return navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(t):Promise.reject()}
const hooks={};
function init(opts={}){Object.assign(hooks,opts.hooks||{});VIEW=!!opts.view;const how=readHash();
 if(!INT&&fresh&&!how&&!Object.keys(S.sel).length&&!S.custom.length)preset(PRESETS[0]);
 if(INT&&fresh&&!how&&!Object.keys(S.sel).length&&!S.custom.length)preset(PRESETS[0]);
 const bn=$("lcBanner");if(bn&&banner){bn.textContent=banner;bn.hidden=false}
 renderPresets();renderAll();bind();return how}
return {D,MODE,INT,$,esc,r2,rub,num,fd,iso,plus,get S(){return S},set S(v){S=migrate(v)},migrate,save,lines,totals,range,rangeT,daysText,autoDays,platN,typeN,sched,noteP,tzData,wishL,clientName,
 renderAll,renderGroups,updSummary,renderDocs,printDocs,docKP,docTZ,docBrief,linkUrl,compact,fromCompact,summaryText,copy,msg,init,preset,PRESETS,BRIEF,hooks,setView:v=>VIEW=v};
})();
