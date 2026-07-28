import React from "react";
import PublicRoute from "../components/PublicRoute";
import Forbidden from "../pages/Forbidden";
import ForgotPassword from "../pages/ForgotPassword";
import InternalServerError from "../pages/InternalServerError";
import LockScreen from "../pages/LockScreen";
import NotFound from "../pages/NotFound";
import ServiceUnavailable from "../pages/ServiceUnavailable";
import Signin from "../pages/Signin";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Signup2 from "../pages/Signup2";
import VerifyAccount from "../pages/VerifyAccount";

const publicRoutes = [
  { path: "pages/signin", element: <PublicRoute><Signin /></PublicRoute> },
  { path: "login", element: <PublicRoute><Login /></PublicRoute> },
  { path: "pages/signup", element: <PublicRoute><Signup /></PublicRoute> },
  { path: "pages/signup2", element: <PublicRoute><Signup2 /></PublicRoute> },
  { path: "pages/verify", element: <VerifyAccount /> },
  { path: "pages/forgot", element: <ForgotPassword /> },
  { path: "pages/lock", element: <LockScreen /> },
  { path: "pages/error-404", element: <NotFound /> },
  { path: "pages/error-500", element: <InternalServerError /> },
  { path: "pages/error-503", element: <ServiceUnavailable /> },
  { path: "pages/error-505", element: <Forbidden /> }
];

export default publicRoutes;
