// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const B2CPortalLayout = Loadable(lazy(() => import('../layouts/b2c/B2CPortalLayout')));

// authentication
const Login2 = Loadable(lazy(() => import('../views/authentication/auth2/Login')));
const Register2 = Loadable(lazy(() => import('../views/authentication/auth2/Register')));
const Maintainance = Loadable(lazy(() => import('../views/authentication/Maintainance')));

// Dashboards
const Modern = Loadable(lazy(() => import('../views/dashboards/Modern')));

//pages
const UserProfile = Loadable(lazy(() => import('../views/pages/user-profile/UserProfile')));
const Subscriptions = Loadable(lazy(() => import('../views/pages/Subscriptions')));
const Employees = Loadable(lazy(() => import('../views/pages/Employees')));
const PlanMapping = Loadable(lazy(() => import('../views/pages/PlanMapping')));
const DigitalMagazines = Loadable(lazy(() => import('../views/pages/DigitalMagazines')));
const B2BProviders = Loadable(lazy(() => import('../views/pages/B2BProviders')));
const PlatformModules = Loadable(lazy(() => import('../views/pages/PlatformModules')));
const ProviderDetail = Loadable(lazy(() => import('../views/pages/providers/ProviderDetail')));
const GlobalCatalog = Loadable(lazy(() => import('../views/pages/GlobalCatalog')));
const BookForm = Loadable(lazy(() => import('../views/pages/catalog/BookForm')));
const ErpSyncLogs = Loadable(lazy(() => import('../views/pages/logs/ErpSyncLogs')));
const AccessLogs = Loadable(lazy(() => import('../views/pages/logs/AccessLogs')));
const ERPIntegrations = Loadable(lazy(() => import('../views/pages/ERPIntegrations')));
const ProviderConsumption = Loadable(lazy(() => import('../views/pages/ProviderConsumption')));
const GlobalSettings = Loadable(lazy(() => import('../views/pages/GlobalSettings')));
const Banners = Loadable(lazy(() => import('../views/pages/Banners')));
const PartnerStores = Loadable(lazy(() => import('../views/pages/PartnerStores')));
const EmailTemplates = Loadable(lazy(() => import('../views/pages/EmailTemplates')));
const ConnectionStatus = Loadable(lazy(() => import('../views/pages/ConnectionStatus')));
const PortalCustomization = Loadable(lazy(() => import('../views/pages/PortalCustomization')));
const B2CSuperPortal = Loadable(lazy(() => import('../views/pages/B2CSuperPortal')));

/* ****Apps***** */
const Notes = Loadable(lazy(() => import('../views/apps/notes/Notes')));
const Form = Loadable(lazy(() => import('../views/utilities/form/Form')));
const Table = Loadable(lazy(() => import('../views/utilities/table/Table')));
const Tickets = Loadable(lazy(() => import('../views/apps/tickets/Tickets')));
const CreateTickets = Loadable(lazy(() => import('../views/apps/tickets/CreateTickets')));
const Blog = Loadable(lazy(() => import('../views/apps/blog/Blog')));
const BlogDetail = Loadable(lazy(() => import('../views/apps/blog/BlogDetail')));

const Error = Loadable(lazy(() => import('../views/authentication/Error')));

// // icons
const SolarIcon = Loadable(lazy(() => import('../views/icons/SolarIcon')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', exact: true, element: <Modern /> },
      { path: '*', element: <Navigate to="/auth/404" /> },

      // B2B Admin Routes
      { path: '/admin/subscriptions', element: <Subscriptions /> },
      { path: '/admin/employees', element: <Employees /> },
      { path: '/admin/plan-mapping', element: <PlanMapping /> },
      { path: '/admin/digital-magazines', element: <DigitalMagazines /> },
      { path: '/admin/providers', element: <B2BProviders /> },
      { path: '/admin/platform-modules', element: <PlatformModules /> },
      { path: '/admin/erp-sync-logs', element: <ErpSyncLogs /> },
      { path: '/admin/access-logs', element: <AccessLogs /> },
      { path: '/admin/providers/:id', element: <ProviderDetail /> },
      { path: '/admin/global-catalog', element: <GlobalCatalog /> },
      { path: '/admin/catalog/books/new', element: <BookForm /> },
      { path: '/admin/catalog/books/:id', element: <BookForm /> },
      { path: '/admin/integrations', element: <ERPIntegrations /> },
      { path: '/admin/consumption', element: <ProviderConsumption /> },
      { path: '/admin/global-settings', element: <GlobalSettings /> },
      { path: '/admin/banners', element: <Banners /> },
      { path: '/admin/partner-stores', element: <PartnerStores /> },
      { path: '/admin/email-templates', element: <EmailTemplates /> },
      { path: '/admin/portal-customization', element: <PortalCustomization /> },

      { path: '/apps/notes', element: <Notes /> },
      { path: '/utilities/form', element: <Form /> },
      { path: '/utilities/table', element: <Table /> },
      { path: '/apps/tickets', element: <Tickets /> },
      { path: '/apps/tickets/create', element: <CreateTickets /> },
      { path: '/apps/blog/post', element: <Blog /> },
      { path: '/apps/blog/detail/:id', element: <BlogDetail /> },
      { path: '/user-profile', element: <UserProfile /> },
      { path: '/icons/iconify', element: <SolarIcon /> },
    ],
  },
  {
    path: '/',
    element: <B2CPortalLayout />,
    children: [
      { path: '/b2c/super-portal', element: <B2CSuperPortal /> },
      { path: '/b2c/connection-status', element: <ConnectionStatus /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/auth2/login', element: <Login2 /> },
      { path: '/auth/auth2/register', element: <Register2 /> },
      { path: '/auth/maintenance', element: <Maintainance /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
