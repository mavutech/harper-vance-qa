import React, { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
    sonaMenu,
    dashboardMenu,
    applicationsMenu,
    pagesMenu,
    uiElementsMenu,
    organizationMenu
} from "../data/Menu";
import { logoutUser } from "../redux/authentication/authActions";
import { useCurrentOrg } from "../features/organizations/hooks/useCurrentOrg";
import CreateOrgModal from "../features/organizations/components/CreateOrgModal";

import logo from "../assets/svg/logo2.svg";
import logoWhite from "../assets/svg/logo2-white.svg";

export default function Sidebar() {
    const scrollBarRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoggedIn } = useSelector(state => state.auth);

    const displayName = isLoggedIn && user ? (user.name || user.email) : 'Guest User';
    const secondaryText = isLoggedIn && user ? (user.email || '') : 'Not logged in';
    const photoURL = (isLoggedIn && user && user.photoURL) ? user.photoURL : null;
    const initial = ((isLoggedIn && user
        ? (user.displayName || user.name || user.email)
        : 'G') || 'U').charAt(0).toUpperCase();

    const toggleFooterMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const parent = e.currentTarget.closest(".sidebar");
        if (parent) parent.classList.toggle("footer-menu-show");
    };

    const handleLogout = (e) => {
        e.preventDefault();
        dispatch(logoutUser());
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo">
                    <img src={logo} alt="" className="logo-light" />
                    <img src={logoWhite} alt="" className="logo-dark" />
                </Link>
            </div>
            <PerfectScrollbar className="sidebar-body" ref={scrollBarRef}>
                <SidebarMenu onUpdateSize={() => scrollBarRef.current && scrollBarRef.current.updateScroll()} />
            </PerfectScrollbar>
            <div className="sidebar-footer">
                <div className="sidebar-footer-top">
                    <Link to="/pages/profile" className="sidebar-footer-thumb">
                        {photoURL ? (
                            <img src={photoURL} alt="" />
                        ) : (
                            <span
                                className="d-flex align-items-center justify-content-center w-100 h-100 fw-semibold text-white"
                                style={{ backgroundColor: '#506fd9', borderRadius: 'inherit' }}
                            >
                                {initial}
                            </span>
                        )}
                    </Link>
                    <div className="sidebar-footer-body">
                        <h6><Link to="/pages/profile">{displayName}</Link></h6>
                        <p>{secondaryText}</p>
                    </div>
                    <Link onClick={toggleFooterMenu} to="" className="dropdown-link"><i className="ri-arrow-down-s-line"></i></Link>
                </div>
                <div className="sidebar-footer-menu">
                    <nav className="nav">
                        <Link to="/pages/profile"><i className="ri-edit-2-line"></i> Edit Profile</Link>
                    </nav>
                    <hr />
                    <nav className="nav">
                        <Link to="" onClick={handleLogout}><i className="ri-logout-box-r-line"></i> Log Out</Link>
                    </nav>
                </div>
            </div>
        </div>
    );
}

function SidebarMenu({ onUpdateSize }) {
    const showTemplateMenus = useSelector((state) => state.preferences.showTemplateMenus);
    const { isLoggedIn, user } = useSelector((state) => state.auth);
    const { currentOrg, currentOrgRole, isAdmin } = useCurrentOrg();
    const [showCreateOrg, setShowCreateOrg] = useState(false);

    const isSuperAdmin = user && user.role === 'super_admin';

    const toggleMenu = (e) => {
        e.preventDefault();
        const parent = e.target.closest('.nav-group');
        parent.classList.toggle('show');
        onUpdateSize();
    };

    const toggleSubMenu = (e) => {
        e.preventDefault();
        const parent = e.target.closest('.nav-item');
        let node = parent.parentNode.firstChild;
        while (node) {
            if (node !== parent && node.nodeType === Node.ELEMENT_NODE) {
                node.classList.remove('show');
            }
            node = node.nextElementSibling || node.nextSibling;
        }
        parent.classList.toggle('show');
        onUpdateSize();
    };

    const populateMenu = (m) => {
        const menu = m.map((m, key) => {
            let sm;
            if (m.submenu) {
                sm = m.submenu.map((sm, key) => (
                    <NavLink to={sm.link} className="nav-sub-link" key={key}>{sm.label}</NavLink>
                ));
            }

            return (
                <li key={key} className="nav-item">
                    {(!sm) ? (
                        <NavLink to={m.link} className="nav-link"><i className={m.icon}></i> <span>{m.label}</span></NavLink>
                    ) : (
                        <div onClick={toggleSubMenu} className="nav-link has-sub"><i className={m.icon}></i> <span>{m.label}</span></div>
                    )}
                    {m.submenu && <nav className="nav nav-sub">{sm}</nav>}
                </li>
            );
        });

        return <ul className="nav nav-sidebar">{menu}</ul>;
    };

    return (
        <React.Fragment>
            <div className="nav-group show">
                <div className="nav-label" onClick={toggleMenu}>SONA Analytics</div>
                {populateMenu(sonaMenu)}
            </div>
            {isLoggedIn && (
                <div className="nav-group show">
                    <div className="nav-label" onClick={toggleMenu}>
                        Organization
                        {currentOrg && (
                            <small className="text-secondary ms-2" style={{textTransform: 'none'}}>
                                {currentOrg.name} · {currentOrgRole}
                            </small>
                        )}
                    </div>
                    {currentOrg ? (
                        // Show Members/Settings only when the user actually has an org.
                        // Non-admins see the same links but are redirected on click by ProtectedRoute.
                        isAdmin ? populateMenu(organizationMenu) : (
                            <ul className="nav nav-sidebar">
                                <li className="nav-item">
                                    <NavLink to="/pages/org-members" className="nav-link">
                                        <i className="ri-team-line"></i> <span>Members</span>
                                    </NavLink>
                                </li>
                            </ul>
                        )
                    ) : (
                        <ul className="nav nav-sidebar">
                            <li className="nav-item">
                                {isSuperAdmin ? (
                                    <div
                                        className="nav-link"
                                        onClick={() => setShowCreateOrg(true)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <i className="ri-add-circle-line"></i> <span>Create organization</span>
                                    </div>
                                ) : (
                                    <div className="nav-link text-secondary" style={{cursor: 'default'}}>
                                        <i className="ri-information-line"></i> <span>Contact your administrator</span>
                                    </div>
                                )}
                            </li>
                        </ul>
                    )}
                </div>
            )}
            {showTemplateMenus && (
                <React.Fragment>
                    <div className="nav-group show">
                        <div className="nav-label" onClick={toggleMenu}>Dashboard</div>
                        {populateMenu(dashboardMenu)}
                    </div>
                    <div className="nav-group show">
                        <div className="nav-label" onClick={toggleMenu}>Applications</div>
                        {populateMenu(applicationsMenu)}
                    </div>
                    <div className="nav-group show">
                        <div className="nav-label" onClick={toggleMenu}>Pages</div>
                        {populateMenu(pagesMenu)}
                    </div>
                    <div className="nav-group show">
                        <div className="nav-label" onClick={toggleMenu}>UI Elements</div>
                        {populateMenu(uiElementsMenu)}
                    </div>
                </React.Fragment>
            )}

            <CreateOrgModal
                show={showCreateOrg}
                onHide={() => setShowCreateOrg(false)}
            />
        </React.Fragment>
    );
}

window.addEventListener("click", function (e) {
    // Close sidebar footer menu when clicked outside of it
    let tar = e.target;
    let sidebar = document.querySelector(".sidebar");
    if (!tar.closest(".sidebar-footer") && sidebar) {
        sidebar.classList.remove("footer-menu-show");
    }

    // Hide sidebar offset when clicked outside of sidebar
    if (!tar.closest(".sidebar") && !tar.closest(".menu-link")) {
        document.querySelector("body").classList.remove("sidebar-show");
    }
});

window.addEventListener("load", function () {
    let skinMode = localStorage.getItem("sidebar-skin");
    let HTMLTag = document.querySelector("html");

    if (skinMode) {
        HTMLTag.setAttribute("data-sidebar", skinMode);
    }
});
