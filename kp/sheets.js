// Сохранение встреч в Google Таблицу через Apps Script (POST text/plain — без CORS preflight). Перенесено из kp-konstruktor.
(function(){
const LS="kv_sheets_url",$=LW.$,esc=LW.esc,D=LW.D;
const url=()=>(localStorage.getItem(LS)||(typeof SHEETS_URL!=="undefined"?SHEETS_URL:"")||"").trim();
const NOURL="Таблица не подключена: нажмите «⚙ Таблица» и вставьте URL веб-приложения Apps Script (…/exec).";
const m=t=>{$("msg").textContent=t};
function fdt(d){const x=new Date(d);return isNaN(x)?String(d||""):x.toLocaleDateString("ru-RU")}
function newId(){return "m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function row(){const S=LW.S;if(!S.mid)S.mid=newId();const c=LW.totals(),base=location.origin+location.pathname,e=D.encState(S);
 return {id:S.mid,date:(S.kp&&S.kp.date)||new Date().toISOString().slice(0,10),client:LW.clientName(),proj:S.proj||"",needs:(S.needs||"").trim(),
  wish:LW.wishL().join("\n"),plat:LW.platN(),hours:Math.round(c.H*10)/10,rate:S.rate,total:Math.round(c.I),
  kpUrl:base+"#kp="+e,tzUrl:base+"#tz="+e,state:JSON.stringify(S)}}
async function saveSheet(){const u=url();if(!u){m(NOURL);openSet();return}
 m("Сохраняю в таблицу…");
 try{const r=await fetch(u,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(row())});const j=await r.json();
  if(!j.ok)throw new Error(j.error||"ошибка");LW.save();localStorage.setItem("kv_saved",D.encState(LW.S));$("link").value=KP.shareUrl(KP.doc);m((j.updated?"Обновлено":"Сохранено")+" в таблице (строка "+j.row+", ID "+j.id+").")}
 catch(e){m("Не удалось сохранить: "+e.message+". Проверьте URL и что доступ к веб-приложению — «Все».")}}
async function openSheet(){const u=url(),box=$("shList");box.hidden=false;
 if(!u){box.innerHTML=`<p class="shw">${NOURL}</p>`;return}
 box.innerHTML="<p>Загружаю список…</p>";
 try{const j=await (await fetch(u+(u.includes("?")?"&":"?")+"action=list")).json();if(!j.ok)throw new Error(j.error);
  box.innerHTML=j.items.length?j.items.map(i=>`<button type="button" class="shi" data-id="${esc(i.id)}"><b>${esc(i.client||"Без клиента")}</b> — ${esc(i.proj||"")}<small>${esc(fdt(i.date))} · ${esc(String(i.plat||""))} · ${Number(i.total||0).toLocaleString("ru")} ₽</small></button>`).join(""):"<p>В таблице пока нет встреч.</p>";
 }catch(e){box.innerHTML=`<p class="shw">Не удалось загрузить: ${esc(e.message)}</p>`}}
async function load(id){const u=url();$("shList").innerHTML="<p>Открываю…</p>";
 try{const j=await (await fetch(u+(u.includes("?")?"&":"?")+"id="+encodeURIComponent(id))).json();if(!j.ok)throw new Error(j.error);
  LW.S=typeof j.state=="string"?JSON.parse(j.state):j.state;LW.S.mid=j.id;LW.save();location.reload()}catch(e){$("shList").innerHTML=`<p class="shw">Не удалось открыть: ${esc(e.message)}</p>`}}
function openSet(){$("shSet").hidden=false;$("shUrl").value=localStorage.getItem(LS)||(typeof SHEETS_URL!=="undefined"?SHEETS_URL:"");$("shUrl").focus()}
function init(){if(!$("toSheet"))return;
 $("toSheet").onclick=saveSheet;$("fromSheet").onclick=openSheet;$("sheetCfg").onclick=openSet;
 $("shList").onclick=e=>{const b=e.target.closest(".shi");if(b)load(b.dataset.id)};
 $("shSave").onclick=()=>{const v=$("shUrl").value.trim();if(v&&!/^https:\/\//.test(v)){alert("URL должен начинаться с https://");return}
  v?localStorage.setItem(LS,v):localStorage.removeItem(LS);$("shSet").hidden=true;m(v?"URL таблицы сохранён в этом браузере.":(url()?"Используется URL из config.js.":NOURL))};
 $("shCancel").onclick=()=>{$("shSet").hidden=true};$("shSet").addEventListener("keydown",e=>{if(e.key=="Escape")$("shSet").hidden=true});
 $("shNew").onclick=()=>{delete LW.S.mid;LW.save();m("Следующее сохранение создаст новую строку в таблице.")};
 if(!url())$("shState").textContent="Таблица не подключена"}
init();
})();
