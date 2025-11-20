import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  MapPin
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const navigationItems = [
  {
    title: "Dashboard",
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
    title: "Jobs",
    url: createPageUrl("Jobs"),
    icon: Briefcase,
  },
  {
    title: "Schedule",
    url: createPageUrl("Schedule"),
    icon: Calendar,
  },
  {
    title: "Customers",
    url: createPageUrl("Customers"),
    icon: Users,
  },
  {
    title: "Team",
    url: createPageUrl("Team"),
    icon: UserCircle,
  },
  {
    title: "Time Tracking",
    url: createPageUrl("TimeTracking"),
    icon: Clock,
  },
  {
    title: "GPS Tracking",
    url: createPageUrl("GPSTracking"),
    icon: MapPin,
  },
  {
    title: "Quotations",
    url: createPageUrl("Quotations"),
    icon: FileCheck,
  },
  {
    title: "Invoices",
    url: createPageUrl("Invoices"),
    icon: FileText,
  },
  {
    title: "Assets",
    url: createPageUrl("Assets"),
    icon: Package,
  },
  {
    title: "Price Lists",
    url: createPageUrl("PriceLists"),
    icon: DollarSign,
  },
  {
    title: "Materials",
    url: createPageUrl("Materials"),
    icon: Package,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

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

  // Find current user's technician profile to check permissions
  const currentTech = technicians.find(t => t.email === user?.email);

  // If user is admin or has no tech profile, show all
  const isAdmin = user?.role === 'admin' || !currentTech;
  const visibleModules = isAdmin 
    ? ['dashboard', 'jobs', 'schedule', 'customers', 'team', 'time_tracking', 'quotations', 'invoices', 'assets', 'price_lists', 'materials', 'gpstracking', 'settings']
    : (currentTech?.visible_modules || ['dashboard', 'jobs', 'schedule', 'time_tracking']);

  // Filter navigation items based on user permissions
  const filteredNavigation = navigationItems.filter(item => {
    const moduleName = item.url.split('?')[0].split('/').pop().toLowerCase();

    // GPS Tracking visibility - only for managers and admins
    if (moduleName === 'gpstracking') {
      return isAdmin || currentTech?.role === 'admin' || currentTech?.role === 'manager';
    }

    // Settings always visible for admins
    if (moduleName === 'settings') {
      return isAdmin || currentTech?.role === 'admin';
    }

    // Map page names to module names (handle underscore variations)
    const moduleMapping = {
      'timetracking': 'time_tracking',
      'pricelists': 'price_lists',
      'gpstracking': 'gps_tracking'
    };

    const mappedModule = moduleMapping[moduleName] || moduleName;
    return visibleModules.includes(mappedModule) || visibleModules.includes(moduleName);
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white">
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
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-slate-900 hidden sm:block">{currentPageName}</h1>
              </div>
              
              <div className="flex items-center gap-3">
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
                  className="relative"
                  onClick={() => setNotificationOpen(true)}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
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