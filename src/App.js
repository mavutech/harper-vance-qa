import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Main from './layouts/Main';
import NotFound from "./pages/NotFound";
import ProtectedRoute from './components/ProtectedRoute';

import publicRoutes from "./routes/PublicRoutes";
import protectedRoutes from "./routes/ProtectedRoutes";
import { checkAuthStatus } from "./redux/authentication/authActions";
import { ROUTES } from "./config/routes";
import { AccessProvider } from "./features/access";

// import css
import "./assets/css/remixicon.css";

// import scss
import "./scss/style.scss";

const LandingPage = lazy(() => import("./features/landingPage/pages/LandingPage"));


// set skin on load
window.addEventListener("load", function () {
  let skinMode = localStorage.getItem("skin-mode");
  let HTMLTag = document.querySelector("html");

  if (skinMode) {
    HTMLTag.setAttribute("data-skin", skinMode);
  }
});

/**
 * Renders public and authenticated application routes.
 *
 * @returns {React.ReactElement} Harper Vance application shell.
 */
export default function App() {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector(state => state.auth);

  useEffect(() => {
    // Initialize Firebase auth state listener
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <React.Fragment>
      <BrowserRouter>
        <AccessProvider>
        <Routes>
          {/* Root path is the public landing page and authenticated entry point. */}
          <Route 
            path={ROUTES.home}
            element={
              isLoggedIn ? (
                <Navigate to={ROUTES.dashboard} replace />
              ) : (
                <Suspense fallback={null}><LandingPage /></Suspense>
              )
            } 
          />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Main /></ProtectedRoute>}>
            {protectedRoutes.map((route, index) => {
              const element = (route.requireRole || route.requireVerifiedEmail || route.requireFeature) ? (
                <ProtectedRoute
                  requireRole={route.requireRole}
                  requireVerifiedEmail={route.requireVerifiedEmail}
                  requireFeature={route.requireFeature}
                >
                  {route.element}
                </ProtectedRoute>
              ) : route.element;
              return (
                <Route
                  path={route.path}
                  element={element}
                  key={index}
                />
              )
            })}
          </Route>
          
          {/* Public routes */}
          {publicRoutes.map((route, index) => {
            return (
              <Route
                path={route.path}
                element={route.element}
                key={index}
              />
            )
          })}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AccessProvider>
      </BrowserRouter>
    </React.Fragment>
    
  );
}
