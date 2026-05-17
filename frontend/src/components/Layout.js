import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, UserPlus, Users, Settings, LogOut, Menu, BarChart3, ClipboardList, Ruler, School, Trophy, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import "@/App.css";

function getNavItems(role) {
  if (role === "school_user") {
    return [
      { path: "/school-portal", label: "تسجيل الطلاب", icon: ClipboardList },
      { path: "/records", label: "نتائج الطلاب", icon: Trophy },
      { path: "/tests-info", label: "دليل الاختبارات", icon: BookOpen },
    ];
  }
  if (role === "trainer") {
    return [
      { path: "/trainer", label: "القياسات والاختبارات", icon: Ruler },
      { path: "/records", label: "نتائج الطلاب", icon: Trophy },
      { path: "/tests-info", label: "دليل الاختبارات", icon: BookOpen },
    ];
  }
  // admin and viewer
  return [
    { path: "/", label: "لوحة التحكم", icon: LayoutDashboard },
    { path: "/students/new", label: "تسجيل طالب", icon: UserPlus },
    { path: "/trainer", label: "القياسات والاختبارات", icon: Ruler },
    { path: "/students", label: "قائمة الطلاب", icon: Users },
    { path: "/schools-list", label: "قائمة المدارس", icon: School },
    { path: "/comparison", label: "مقارنة المدارس", icon: BarChart3 },
    { path: "/records", label: "نتائج الطلاب", icon: Trophy },
    { path: "/records-analysis", label: "تحليل الأرقام القياسية", icon: Award },
    { path: "/tests-info", label: "دليل الاختبارات", icon: BookOpen },
    ...(role === "admin" ? [{ path: "/admin", label: "الإدارة", icon: Settings }] : []),
  ];
}

function getRoleLabel(role) {
  const map = { admin: "مدير", school_user: "مدرسة", trainer: "مدرب", viewer: "عارض" };
  return map[role] || role;
}

function SidebarContent({ user, onLogout, onNavClick }) {
  const location = useLocation();
  const navItems = getNavItems(user?.role);

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#E5E1D8]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="شعار اللياقة البدنية" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A] font-['Alexandria']">اللياقة البدنية</h2>
            <p className="text-xs text-[#9CA3AF]">نظام تسجيل الطلاب</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              data-testid={`nav-${item.path.replace(/\//g, "").replace(/-/g, "") || "dashboard"}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#8A1538] text-white shadow-sm"
                  : "text-[#4B5563] hover:bg-[#F5F3EC] hover:text-[#8A1538]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#E5E1D8]">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs text-[#9CA3AF]">مرحباً</p>
          <p className="text-sm font-medium text-[#1A1A1A] truncate">{user?.name || user?.email}</p>
          {user?.school_name && <p className="text-xs text-[#8A1538] mt-0.5">{user.school_name}</p>}
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium">
            {getRoleLabel(user?.role)}
          </span>
        </div>
        <Button
          variant="ghost"
          data-testid="logout-btn"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <aside className="hidden lg:block fixed right-0 top-0 w-64 h-full bg-white border-l border-[#E5E1D8] z-40">
        <SidebarContent user={user} onLogout={logout} />
      </aside>

      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#E5E1D8] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="شعار اللياقة البدنية" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-sm font-bold text-[#1A1A1A] font-['Alexandria']">اللياقة البدنية</span>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SidebarContent user={user} onLogout={logout} onNavClick={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="lg:mr-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
