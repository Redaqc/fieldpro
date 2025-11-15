import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Schedule from './pages/Schedule';
import Invoices from './pages/Invoices';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Jobs": Jobs,
    "Customers": Customers,
    "Team": Team,
    "Schedule": Schedule,
    "Invoices": Invoices,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};