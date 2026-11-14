(function () {
  var form = document.querySelector(".k-filters");
  if (!form) return;
  var map = { all: "kf-all", "1c": "kf-1c", b24: "kf-b24", both: "kf-both" };
  function applyHash() {
    var key = (location.hash || "").replace("#", "").toLowerCase();
    var id = map[key];
    if (!id) return;
    var input = document.getElementById(id);
    if (input) input.checked = true;
  }
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || t.name !== "kfilter") return;
    var key = t.value;
    var next = key === "all" ? location.pathname + location.search : "#" + key;
    if (history.replaceState) history.replaceState(null, "", next);
  });
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
