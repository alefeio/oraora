(() => {
const params = new URLSearchParams(location.search);
const id = params.get("screen") || "home";
const state = params.get("state") || "";
const spec = window.ORA_SCREENS[id] || window.ORA_SCREENS.home;
document.body.dataset.context = spec.context;
document.body.dataset.screen = id;
document.title = `Ora Ora — ${spec.title}`;
document.getElementById("app").innerHTML = spec.render(state);
})();
