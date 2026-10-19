import React, {lazy} from "react";
import {ACCESS_FEATURES} from "../features/access";

const EventManagement = lazy(() => import("../dashboard/EventManagement"));
const SalesMonitoring = lazy(() => import("../dashboard/SalesMonitoring"));
const WebsiteAnalytics = lazy(() => import("../dashboard/WebsiteAnalytics"));
const FinanceMonitoring = lazy(() => import("../dashboard/FinanceMonitoring"));
const Cryptocurrency = lazy(() => import("../dashboard/Cryptocurrency"));
const HelpdeskService = lazy(() => import("../dashboard/HelpdeskService"));
const StorageManagement = lazy(() => import("../dashboard/StorageManagement"));
const ProductManagement = lazy(() => import("../dashboard/ProductManagement"));

const SonaTargets = lazy(() => import("../features/sonaStats/pages/SonaTargets"));
const SonaDaily = lazy(() => import("../features/sonaStats/pages/SonaDaily"));
const SonaHistory = lazy(() => import("../features/sonaStats/pages/SonaHistory"));
const SonaWeekly = lazy(() => import("../features/sonaStats/pages/SonaWeekly"));
const CustomerOrganizationsPage = lazy(() => import("../features/customerAdmin/pages/CustomerOrganizationsPage"));
const CustomerApplicationsPage = lazy(() => import("../features/customerAdmin/pages/CustomerApplicationsPage"));
const ReportRequestsPage = lazy(() => import("../features/customerAdmin/pages/ReportRequestsPage"));
const OrganizationTeamPage = lazy(() => import("../features/customerAdmin/pages/OrganizationTeamPage"));
const AccessUnavailable = lazy(() => import("../pages/AccessUnavailable"));

const GalleryMusic = lazy(() => import("../apps/GalleryMusic"));
const GalleryVideo = lazy(() => import("../apps/GalleryVideo"));
const Tasks = lazy(() => import("../apps/Tasks"));
const Contacts = lazy(() => import("../apps/Contacts"));
const Chat = lazy(() => import("../apps/Chat"));
const AppCalendar = lazy(() => import("../apps/AppCalendar"));
const Email = lazy(() => import("../apps/Email"));
const FileManager = lazy(() => import("../apps/FileManager"));

const Pricing = lazy(() => import("../pages/Pricing"));
const Faq = lazy(() => import("../pages/Faq"));
const Profile = lazy(() => import("../pages/Profile"));
const People = lazy(() => import("../pages/People"));
const Activity = lazy(() => import("../pages/Activity"));
const Events = lazy(() => import("../pages/Events"));
const Settings = lazy(() => import("../pages/Settings"));

const LayoutColumns = lazy(() => import("../docs/LayoutColumns"));
const LayoutGrid = lazy(() => import("../docs/LayoutGrid"));
const LayoutGutters = lazy(() => import("../docs/LayoutGutters"));
const Accordions = lazy(() => import("../docs/Accordions"));
const Alerts = lazy(() => import("../docs/Alerts"));
const Avatars = lazy(() => import("../docs/Avatars"));
const Badges = lazy(() => import("../docs/Badges"));
const Breadcrumbs = lazy(() => import("../docs/Breadcrumbs"));
const Buttons = lazy(() => import("../docs/Buttons"));
const Cards = lazy(() => import("../docs/Cards"));
const Carousels = lazy(() => import("../docs/Carousels"));
const Dropdowns = lazy(() => import("../docs/Dropdowns"));
const Images = lazy(() => import("../docs/Images"));
const Listgroup = lazy(() => import("../docs/Listgroup"));
const Markers = lazy(() => import("../docs/Markers"));
const Modals = lazy(() => import("../docs/Modals"));
const NavTabs = lazy(() => import("../docs/NavTabs"));
const OffCanvas = lazy(() => import("../docs/OffCanvas"));
const Paginations = lazy(() => import("../docs/Paginations"));
const Placeholders = lazy(() => import("../docs/Placeholders"));
const Popovers = lazy(() => import("../docs/Popovers"));
const Progress = lazy(() => import("../docs/Progress"));
const Spinners = lazy(() => import("../docs/Spinners"));
const Toasts = lazy(() => import("../docs/Toasts"));
const Tooltips = lazy(() => import("../docs/Tooltips"));
const Tables = lazy(() => import("../docs/Tables"));
const FormElements = lazy(() => import("../docs/FormElements"));
const FormSelects = lazy(() => import("../docs/FormSelects"));
const FormChecksRadios = lazy(() => import("../docs/FormChecksRadios"));
const FormRange = lazy(() => import("../docs/FormRange"));
const FormPickers = lazy(() => import("../docs/FormPickers"));
const FormLayouts = lazy(() => import("../docs/FormLayouts"));
const UtilBackground = lazy(() => import("../docs/UtilBackground"));
const UtilBorder = lazy(() => import("../docs/UtilBorder"));
const UtilColors = lazy(() => import("../docs/UtilColors"));
const UtilDivider = lazy(() => import("../docs/UtilDivider"));
const UtilFlex = lazy(() => import("../docs/UtilFlex"));
const UtilSizing = lazy(() => import("../docs/UtilSizing"));
const UtilSpacing = lazy(() => import("../docs/UtilSpacing"));
const UtilOpacity = lazy(() => import("../docs/UtilOpacity"));
const UtilPosition = lazy(() => import("../docs/UtilPosition"));
const UtilTypography = lazy(() => import("../docs/UtilTypography"));
const UtilShadows = lazy(() => import("../docs/UtilShadows"));
const UtilExtras = lazy(() => import("../docs/UtilExtras"));
const ApexCharts = lazy(() => import("../docs/ApexCharts"));
const ChartJs = lazy(() => import("../docs/ChartJs"));
const MapLeaflet = lazy(() => import("../docs/MapLeaflet"));
const MapVector = lazy(() => import("../docs/MapVector"));
const IconRemix = lazy(() => import("../docs/IconRemix"));
const IconFeather = lazy(() => import("../docs/IconFeather"));

const protectedRoutes = [
  { path: "dashboard/sona-targets", element: <SonaTargets />, requireFeature: ACCESS_FEATURES.LIVE_TARGETS },
  { path: "dashboard/sona-daily", element: <SonaDaily />, requireFeature: ACCESS_FEATURES.DAILY_REPORTS },
  { path: "dashboard/sona-history", element: <SonaHistory />, requireFeature: ACCESS_FEATURES.HISTORY },
  { path: "dashboard/sona-weekly", element: <SonaWeekly />, requireFeature: ACCESS_FEATURES.WEEKLY_REPORTS },
  { path: "access-unavailable", element: <AccessUnavailable /> },
  {
    path: "admin/organizations",
    element: <CustomerOrganizationsPage />,
    requireRole: "super_admin"
  },
  {
    path: "admin/leads",
    element: <ReportRequestsPage />,
    requireRole: "super_admin"
  },
  {
    path: "admin/applications",
    element: <CustomerApplicationsPage />,
    requireRole: "super_admin"
  },
  {
    path: "organization/team",
    element: <OrganizationTeamPage />,
    requireOrganizationRole: ["owner", "admin"]
  },
  { path: "dashboard/finance", element: <FinanceMonitoring /> },
  { path: "dashboard/events", element: <EventManagement /> },
  { path: "dashboard/sales", element: <SalesMonitoring /> },
  { path: "dashboard/analytics", element: <WebsiteAnalytics /> },
  { path: "dashboard/crypto", element: <Cryptocurrency /> },
  { path: "dashboard/helpdesk", element: <HelpdeskService /> },
  { path: "dashboard/storage", element: <StorageManagement /> },
  { path: "dashboard/product", element: <ProductManagement /> },
  { path: "apps/gallery-music", element: <GalleryMusic /> },
  { path: "apps/gallery-video", element: <GalleryVideo /> },
  { path: "apps/tasks", element: <Tasks /> },
  { path: "apps/contacts", element: <Contacts /> },
  { path: "apps/chat", element: <Chat /> },
  { path: "apps/calendar", element: <AppCalendar /> },
  { path: "apps/email", element: <Email /> },
  { path: "apps/file-manager", element: <FileManager /> },
  { path: "pages/pricing", element: <Pricing /> },
  { path: "pages/faq", element: <Faq /> },
  { path: "pages/profile", element: <Profile /> },
  { path: "pages/people", element: <People /> },
  { path: "pages/activity", element: <Activity /> },
  { path: "pages/events", element: <Events /> },
  { path: "pages/settings", element: <Settings /> },
  { path: "docs/layout/grid", element: <LayoutGrid /> },
  { path: "docs/layout/columns", element: <LayoutColumns /> },
  { path: "docs/layout/gutters", element: <LayoutGutters /> },
  { path: "docs/com/accordions", element: <Accordions /> },
  { path: "docs/com/alerts", element: <Alerts /> },
  { path: "docs/com/avatars", element: <Avatars /> },
  { path: "docs/com/badge", element: <Badges /> },
  { path: "docs/com/breadcrumbs", element: <Breadcrumbs /> },
  { path: "docs/com/buttons", element: <Buttons /> },
  { path: "docs/com/cards", element: <Cards /> },
  { path: "docs/com/carousel", element: <Carousels /> },
  { path: "docs/com/dropdown", element: <Dropdowns /> },
  { path: "docs/com/images", element: <Images /> },
  { path: "docs/com/listgroup", element: <Listgroup /> },
  { path: "docs/com/markers", element: <Markers /> },
  { path: "docs/com/modal", element: <Modals /> },
  { path: "docs/com/navtabs", element: <NavTabs /> },
  { path: "docs/com/offcanvas", element: <OffCanvas /> },
  { path: "docs/com/pagination", element: <Paginations /> },
  { path: "docs/com/placeholders", element: <Placeholders /> },
  { path: "docs/com/popovers", element: <Popovers /> },
  { path: "docs/com/progress", element: <Progress /> },
  { path: "docs/com/spinners", element: <Spinners /> },
  { path: "docs/com/toasts", element: <Toasts /> },
  { path: "docs/com/tooltips", element: <Tooltips /> },
  { path: "docs/com/tables", element: <Tables /> },
  { path: "docs/form/elements", element: <FormElements /> },
  { path: "docs/form/selects", element: <FormSelects /> },
  { path: "docs/form/checksradios", element: <FormChecksRadios /> },
  { path: "docs/form/range", element: <FormRange /> },
  { path: "docs/form/pickers", element: <FormPickers /> },
  { path: "docs/form/layouts", element: <FormLayouts /> },
  { path: "docs/chart/apex", element: <ApexCharts /> },
  { path: "docs/chart/chartjs", element: <ChartJs /> },
  { path: "docs/map/leaflet", element: <MapLeaflet /> },
  { path: "docs/map/vector", element: <MapVector /> },
  { path: "docs/icon/remix", element: <IconRemix /> },
  { path: "docs/icon/feather", element: <IconFeather /> },
  { path: "docs/util/background", element: <UtilBackground /> },
  { path: "docs/util/border", element: <UtilBorder /> },
  { path: "docs/util/colors", element: <UtilColors /> },
  { path: "docs/util/divider", element: <UtilDivider /> },
  { path: "docs/util/flex", element: <UtilFlex /> },
  { path: "docs/util/sizing", element: <UtilSizing /> },
  { path: "docs/util/spacing", element: <UtilSpacing /> },
  { path: "docs/util/opacity", element: <UtilOpacity /> },
  { path: "docs/util/position", element: <UtilPosition /> },
  { path: "docs/util/typography", element: <UtilTypography /> },
  { path: "docs/util/shadows", element: <UtilShadows /> },
  { path: "docs/util/extras", element: <UtilExtras /> }
]

export default protectedRoutes;
