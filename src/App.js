import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Main from './layouts/Main';
import NotFound from "./pages/NotFound";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';

import publicRoutes from "./routes/PublicRoutes";
import protectedRoutes from "./routes/ProtectedRoutes";
import { checkAuthStatus } from "./redux/authentication/authActions";

// import css
import "./assets/css/remixicon.css";

// import scss
import "./scss/style.scss";


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

  useEffect(() => {
    // Initialize Firebase auth state listener
    dispatch(checkAuthStatus({
      onAuthenticated: (user) => {
        console.log('User authenticated on app load:', user.email);
      },
      onUnauthenticated: () => {
        console.log('No user authenticated on app load');
      }
    }));
  }, [dispatch]);

  return (
    <React.Fragment>
      <BrowserRouter>
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
              const element = (route.requireRole || route.requireVerifiedEmail) ? (
                <ProtectedRoute
                  requireRole={route.requireRole}
                  requireVerifiedEmail={route.requireVerifiedEmail}
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
      </BrowserRouter>
    </React.Fragment>
    
  );
}
