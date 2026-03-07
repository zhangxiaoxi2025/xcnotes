import { useLocation, Link } from "wouter";
import { Home, FolderOpen, User } from "lucide-react";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/directories", label: "目录", icon: FolderOpen },
  { path: "/profile", label: "我的", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.label}`}
              >
                <item.icon
                  className={`transition-all duration-200 ${
                    active ? "w-6 h-6" : "w-5 h-5"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    active ? "font-semibold" : ""
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
