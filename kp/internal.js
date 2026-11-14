/* Lead.web — внутренний режим (/leadweb/kp/): презентация, сбор данных, расчёт с часами, КП/ТЗ/бриф,
   Google Таблица, импорт/экспорт. Общий движок — /leadweb/kalkulyator/calc.js. */
(function(){
"use strict";
const {$,esc,r2,rub,fd,iso,D}=LW;
const SITE=D.CONTACTS.site;

/* ===== hash: старые ссылки конструктора КП ===== */
const H=location.hash;let VIEW=null,IDLOAD=null,LEGACY=null,banner="";
{const m=H.match(/^#id=([\w-]+)(?:&d=(kp|tz|brief))?/);if(m){VIEW=m[2]||"kp";IDLOAD=m[1]}}
if(/^#(kp|tz)=/.test(H))VIEW=H.slice(1,3);
if(H.startsWith("#calc="))LEGACY=H.slice(6);
LW.init({view:!!VIEW});
if(VIEW&&!IDLOAD){try{LW.S=D.decState(H.slice(4))}catch(e){VIEW=null;banner="Ссылка на документ повреждена."}}
if(LEGACY){try{const c=D.decState(LEGACY),S=LW.S;S.sel={};S.hov={};if(c.rate!=null)S.rate=+c.rate||S.rate;if(c.tax!=null)S.tax=+c.tax;S.proj=c.proj||S.proj;S.client=c.client||S.client;
  S.custom=(c.items||[]).filter(i=>i.on).map(i=>({g:"func",n:String(i.n||""),d:"",h:+i.h||0,on:true}));banner="Загружен расчёт из калькулятора смет: пункты добавлены в «Функции → Дополнительно». Можно дополнить бриф галочками.";
  history.replaceState(null,"",location.pathname);LW.save()}catch(e){banner="Не удалось прочитать расчёт из калькулятора смет."}}
if(banner){const b=$("lcBanner");b.textContent=banner;b.hidden=false}

/* ===== slides (content.js) ===== */
const DEF=JSON.parse(JSON.stringify(C));let EDITS={};try{EDITS=JSON.parse(localStorage.getItem("kv_slide_edits")||"{}")}catch(e){}
const getP=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
function setP(o,p,v){const k=p.split(".");let a=o;for(let i=0;i<k.length-1;i++)a=a[k[i]];a[k[k.length-1]]=v}
function applyEdits(){const fresh=JSON.parse(JSON.stringify(DEF));Object.keys(C).forEach(k=>C[k]=fresh[k]);for(const p in EDITS){try{if(getP(C,p)!=null)setP(C,p,EDITS[p])}catch(e){}}}
applyEdits();
const E=(p,tag="span",cls="")=>`<${tag} class="${cls}" data-e="${p}">${esc(getP(C,p))}</${tag}>`;
const short=u=>u.replace(/^https?:\/\//,"").replace(/\/$/,"");
const sh=(kick,title,body,cls="")=>`<div class="sl ${cls}"><div class="skick">${kick}</div><h2>${title}</h2>${body}<div class="sfoot">Lead.web · сайты, которые приводят заявки</div></div>`;
function slides(){const s=[];
 s.push(`<div class="sl scover"><div class="skick">${E("deck.kicker")}</div><div class="sh1">${E("deck.brand")}</div><div class="stag">${E("deck.tagline")}</div><div class="sbar"></div></div>`);
 s.push(sh("Знакомство",E("team.title"),`<p class="slead">${E("team.lead")}</p><div class="sg2">${C.team.people.map((p,j)=>`<div class="sc"><div class="spn">${E(`team.people.${j}.n`)}</div><div class="spr">${E(`team.people.${j}.r`)}</div><div class="spy">${E(`team.people.${j}.y`)}</div><p>«${E(`team.people.${j}.q`)}»</p></div>`).join("")}</div>`));
 s.push(sh("Знакомо?",E("pains.title"),`<div class="sg2">${C.pains.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`pains.items.${j}.0`)}</h3><p>${E(`pains.items.${j}.1`)}</p></div>`).join("")}</div><div class="sband">${E("pains.foot")}</div>`));
 s.push(sh("Что мы делаем",E("services.title"),`<div class="sg4">${C.services.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`services.items.${j}.0`)}</h3><p>${E(`services.items.${j}.1`)}</p></div>`).join("")}</div>`));
 s.push(sh("Процесс",E("process.title"),`<div class="sproc">${C.process.items.map((p,j)=>`<div class="sp"><div class="snum">${j+1}</div><h3>${E(`process.items.${j}.0`)}</h3><p>${E(`process.items.${j}.1`)}</p><div class="sget">→ ${E(`process.items.${j}.2`)}</div></div>`).join("")}</div>`));
 ["case1","case2"].forEach((k,n)=>s.push(sh("Кейс "+(n+1),E(k+".title"),`<a class="surl" href="${esc(C[k].url)}" target="_blank" rel="noopener">${esc(short(C[k].url))}</a><div class="scase"><div class="sc"><h3>Было</h3><p>${E(k+".was")}</p></div><div class="sc"><h3>Сделали</h3><ul>${C[k].did.map((d,j)=>`<li>${E(`${k}.did.${j}`)}</li>`).join("")}</ul></div><div class="sc dark"><h3>Результат</h3><p>${E(k+".res")}</p></div></div>`)));
 s.push(sh("Кейсы",E("list.title"),`<div class="slist">${C.list.groups.map(([g,a],gi)=>`<div><h3>${esc(g)}</h3><ul>${a.map(([t,u],j)=>`<li>${E(`list.groups.${gi}.1.${j}.0`)} — <a href="${esc(u)}" target="_blank" rel="noopener">${esc(short(u))}</a></li>`).join("")}</ul></div>`).join("")}</div>`,"slong"));
 s.push(sh("Чем мы отличаемся",E("why.title"),`<p class="slead">${E("team.lead")}</p><div class="sg3">${C.why.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`why.items.${j}.0`)}</h3><p>${E(`why.items.${j}.1`)}</p></div>`).join("")}</div>`));
 s.push(`<div class="sl scont"><div class="skick">Контакты</div><h2>${E("contacts.title")}</h2><p class="slead">${E("contacts.lead")}</p><div class="scl"><a href="${C.contacts.tgUrl}" target="_blank" rel="noopener"><small>Telegram</small>${esc(C.contacts.tg)}</a><a href="${C.contacts.tel}"><small>Телефон</small>${esc(C.contacts.phone)}</a><a href="mailto:${C.contacts.mail}"><small>Почта</small>${esc(C.contacts.mail)}</a><a href="${SITE}" target="_blank" rel="noopener"><small>Сайт</small>Lead.web</a></div></div>`);
 return s}
let cur=0,editing=false,NS=0,step=1,doc="kp";
function renderDeck(){const s=slides();NS=s.length;$("deck").innerHTML=s.map((h,j)=>h.replace('class="sl','data-i="'+j+'" class="sl')).join("");$("dots").innerHTML=s.map((_,j)=>`<button type="button" data-j="${j}" aria-label="Слайд ${j+1}"></button>`).join("");setEdit(editing);go(cur)}
function go(i){cur=Math.max(0,Math.min(NS-1,i));[...$("deck").children].forEach((e,j)=>e.classList.toggle("on",j==cur));[...$("dots").children].forEach((e,j)=>e.classList.toggle("on",j==cur));$("cnt").textContent=$("fscnt").textContent=(cur+1)+" / "+NS}
function setEdit(v){editing=v;$("deck").querySelectorAll("[data-e]").forEach(e=>e.contentEditable=v?"true":"false");$("deck").classList.toggle("editing",v);$("edit").textContent=v?"Готово":"Редактировать";$("edit").classList.toggle("on",v)}
function initDeck(){renderDeck();
 $("prev").onclick=()=>go(cur-1);$("next").onclick=()=>go(cur+1);$("dots").onclick=e=>{if(e.target.dataset.j!=null)go(+e.target.dataset.j)};
 $("edit").onclick=()=>setEdit(!editing);
 $("reset").onclick=()=>{if(!confirm("Сбросить все правки текстов слайдов?"))return;EDITS={};localStorage.removeItem("kv_slide_edits");applyEdits();renderDeck()};
 $("deck").addEventListener("input",e=>{const p=e.target.closest("[data-e]");if(!p)return;const v=p.textContent;EDITS[p.dataset.e]=v;setP(C,p.dataset.e,v);localStorage.setItem("kv_slide_edits",JSON.stringify(EDITS))});
 $("fs").onclick=()=>{const st=$("stage");document.fullscreenElement?document.exitFullscreen():(st.requestFullscreen||st.webkitRequestFullscreen).call(st)};
 document.addEventListener("keydown",e=>{if(step!=1||$("cwrap").hidden||editing&&e.target.isContentEditable)return;if(["INPUT","TEXTAREA","SELECT","BUTTON"].includes(e.target.tagName)&&e.key==" ")return;if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();go(cur+1)}else if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();go(cur-1)}else if(e.key=="Home")go(0);else if(e.key=="End")go(NS-1);else if(e.key=="f")$("fs").click()});
 let tx=null,ty=null;$("stage").addEventListener("touchstart",e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
 $("stage").addEventListener("touchend",e=>{if(tx==null||editing)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(cur+(dx<0?1:-1));tx=null},{passive:true});
 const m=v=>{$("gwrap").hidden=!v;$("cwrap").hidden=v;$("modeG").classList.toggle("on",v);$("modeC").classList.toggle("on",!v);$("modeG").setAttribute("aria-pressed",v);$("modeC").setAttribute("aria-pressed",!v);localStorage.setItem("kv_deck",v?"g":"c");if(!v)go(cur)};
 $("modeG").onclick=()=>m(true);$("modeC").onclick=()=>m(false);m(localStorage.getItem("kv_deck")!="c")}

/* ===== step 2: wishes ===== */
function renderW(){const S=LW.S;$("wl").innerHTML=S.wish.map((x,j)=>`<div class="kp-wrow"><input type="text" value="${esc(x)}" data-w="${j}" placeholder="Например: онлайн-запись, каталог, отзывы…" aria-label="Пожелание ${j+1}"><button type="button" class="lc-x" data-wx="${j}" aria-label="Удалить пожелание">×</button></div>`).join("")}
function initW(){const S=()=>LW.S;$("needs").value=S().needs||"";$("needs").oninput=()=>{S().needs=$("needs").value;LW.save()};
 $("wl").oninput=e=>{const j=e.target.dataset.w;if(j!=null){S().wish[j]=e.target.value;LW.save()}};
 $("wl").onclick=e=>{const b=e.target.closest("[data-wx]");if(b){S().wish.splice(+b.dataset.wx,1);renderW();LW.save()}};
 $("addW").onclick=()=>{S().wish.push("");renderW();const i=$("wl").querySelectorAll("input");i[i.length-1].focus();LW.save()};
 $("toBrief").onclick=()=>setStep(3);renderW()}

/* ===== step 3 extras: client/project, rate/tax ===== */
function initCalcExtras(){const S=()=>LW.S;["client","proj","task"].forEach(k=>{$(k).value=S()[k]||"";$(k).oninput=()=>{S()[k]=$(k).value;LW.save()}});
 ["rate","tax"].forEach(k=>{$(k).value=S()[k];$(k).oninput=()=>{S()[k]=+$(k).value||0;LW.renderGroups()}});
 $("toDocs").onclick=()=>setStep(4)}

/* ===== step 4: documents ===== */
const BLK=[["team","О команде"],["why","Почему мы"],["case1","Кейс: "+C.case1.title],["case2","Кейс: "+C.case2.title],["list","Более 140 проектов"]];
function renderDoc(){LW.renderDocs([doc]);document.querySelectorAll(".kp-dtabs button").forEach(b=>{const on=b.dataset.d==doc;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
 const k=LW.S.kp;$("stBox").hidden=k.pay!="st";$("kpset").hidden=doc!="kp";$("tzset").hidden=doc!="tz";const c=LW.totals();$("dHint").textContent="Авто: "+LW.autoDays(c)+" раб. дн. ("+r2(c.H)+" ч ÷ "+(k.hpd||6)+" ч/день)";
 document.title=({kp:"КП",tz:"ТЗ",brief:"Бриф"}[doc])+(LW.clientName()?" — "+LW.clientName():"")+" — Lead.web"}
function initDocs(){const k=()=>LW.S.kp;["date","valid","stages","days"].forEach(x=>{$(x).value=k()[x];$(x).oninput=()=>{k()[x]=$(x).value;LW.save();renderDoc()}});
 $("hpd").value=k().hpd;$("hpd").oninput=()=>{k().hpd=+$("hpd").value||6;LW.save();renderDoc()};
 $("pay").value=k().pay;$("pay").onchange=()=>{k().pay=$("pay").value;if(k().pay=="st"&&!String(k().stages).trim()){k().stages="Предоплата; 30\nДизайн / прототип; 30\nРазработка; 30\nЗапуск; 10";$("stages").value=k().stages}LW.save();renderDoc()};
 $("kpb").innerHTML=BLK.map(([x,n])=>`<label class="kp-ck"><input type="checkbox" data-bk="${x}" ${k().b[x]?"checked":""}><span>${esc(n)}</span></label>`).join("");$("kpb").onchange=e=>{k().b[e.target.dataset.bk]=e.target.checked;LW.save();renderDoc()};
 document.querySelector(".kp-dtabs").onclick=e=>{const b=e.target.closest("[data-d]");if(b){doc=b.dataset.d;renderDoc()}};
 $("risks").value=LW.S.risks||"";$("risks").oninput=()=>{LW.S.risks=$("risks").value;LW.save();renderDoc()};
 $("pdf").onclick=()=>LW.printDocs([doc]);$("txt").onclick=()=>dl((doc=="kp"?"kp-":doc=="tz"?"tz-":"brief-")+(k().date||"")+".txt",doc=="kp"?txtKP():doc=="tz"?txtTZ():txtBrief());
 $("share").onclick=()=>{const u=shareUrl(doc);out(u,"Ссылка на "+({kp:"КП",tz:"ТЗ",brief:"бриф"}[doc])+" скопирована.")};
 $("shareCalc").onclick=()=>{const u=location.origin+"/leadweb/kalkulyator/#c="+D.encState(LW.compact(true));out(u,"Ссылка на клиентский калькулятор с этим выбором скопирована.")}}
function out(u,okMsg){$("link").value=u;$("link").select();LW.copy(u).then(()=>m(okMsg),()=>m("Скопируйте ссылку из поля."))}
const m=t=>{$("msg").textContent=t};
function shareUrl(d){const base=location.origin+location.pathname,S=LW.S;if(d=="brief")return base+"#c="+D.encState(LW.compact(true));if(S.mid&&localStorage.getItem("kv_saved")==D.encState(S))return base+"#id="+S.mid+"&d="+d;return base+"#"+d+"="+D.encState(S)}
function dl(name,s){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+s],{type:"text/plain;charset=utf-8"}));a.download=name;a.click()}
const CT=()=>`Контакты: Telegram ${D.CONTACTS.tg} (${D.CONTACTS.tgUrl}), ${D.CONTACTS.phone}, ${D.CONTACTS.mail}, ${SITE}\n`;
function txtKP(){const S=LW.S,L=LW.lines(),c=LW.totals(L),DD="-".repeat(64),pad=(a,n)=>a.length>=n?a:a+" ".repeat(n-a.length),grp=a=>D.GROUPS.map(([g,n])=>[n,a.filter(l=>l.g==g)]).filter(x=>x[1].length);
 let s=`КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ — Lead.web (${SITE})\n${DD}\n`+(LW.clientName()?`Клиент: ${LW.clientName()}\n`:"")+`Проект: ${S.proj||"—"}\nДата: ${fd(S.kp.date)}\n`+(S.kp.valid?`Действительно до: ${fd(S.kp.valid)}\n`:"")+(S.task.trim()?`\nЗадача клиента:\n${S.task.trim()}\n`:"");
 {const w=LW.wishL();if(S.needs.trim()||w.length)s+=`\nПожелания клиента:\n`+(S.needs.trim()?S.needs.trim()+"\n":"")+w.map(x=>"- "+x+"\n").join("")}
 s+=`\nПлатформа: ${LW.platN()}\nТип сайта: ${LW.typeN()}\n\n${DD}\nСТОИМОСТЬ РАБОТ (ставка ${rub(c.rate)} / час)\n${DD}\n`;
 const row=l=>{const t="- "+l.n+(l.client?` (оплачивает заказчик, ${l.ref})`:"")+(l.est?" (оценим отдельно)":"");return (t.length>45?t+"\n"+" ".repeat(46):pad(t,46))+(l.client||l.est?"—":pad(String(r2(l.h)),7)+rub(l.h*c.rate))+"\n"};
 grp(L.filter(l=>!l.month)).forEach(([g,a])=>{s+=`\n${g.toUpperCase()}\n`;a.forEach(l=>s+=row(l))});
 s+=`\n${DD}\nЧасов всего:               ${r2(c.H)}\nПредварительная стоимость: ${rub(c.S)}\nНалог ${c.tax}%:                  ${rub(c.T)}\nИТОГО РАЗОВО:              ${rub(c.I)}\n`;
 const mo=L.filter(l=>l.month);if(mo.length){s+=`\nЕЖЕМЕСЯЧНО\n`;mo.forEach(l=>s+=row(l));s+=`Итого в месяц (с налогом): ${rub(c.Im)}\n`}
 s+=`\n${LW.noteP()}\n\n${DD}\nГРАФИК ОПЛАТЫ\n`;LW.sched().forEach(([t,p])=>s+=`- ${t}: ${p}% — ${rub(c.I*p/100)}\n`);s+=`Ориентировочный срок: ${LW.daysText(c)}\n\n${DD}\n`+CT();return s}
function txtTZ(){const DD="-".repeat(64);let s=`ТЕХНИЧЕСКОЕ ЗАДАНИЕ — Lead.web (${SITE})\n${DD}\n`;
 LW.tzData().forEach(([t,a,k],i)=>{s+=`\n${i+1}. ${t.toUpperCase()}\n`;if(k=="kv")a.forEach(([x,y])=>s+=`- ${x}: ${y}\n`);else if(k=="struct")a.forEach(([n,r])=>{s+=`${n}:\n`;r.forEach(([x,y],j)=>s+=`  ${j+1}. ${x} — ${y}\n`)});else if(k=="p")a.forEach(x=>s+=x+"\n");else a.forEach((x,j)=>s+=(k=="ol"?(j+1)+". ":"- ")+x+"\n")});
 return s+`\n${DD}\n`+CT()}
function txtBrief(){const S=LW.S;let s=`БРИФ — Lead.web\n${"-".repeat(64)}\n`;LW.BRIEF.forEach(([k,l])=>{if((S.brief[k]||"").trim())s+=`${l}: ${S.brief[k].trim()}\n`});return s+"\n"+LW.summaryText(location.origin+"/leadweb/kalkulyator/#c="+D.encState(LW.compact(false)))+"\n"}
function jdl(name,o){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:"application/json"}));a.download=name;a.click()}
function initIO(){let mode="";const f=$("impF"),num=x=>typeof x=="number"&&isFinite(x)&&x>=0;
 $("expS").onclick=()=>{const S=LW.S;jdl("leadweb-settings-"+iso(new Date())+".json",{kind:"leadweb-settings",v:2,rate:S.rate,tax:S.tax,hov:S.hov,custom:S.custom,slideEdits:EDITS})};
 $("expM").onclick=()=>{const S=LW.S;jdl("leadweb-meeting-"+(LW.clientName()||"client").replace(/[^\wа-яё-]+/gi,"_")+"-"+(S.kp.date||"")+".json",{kind:"leadweb-meeting",v:2,state:S})};
 $("impS").onclick=()=>{mode="s";f.value="";f.click()};$("impM").onclick=()=>{mode="m";f.value="";f.click()};
 f.onchange=async()=>{const file=f.files[0];if(!file)return;let o;try{o=JSON.parse(await file.text())}catch(e){alert("Файл не является корректным JSON.");return}
  try{const S=LW.S;if(mode=="s"){if(o.kind!="leadweb-settings")throw new Error("это не файл настроек Lead-web");
    if(o.rate!=null&&!num(o.rate))throw new Error("ставка должна быть числом");if(o.tax!=null&&(!num(o.tax)||o.tax>100))throw new Error("налог 0–100");
    if(o.hov&&(typeof o.hov!="object"||Object.values(o.hov).some(v=>!num(v))))throw new Error("часы по пунктам должны быть числами");
    if(o.custom&&(!Array.isArray(o.custom)||o.custom.some(c=>typeof c!="object"||typeof c.n!="string"||!num(+c.h))))throw new Error("неверные свои строки");
    if(o.slideEdits&&typeof o.slideEdits!="object")throw new Error("неверные правки слайдов");
    const parts=[o.rate!=null&&"ставка "+o.rate+" ₽",o.tax!=null&&"налог "+o.tax+"%",o.hov&&Object.keys(o.hov).length+" правок часов",o.custom&&o.custom.length+" своих строк",o.slideEdits&&Object.keys(o.slideEdits).length+" правок слайдов"].filter(Boolean);
    if(!confirm("Импортировать настройки?\n"+parts.join(", ")+"\nТекущие значения будут заменены."))return;
    if(o.rate!=null)S.rate=o.rate;if(o.tax!=null)S.tax=o.tax;if(o.hov)S.hov=o.hov;if(o.custom)LW.S=Object.assign(S,{custom:o.custom});
    if(o.slideEdits){EDITS=o.slideEdits;localStorage.setItem("kv_slide_edits",JSON.stringify(EDITS))}LW.save();location.reload()}
   else{if(o.kind!="leadweb-meeting"||!o.state||typeof o.state!="object")throw new Error("это не файл встречи Lead-web");const st=o.state;
    if(st.sel&&typeof st.sel!="object"||st.custom&&!Array.isArray(st.custom)||st.rate!=null&&!num(st.rate))throw new Error("повреждённые данные встречи");
    if(!confirm("Открыть встречу «"+(st.client||"без клиента")+" — "+(st.proj||"")+"»?\nТекущая встреча в этом браузере будет заменена."))return;
    LW.S=st;LW.save();location.reload()}}
  catch(e){alert("Импорт отменён: "+e.message)}}}

/* ===== navigation ===== */
function setStep(n){step=n;document.body.dataset.step=n;document.querySelectorAll(".kp-tabs [data-s]").forEach(b=>{const on=+b.dataset.s==n;b.classList.toggle("on",on);b.setAttribute("aria-selected",on);b.tabIndex=on?0:-1});
 if(n==2)renderW();if(n==3){LW.renderAll();initCalcExtras()}if(n==4)renderDoc();window.scrollTo(0,0)}
window.addEventListener("beforeprint",()=>{if(!document.documentElement.classList.contains("lc-printing")&&!VIEW&&step!=4)LW.renderDocs([doc])});
window.KP={setStep,shareUrl,m,get doc(){return doc}};

if(VIEW){doc=VIEW;document.body.classList.add("kp-view");document.body.dataset.step=4;
 if(IDLOAD){$("lcDocs").innerHTML='<section class="d-pg"><p class="d-lead">Загружаю документ…</p></section>';const u=(localStorage.getItem("kv_sheets_url")||(typeof SHEETS_URL!=="undefined"?SHEETS_URL:"")).trim();
  fetch(u+(u.includes("?")?"&":"?")+"id="+encodeURIComponent(IDLOAD)).then(r=>r.json()).then(j=>{if(!j.ok)throw new Error(j.error||"не найдено");LW.S=typeof j.state=="string"?JSON.parse(j.state):j.state;LW.renderDocs([doc]);document.body.dataset.ready=1})
  .catch(e=>{$("lcDocs").innerHTML=`<section class="d-pg"><p class="d-lead">Не удалось загрузить документ: ${esc(e.message)}</p></section>`})}
 else{LW.renderDocs([doc]);document.body.dataset.ready=1}}
else{const tabs=document.querySelector(".kp-tabs");tabs.addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(b)setStep(+b.dataset.s)});
 tabs.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const n=e.key=="Home"?1:e.key=="End"?4:Math.min(4,Math.max(1,step+(e.key=="ArrowRight"?1:-1)));setStep(n);tabs.querySelector(`[data-s="${n}"]`).focus()});
 initDeck();initW();initCalcExtras();initDocs();initIO();setStep(LEGACY?3:1)}
})();
