import { useState } from "react";
import {
  Leaf, LayoutDashboard, Sprout, Cloud, Camera, Droplets, FlaskConical, MessageCircle,
  Settings, HelpCircle, LogOut, Menu, X, Crown, Calendar, ShoppingCart, TestTubes,
  Users, Home, ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { copy } = useDashboardTranslations();

  const navSections = [
    {
      label: "Hub",
      items: [
        { icon: Home, label: "Hub", path: "/dashboard/hub" },
        { icon: LayoutDashboard, label: copy.sidebar.dashboard, path: "/dashboard" },
      ],
    },
    {
      label: "AI Tools",
      items: [
        { icon: Sprout, label: copy.sidebar.cropAdvisor, path: "/dashboard/crops" },
        { icon: TestTubes, label: copy.sidebar.soilAnalysis, path: "/dashboard/soil" },
        { icon: Camera, label: copy.sidebar.diseaseScanner, path: "/dashboard/disease" },
        { icon: Droplets, label: copy.sidebar.irrigation, path: "/dashboard/irrigation" },
        { icon: FlaskConical, label: copy.sidebar.fertilizer, path: "/dashboard/fertilizer" },
        { icon: MessageCircle, label: copy.sidebar.aiAssistant, path: "/dashboard/assistant" },
        { icon: ShieldCheck, label: "Safety Checker", path: "/dashboard/safety" },
      ],
    },
    {
      label: "Plan",
      items: [
        { icon: Cloud, label: copy.sidebar.weather, path: "/dashboard/weather" },
        { icon: Calendar, label: copy.sidebar.farmCalendar, path: "/dashboard/calendar" },
      ],
    },
    {
      label: "Community",
      items: [
        { icon: ShoppingCart, label: copy.sidebar.marketplace, path: "/dashboard/marketplace" },
        { icon: MessageCircle, label: "Community", path: "/dashboard/community" },
        { icon: Users, label: "Cooperatives", path: "/dashboard/cooperatives" },
      ],
    },
  ];

  const bottomNavItems = [
    { icon: Settings, label: copy.sidebar.settings, path: "/dashboard/settings" },
    { icon: HelpCircle, label: copy.sidebar.help, path: "/dashboard/help" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({ title: copy.common.signOutSuccess });
    navigate("/");
  };

  const sidebarContent = (
    <>
      <div
        className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border cursor-pointer flex-shrink-0"
        onClick={() => navigate("/")}
      >
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">
          AgroSense<span className="text-sidebar-primary">AI</span>
        </span>
      </div>

      {user && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-sm text-sidebar-foreground truncate">{user.email}</p>
          <span className="text-xs text-sidebar-foreground/50 px-2 py-0.5 bg-sidebar-accent rounded-full">
            {copy.sidebar.freePlan}
          </span>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 mx-1 p-4 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-sidebar-primary" />
            <span className="text-sm font-semibold text-sidebar-foreground">{copy.sidebar.premiumTitle}</span>
          </div>
          <p className="text-xs text-sidebar-foreground/60 mb-3">{copy.sidebar.premiumDescription}</p>
          <p className="text-sm font-bold text-sidebar-primary mb-2">{copy.sidebar.premiumPrice}</p>
          <button className="w-full py-2 px-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold hover:bg-sidebar-primary/90 transition-colors">
            {copy.sidebar.premiumButton}
          </button>
        </div>
      </nav>

      <div className="py-4 px-3 border-t border-sidebar-border flex-shrink-0">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <LogOut className="w-5 h-5" /> {copy.sidebar.signOut}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground shadow-lg"
        aria-label={copy.sidebar.openMenu}
      >
        <Menu className="w-5 h-5" />
      </button>
      <aside className="hidden lg:flex w-64 bg-sidebar h-screen flex-col fixed left-0 top-0 z-40">{sidebarContent}</aside>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="absolute left-0 top-0 w-72 bg-sidebar h-full flex flex-col shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
