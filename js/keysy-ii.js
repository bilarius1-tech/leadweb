(function () {
  var form = document.querySelector(".k-filters");
  var map = { all: "kf-all", "1c": "kf-1c", b24: "kf-b24", both: "kf-both" };
  var openDlg = null;

  function hashKey() {
    return (location.hash || "").replace("#", "");
  }

  function applyFilterHash() {
    if (!form) return;
    var key = hashKey().toLowerCase();
    var id = map[key];
    if (!id) return;
    var input = document.getElementById(id);
    if (input) input.checked = true;
  }

  if (form) {
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || t.name !== "kfilter") return;
      var key = t.value;
      var next = key === "all" ? location.pathname + location.search : "#" + key;
      if (history.replaceState) history.replaceState(null, "", next);
    });
  }

  function dialogFor(caseId) {
    return document.getElementById("dlg-" + caseId);
  }

  function closeDialog(dlg, clearHash) {
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    dlg.removeAttribute("open");
    if (openDlg === dlg) openDlg = null;
    if (clearHash && /^case-/.test(hashKey()) && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function openDialog(caseId, setHash) {
    var dlg = dialogFor(caseId);
    if (!dlg) return;
    if (openDlg && openDlg !== dlg) closeDialog(openDlg, false);
    if (typeof dlg.showModal === "function") {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute("open", "");
    }
    openDlg = dlg;
    var closeBtn = dlg.querySelector(".k-dlg-close");
    if (closeBtn) closeBtn.focus();
    if (setHash && history.replaceState && hashKey() !== caseId) {
      history.replaceState(null, "", "#" + caseId);
    }
  }

  function applyCaseHash() {
    var key = hashKey();
    if (/^case-/.test(key) && dialogFor(key)) {
      openDialog(key, false);
      var card = document.getElementById(key);
      if (card && card.scrollIntoView) card.scrollIntoView({ block: "start" });
    } else if (openDlg) {
      closeDialog(openDlg, false);
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open-case]");
    if (btn) {
      e.preventDefault();
      openDialog(btn.getAttribute("data-open-case"), true);
      return;
    }
    var closer = e.target.closest("[data-close-dialog]");
    if (closer) {
      e.preventDefault();
      var dlg = closer.closest("dialog") || openDlg;
      closeDialog(dlg, true);
    }
  });

  document.querySelectorAll("dialog.k-dlg").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) closeDialog(dlg, true);
    });
    dlg.addEventListener("close", function () {
      if (openDlg === dlg) openDlg = null;
      if (/^case-/.test(hashKey()) && history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !openDlg) return;
    if (typeof HTMLDialogElement !== "undefined" && openDlg instanceof HTMLDialogElement) return;
    closeDialog(openDlg, true);
  });

  window.addEventListener("hashchange", function () {
    applyFilterHash();
    applyCaseHash();
  });
  applyFilterHash();
  applyCaseHash();
})();
