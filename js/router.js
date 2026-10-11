import { state, persistState } from "./state.js";

const publicRoutes = new Set(["login"]);
const appRoutes = new Set(["feed", "friends", "calendar", "boards", "profile"]);

export function navigate(route) {
  const nextRoute = publicRoutes.has(route) || appRoutes.has(route) ? route : "feed";

  if (!state.session.isSignedIn && nextRoute !== "login") {
    state.ui.route = "login";
  } else if (state.session.isSignedIn && nextRoute === "login") {
    state.ui.route = "feed";
  } else {
    state.ui.route = nextRoute;
  }

  window.location.hash = state.ui.route;
  persistState();
  window.dispatchEvent(new CustomEvent("ootdify:route"));
}

export function initRouter() {
  const requestedRoute = window.location.hash.replace("#", "");
  navigate(requestedRoute || (state.session.isSignedIn ? state.ui.route : "login"));

  window.addEventListener("hashchange", () => {
    const route = window.location.hash.replace("#", "");
    if (route && route !== state.ui.route) navigate(route);
  });
}
