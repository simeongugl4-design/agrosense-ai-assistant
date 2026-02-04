import { 
  Leaf, 
  LayoutDashboard, 
  Sprout, 
  Cloud, 
  Camera, 
  Droplets, 
  FlaskConical, 
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Sprout, label: "Crop Advisor", path: "/dashboard/crops" },
  { icon: Cloud, label: "Weather", path: "/dashboard/weather" },
  { icon: Camera, label: "Disease Scanner", path: "/dashboard/disease" },
  { icon: Droplets, label: "Irrigation", path: "/dashboard/irrigation" },
  { icon: FlaskConical, label: "Fertilizer", path: "/dashboard/fertilizer" },
  { icon: MessageCircle, label: "AI Assistant", path: "/dashboard/assistant" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-sidebar h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div 
        className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">
          AgroSense<span className="text-sidebar-primary">AI</span>
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-3 border-t border-sidebar-border">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
