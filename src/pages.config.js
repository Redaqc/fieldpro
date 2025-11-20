import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Schedule from './pages/Schedule';
import Invoices from './pages/Invoices';
import Quotations from './pages/Quotations';
import Assets from './pages/Assets';
import PriceLists from './pages/PriceLists';
import Materials from './pages/Materials';
import TimeTracking from './pages/TimeTracking';
import Settings from './pages/Settings';
import GPSTracking from './pages/GPSTracking';
import TechnicianMobile from './pages/TechnicianMobile';
import NotificationSettings from './pages/NotificationSettings';
import Calendar from './pages/Calendar';
import ProfitabilityReports from './pages/ProfitabilityReports';
import CostsManagement from './pages/CostsManagement';
import Documents from './pages/Documents';
import FormBuilder from './pages/FormBuilder';
import Forms from './pages/Forms';
import Reports from './pages/Reports';
import FormAutomations from './pages/FormAutomations';
import RoleManager from './pages/RoleManager';
import ServiceCalls from './pages/ServiceCalls';
import ScheduleAnalytics from './pages/ScheduleAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Jobs": Jobs,
    "Customers": Customers,
    "Team": Team,
    "Schedule": Schedule,
    "Invoices": Invoices,
    "Quotations": Quotations,
    "Assets": Assets,
    "PriceLists": PriceLists,
    "Materials": Materials,
    "TimeTracking": TimeTracking,
    "Settings": Settings,
    "GPSTracking": GPSTracking,
    "TechnicianMobile": TechnicianMobile,
    "NotificationSettings": NotificationSettings,
    "Calendar": Calendar,
    "ProfitabilityReports": ProfitabilityReports,
    "CostsManagement": CostsManagement,
    "Documents": Documents,
    "FormBuilder": FormBuilder,
    "Forms": Forms,
    "Reports": Reports,
    "FormAutomations": FormAutomations,
    "RoleManager": RoleManager,
    "ServiceCalls": ServiceCalls,
    "ScheduleAnalytics": ScheduleAnalytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};