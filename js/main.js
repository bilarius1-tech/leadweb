(function () {
  var b = document.querySelector(".burger");
  var m = document.getElementById("menu");
  var h = document.querySelector(".hdr");
  var de = document.documentElement;
  var bd = document.body;
  var sy = 0;
  var last = null;
  var mq = window.matchMedia("(min-width: 1024px)");

  function onScroll() {
    if (h) h.classList.toggle("is-scrolled", (window.scrollY || 0) > 4);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeDrops(except) {
    document.querySelectorAll(".nav-item.is-open").forEach(function (item) {
      if (item === except) return;
      item.classList.remove("is-open");
      var btn = item.querySelector(".nav-caret");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll(".nav-item.has-sub").forEach(function (item) {
    var btn = item.querySelector(".nav-caret");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = item.classList.contains("is-open");
      closeDrops(open ? null : item);
      item.classList.toggle("is-open", !open);
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item.has-sub")) closeDrops();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (document.querySelector(".nav-item.is-open")) {
      e.preventDefault();
      closeDrops();
    }
  });

  if (b && m) {
    var x = m.querySelector(".mclose");
    var back = m.querySelector(".menu-back");
    function items() {
      return [].slice.call(m.querySelectorAll('a[href],button,summary')).filter(function (el) {
        return !el.closest("[hidden]");
      });
    }
    function isOpen() {
      return b.getAttribute("aria-expanded") === "true";
    }
    function open() {
      last = document.activeElement;
      sy = window.scrollY || 0;
      bd.style.top = -sy + "px";
      m.hidden = false;
      de.classList.add("menu-lock");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          de.classList.add("menu-open");
        });
      });
      b.setAttribute("aria-expanded", "true");
      if (x) x.focus({ preventScroll: true });
    }
    function close(backFocus) {
      if (!isOpen()) return;
      de.classList.remove("menu-open", "menu-lock");
      b.setAttribute("aria-expanded", "false");
      bd.style.top = "";
      window.scrollTo(0, sy);
      setTimeout(function () {
        if (!isOpen()) m.hidden = true;
      }, 320);
      if (backFocus !== false) (last || b).focus({ preventScroll: true });
    }
    b.addEventListener("click", function () {
      isOpen() ? close() : open();
    });
    if (x) x.addEventListener("click", function () { close(); });
    if (back) back.addEventListener("click", function () { close(); });
    m.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (a) close(false);
    });
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        var f = items();
        if (!f.length) return;
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      }
    });
    if (mq.addEventListener) {
      mq.addEventListener("change", function (q) {
        if (q.matches) close(false);
      });
    } else if (mq.addListener) {
      mq.addListener(function (q) {
        if (q.matches) close(false);
      });
    }
  }

  /* reveal */
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  } else {
    els.forEach(function (e) { e.classList.add("in"); });
  }

  /* calculator (цены — с исходного сайта) */
  var c = document.getElementById("calc");
  if (c) {
    var out = c.querySelector("output");
    var term = c.querySelector("[data-term]");
    function calc() {
      var t = c.querySelector("input[name=type]:checked");
      var sum = +t.value;
      c.querySelectorAll("input[name=extra]:checked").forEach(function (e) {
        sum += +e.value;
      });
      sum *= +c.querySelector("input[name=speed]:checked").value;
      out.textContent = "от " + (Math.round(sum / 1000) * 1000).toLocaleString("ru-RU") + " ₽";
      term.textContent = t.dataset.term;
    }
    c.addEventListener("input", calc);
    c.addEventListener("change", calc);
    calc();
  }
})();
