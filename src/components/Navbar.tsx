"use client"

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, User, LogOut, LayoutDashboard, Languages, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 font-bold text-xl">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <span>Taskito</span>
      </div>
      
      <div className="flex items-center gap-2">
        {mounted && (
          <div className="flex items-center gap-1 mr-2">
            {(["en", "ar", "fr"] as const).map((lang) => (
              <Button
                key={lang}
                variant="ghost"
                onClick={() => setLocale(lang)}
                className={`text-xs h-7 px-2 ${locale === lang ? "bg-accent" : ""}`}
                aria-pressed={locale === lang}
                aria-label={`Switch to ${lang === "en" ? "English" : lang === "ar" ? "Arabic" : "French"}`}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </div>
        )}

        {mounted ? (
          <Button
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-9 h-9 flex items-center justify-center"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Sun className={`h-5 w-5 transition-all duration-300 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} aria-hidden={isDark} />
            <Moon className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} aria-hidden={!isDark} />
          </Button>
        ) : (
          <div className="w-9 h-9" />
        )}
        
        <Button variant="ghost" className="gap-2" onClick={() => router.push("/dashboard")} aria-label={t("common.dashboard")}>
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.dashboard")}</span>
        </Button>

        <Button variant="ghost" className="gap-2" onClick={() => router.push("/dashboard/settings")} aria-label={t("common.settings")}>
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.settings")}</span>
        </Button>

        <div className="h-6 w-px bg-border mx-2" />
        
        <Button variant="ghost" className="gap-2" onClick={handleLogout} aria-label={t("common.logout")}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.logout")}</span>
        </Button>
      </div>
    </nav>
  );
}
