import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Schedule from './pages/Schedule';
import Invoices from './pages/Invoices';
import Quotations from './pages/Quotations';
import Assets from './pages/Assets';
import PriceLists from './pages/PriceLists';
import Layout from './Layout.jsx';


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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};