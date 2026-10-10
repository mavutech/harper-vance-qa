import React from "react";
import {Navigate} from "react-router-dom";
import PublicRoute from "../components/PublicRoute";
import Forbidden from "../pages/Forbidden";
import ForgotPassword from "../pages/ForgotPassword";
import InternalServerError from "../pages/InternalServerError";
import LockScreen from "../pages/LockScreen";
import NotFound from "../pages/NotFound";
import ServiceUnavailable from "../pages/ServiceUnavailable";
import Login from "../pages/Login";
import VerifyAccount from "../pages/VerifyAccount";
import AcceptInvitationPage from "../features/customerOnboarding/pages/AcceptInvitationPage";

const publicRoutes = [
  { path: "pages/signin", element: <Navigate to="/login" replace /> },
  { path: "login", element: <PublicRoute><Login /></PublicRoute> },
  { path: "pages/signup", element: <Navigate to="/" replace /> },
  { path: "pages/signup2", element: <Navigate to="/" replace /> },
  { path: "pages/verify", element: <VerifyAccount /> },
  { path: "pages/accept-invite", element: <AcceptInvitationPage /> },
  { path: "pages/forgot", element: <ForgotPassword /> },
  { path: "pages/lock", element: <LockScreen /> },
  { path: "pages/error-404", element: <NotFound /> },
  { path: "pages/error-500", element: <InternalServerError /> },
  { path: "pages/error-503", element: <ServiceUnavailable /> },
  { path: "pages/error-505", element: <Forbidden /> }
];

export default publicRoutes;
