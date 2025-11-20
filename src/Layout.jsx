import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "../components/shared/LanguageProvider";
import { 
                  LayoutDashboard, 
                  Briefcase, 
                  Users, 
                  Calendar,
                  FileText,
                  UserCircle,
                  Menu,
                  X,
                  Settings,
                  Bell,
                  Search,
                  Package,
                  FileCheck,
                  DollarSign,
                  Clock,
                  MapPin,
                  BarChart3,
                  TrendingUp,
                  Zap
                } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import {
        Sidebar,
        SidebarContent,
        SidebarGroup,
        SidebarGroupContent,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
        SidebarHeader,
        SidebarFooter,
        SidebarProvider,
        SidebarTrigger,
      } from "@/components/ui/sidebar";
      import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const getNavigationItems = (t) => [
  {
    title: t('dashboard'),
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Mobile Tech",
    url: createPageUrl("TechnicianMobile"),
    icon: MapPin,
    mobileOnly: true,
  },
  {
    title: t('jobs'),
    url: createPageUrl("Jobs"),
    icon: Briefcase,
  },
  {
    title: t('serviceCalls'),
    url: createPageUrl("ServiceCalls"),
    icon: UserCircle,
  },
  {
    title: t('schedule'),
    url: createPageUrl("Schedule"),
    icon: Calendar,
  },
  {
    title: t('calendar'),
    url: createPageUrl("Calendar"),
    icon: Calendar,
  },
  {
    title: t('customers'),
    url: createPageUrl("Customers"),
    icon: Users,
  },
  {
    title: t('team'),
    url: createPageUrl("Team"),
    icon: UserCircle,
  },
  {
    title: t('timeTracking'),
    url: createPageUrl("TimeTracking"),
    icon: Clock,
  },
  {
    title: t('documents'),
    url: createPageUrl("Documents"),
    icon: FileText,
  },
  {
    title: t('forms'),
    url: createPageUrl("Forms"),
    icon: FileCheck,
  },
  {
    title: t('automations'),
    url: createPageUrl("FormAutomations"),
    icon: Zap,
  },
  {
    title: t('reports'),
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: t('profitability'),
    url: createPageUrl("ProfitabilityReports"),
    icon: TrendingUp,
  },
  {
    title: t('costsManagement'),
    url: createPageUrl("CostsManagement"),
    icon: DollarSign,
  },
  {
    title: t('gpsTracking'),
    url: createPageUrl("GPSTracking"),
    icon: MapPin,
  },
  {
    title: t('quotations'),
    url: createPageUrl("Quotations"),
    icon: FileCheck,
  },
  {
    title: t('invoices'),
    url: createPageUrl("Invoices"),
    icon: FileText,
  },
  {
    title: t('assets'),
    url: createPageUrl("Assets"),
    icon: Package,
  },
  {
    title: t('priceLists'),
    url: createPageUrl("PriceLists"),
    icon: DollarSign,
  },
  {
    title: t('materials'),
    url: createPageUrl("Materials"),
    icon: Package,
  },
  {
    title: t('settings'),
    url: createPageUrl("Settings"),
    icon: Settings,
  },
  {
    title: t('roles'),
    url: createPageUrl("RoleManager"),
    icon: Shield,
  },
  ];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: [],
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const notifications = await base44.entities.Notification.filter({ user_email: user.email, read: false });
      return notifications.length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { t } = useTranslation();

  // Find current user's technician profile to check permissions
  const currentTech = technicians.find(t => t.email === user?.email);

  // Get user's role and permissions
  const userRole = currentTech?.role_id ? roles.find(r => r.id === currentTech.role_id) : null;
  const isAdmin = user?.role === 'admin';
  const isAdminOrManager = isAdmin || currentTech?.role === 'admin' || currentTech?.role === 'manager';

  // Determine visible modules based on role permissions
  let visibleModules;
  if (isAdmin) {
    visibleModules = ['dashboard', 'jobs', 'servicecalls', 'schedule', 'calendar', 'customers', 'team', 'time_tracking', 'documents', 'forms', 'reports', 'quotations', 'invoices', 'assets', 'price_lists', 'materials', 'gpstracking', 'settings', 'rolemanager'];
  } else if (userRole?.permissions) {
    visibleModules = Object.keys(userRole.permissions).filter(key => userRole.permissions[key]);
  } else {
    visibleModules = currentTech?.visible_modules || ['dashboard', 'jobs', 'servicecalls', 'schedule', 'calendar', 'time_tracking', 'documents', 'forms'];
  }

  const navigationItems = getNavigationItems(t);

  // Filter navigation items based on user permissions
  const filteredNavigation = navigationItems.filter(item => {
    const moduleName = item.url.split('?')[0].split('/').pop().toLowerCase();

    // GPS Tracking visibility - only for managers and admins
    if (moduleName === 'gpstracking') {
      return isAdminOrManager;
    }

    // Costs Management, Profitability Reports - only for managers and admins
    if (moduleName === 'costsmanagement' || moduleName === 'profitabilityreports') {
      return isAdminOrManager;
    }

    // Settings and Role Manager only for admins
    if (moduleName === 'settings' || moduleName === 'rolemanager') {
      return isAdmin || currentTech?.role === 'admin';
    }

    // Map page names to module names (handle underscore variations)
    const moduleMapping = {
      'timetracking': 'time_tracking',
      'pricelists': 'price_lists',
      'gpstracking': 'gps_tracking',
      'timereports': 'time_tracking',
      'profitabilityreports': 'reports',
      'costsmanagement': 'costs',
      'documents': 'documents',
      'forms': 'forms',
      'formbuilder': 'forms',
      'formsubmissions': 'forms',
      'formautomations': 'forms',
      'reports': 'reports'
    };

    const mappedModule = moduleMapping[moduleName] || moduleName;
    return visibleModules.includes(mappedModule) || visibleModules.includes(moduleName);
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">FieldPro</h2>
                    <p className="text-xs text-slate-500">FSM System</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* User Profile in Mobile */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-slate-700 font-semibold text-base">
                    {user?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 touch-manipulation
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                        }
                      `}
                    >
                      <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                      <span className={`font-medium text-base ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-slate-100 p-4">
              <Button
                variant="ghost"
                onClick={() => base44.auth.logout()}
                className="w-full justify-start gap-3 h-12 text-base"
              >
                <Settings className="w-5 h-5 text-slate-600" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <Sidebar className="border-r border-slate-200 bg-white hidden lg:flex">
          <SidebarHeader className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">FieldPro</h2>
                <p className="text-xs text-slate-500">FSM System</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-lg mb-1 ${
                            isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                <span className="text-slate-700 font-semibold text-sm">
                  {user?.full_name?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => base44.auth.logout()}
                className="h-8 w-8"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Hamburger */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 w-10 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                >
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{currentPageName}</h1>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    placeholder="Search jobs, customers..."
                    className="pl-9 w-64 border-slate-200"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-10 w-10 rounded-lg hover:bg-slate-100"
                  onClick={() => setNotificationOpen(true)}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
        </div>

        <NotificationCenter 
        open={notificationOpen} 
        onClose={() => setNotificationOpen(false)}
        currentUser={user}
        />
        </SidebarProvider>
        );
        }