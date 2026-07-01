import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "词表输入" },
  { to: "/dictation", label: "语音播报" },
  { to: "/upload", label: "拍照上传" },
  { to: "/correction", label: "批改结果" },
  { to: "/mistakes", label: "错题本" },
];

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          <h1 className="mr-8 text-lg font-bold">语文智能听写</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
