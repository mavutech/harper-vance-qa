import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "react-bootstrap";
import Main from './layouts/Main';
import NotFound from "./pages/NotFound";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';

import publicRoutes from "./routes/PublicRoutes";
import protectedRoutes from "./routes/ProtectedRoutes";
import { checkAuthStatus } from "./redux/authentication/authActions";
import { fetchOrgs, resetOrgState } from "./features/organizations/redux/orgActions";

// import css
import "./assets/css/remixicon.css";

// import scss
import "./scss/style.scss";
import {useAuthSessionSync} from './features/auth/hooks/useAuthSessionSync';

// set skin on load
window.addEventListener("load", function () {
  let skinMode = localStorage.getItem("skin-mode");
  let HTMLTag = document.querySelector("html");

  if (skinMode) {
    HTMLTag.setAttribute("data-skin", skinMode);
  }
});

export default function App() {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector(state => state.auth);

  // Keep role/emailVerified fresh during long sessions.
  useAuthSessionSync();

  // Gate the whole app on Firebase's first onAuthStateChanged fire.
  // Prevents the "signed-in briefly, then bounces to login" flash and
  // stops thunks from racing on cold start.
  const [authBootstrapped, setAuthBootstrapped] = useState(false);

  useEffect(() => {
    // Initialize Firebase auth state listener; resolve exactly once so we
    // know Firebase has reconciled its persisted session with the app.
    dispatch(checkAuthStatus({
      onAuthenticated: (user) => {
        console.log('User authenticated on app load:', user.email);
      },
      onUnauthenticated: () => {
        console.log('No user authenticated on app load');
      }
    })).finally(() => setAuthBootstrapped(true));
  }, [dispatch]);

  // Load org membership when the user becomes authenticated; reset on
  // logout so stale org state doesn't leak into the next session.
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchOrgs()).catch(() => {
        // Errors are surfaced via state.organization.error; silence the
        // console — a brief race on cold start is expected.
      });
    } else {
      dispatch(resetOrgState());
    }
  }, [isLoggedIn, dispatch]);

  return (
    <React.Fragment>
      <BrowserRouter>
        {!authBootstrapped ? (
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spinner animation="border" role="status" aria-label="Loading" />
          </div>
        ) : (
        <Routes>
          {/* Root path shows login page, redirects to Today's Targets if already logged in */}
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard/sona-targets" replace />
              ) : (
                <PublicRoute><Login /></PublicRoute>
              )
            } 
          />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Main /></ProtectedRoute>}>
            {protectedRoutes.map((route, index) => {
              const hasGuard = route.requireRole
                || route.requireVerifiedEmail
                || route.requireOrgMembership
                || route.requireOrgRole;
              const element = hasGuard ? (
                <ProtectedRoute
                  requireRole={route.requireRole}
                  requireVerifiedEmail={route.requireVerifiedEmail}
                  requireOrgMembership={route.requireOrgMembership}
                  requireOrgRole={route.requireOrgRole}
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
        )}
      </BrowserRouter>
    </React.Fragment>
    
  );
}
