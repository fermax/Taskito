"use client"

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/LanguageProvider";

export default function AuthControls() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-4 end-4 z-50 flex items-center gap-1">
      <div className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-0.5 shadow-sm me-1">
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
      {mounted && (
        <Button
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden={theme === "dark"} />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden={theme === "light"} />
        </Button>
      )}
    </div>
  );
}
