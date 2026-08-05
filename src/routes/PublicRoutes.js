import React from "react";
import PublicRoute from "../components/PublicRoute";
import AcceptInvite from "../pages/AcceptInvite";
import Forbidden from "../pages/Forbidden";
import ForgotPassword from "../pages/ForgotPassword";
import InternalServerError from "../pages/InternalServerError";
import LockScreen from "../pages/LockScreen";
import NotFound from "../pages/NotFound";
import ServiceUnavailable from "../pages/ServiceUnavailable";
import Login from "../pages/Login";
import VerifyAccount from "../pages/VerifyAccount";

const publicRoutes = [
  { path: "login", element: <PublicRoute><Login /></PublicRoute> },
  { path: "pages/verify", element: <VerifyAccount /> },
  { path: "pages/forgot", element: <ForgotPassword /> },
  { path: "pages/lock", element: <LockScreen /> },
  { path: "pages/accept-invite", element: <AcceptInvite /> },
  { path: "pages/error-404", element: <NotFound /> },
  { path: "pages/error-500", element: <InternalServerError /> },
  { path: "pages/error-503", element: <ServiceUnavailable /> },
  { path: "pages/error-505", element: <Forbidden /> }
];

export default publicRoutes;
