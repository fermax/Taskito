"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import AuthControls from "@/components/AuthControls";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const savedEmail = localStorage.getItem("taskito_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.includes("@")) newErrors.email = t("auth.invalid_email");
    if (password.length < 6) newErrors.password = t("auth.password_min");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message, { position: "top-center" });
    } else {
      if (rememberMe) {
        localStorage.setItem("taskito_remembered_email", email);
        document.cookie = "taskito_remember_me=true; path=/; max-age=2592000; SameSite=Lax; Secure";
      } else {
        localStorage.removeItem("taskito_remembered_email");
        document.cookie = "taskito_remember_me=; path=/; max-age=0; SameSite=Lax; Secure";
      }
      toast.success(t("common.welcome_back"));
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <>
      <AuthControls />
      <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl border shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("auth.login_title")}</h1>
          <p className="text-muted-foreground">{t("auth.login_subtitle")}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">{t("auth.email")}</label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              placeholder="email@example.com"
              autoComplete="email"
              required
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium">{t("auth.password")}</label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span>{t("auth.remember_me")}</span>
              </label>
              <Link href="/reset-password" className="text-sm text-primary hover:underline">
                {t("auth.forgot_password")}
              </Link>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? t("auth.logging_in") : t("auth.submit_login")}
          </Button>
        </form>
        <div className="text-center text-sm">
          {t("auth.no_account")} {" "}
          <Link href="/signup" className="text-primary hover:underline">
            {t("common.signup")}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
