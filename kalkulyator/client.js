/* vaybik.ru — клиентский режим калькулятора: документы, ссылка и заявка. */
(function(){
"use strict";
const {$}=LW;LW.init();
const which=()=>["kp","brief","tz"].filter(k=>LW.S.docs[k]);
document.querySelectorAll("[data-doc]").forEach(cb=>{cb.checked=!!LW.S.docs[cb.dataset.doc];cb.addEventListener("change",()=>{LW.S.docs[cb.dataset.doc]=cb.checked;LW.save();if(!$("lcDocs").hidden)LW.renderDocs(which())})});
$("lcPdf").onclick=()=>LW.printDocs(which());
$("lcPreview").onclick=()=>{const d=$("lcDocs"),open=d.hidden;if(open)LW.renderDocs(which());d.hidden=!open;$("lcPreview").setAttribute("aria-expanded",open);$("lcPreview").textContent=open?"Скрыть предпросмотр":"Предпросмотр документов"};
LW.hooks.onChange=()=>{const d=$("lcDocs");if(d&&!d.hidden){clearTimeout(window._lcr);window._lcr=setTimeout(()=>LW.renderDocs(which()),400)}};
const link=()=>{let u=LW.linkUrl(true);if(u.length>1800)u=LW.linkUrl(false);return u};
$("lcLink").onclick=()=>{const u=link();$("lcLinkOut").value=u;$("lcLinkOut").hidden=false;LW.copy(u).then(()=>LW.msg("Ссылка на расчёт скопирована. По ней откроется тот же выбор."),()=>{$("lcLinkOut").select();LW.msg("Скопируйте ссылку из поля.")})};
function need(){const b=LW.S.brief;if(!(b.contact||"").trim()&&!(b.email||"").trim()){LW.msg("Оставьте телефон, Telegram или email в брифе — так мы сможем ответить.");const f=document.querySelector('[data-b="contact"]');f&&f.focus();return false}return true}
$("lcTg").onclick=e=>{const t=LW.summaryText(link());LW.copy(t).catch(()=>{});e.currentTarget.href=LW.D.CONTACTS.tgUrl+"?text="+encodeURIComponent(t);LW.msg("Открываем Telegram. Текст заявки уже в сообщении и скопирован — если не подставился, просто вставьте его.")};
$("lcMail").onclick=e=>{if(!need()){e.preventDefault();return}const t=LW.summaryText(link());e.currentTarget.href="mailto:"+LW.D.CONTACTS.mail+"?subject="+encodeURIComponent("Заявка с калькулятора vaybik.ru"+(LW.S.brief.company?" — "+LW.S.brief.company:""))+"&body="+encodeURIComponent(t)};
$("lcCopy").onclick=()=>{const t=LW.summaryText(link());LW.copy(t).then(()=>LW.msg("Текст заявки скопирован."),()=>{$("lcLinkOut").value=t;$("lcLinkOut").hidden=false;$("lcLinkOut").select();LW.msg("Скопируйте текст из поля.")})};
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{const t=$(b.dataset.go);if(t){t.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});const f=t.querySelector("input,textarea,button");f&&setTimeout(()=>f.focus({preventScroll:true}),400)}}));
})();
window.addEventListener("beforeprint",()=>{const h=document.documentElement;if(!h.classList.contains("lc-printing")){LW.renderDocs(["kp","brief","tz"].filter(k=>LW.S.docs[k]));h.classList.add("lc-printing","lc-autoprint")}});
window.addEventListener("afterprint",()=>{const h=document.documentElement;if(h.classList.contains("lc-autoprint"))h.classList.remove("lc-printing","lc-autoprint")});
