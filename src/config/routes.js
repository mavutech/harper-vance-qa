import {PRODUCT_ROUTES} from "./productRoutes";
export const ROUTES = Object.freeze({
  home: "/",
  login: "/login",
  terms: "/terms",
  privacy: "/privacy",
  mfaSetup: "/mfa/setup",
  dashboard: PRODUCT_ROUTES.targets
});
