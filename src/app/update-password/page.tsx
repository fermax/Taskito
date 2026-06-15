"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import AuthControls from "@/components/AuthControls";

export default function UpdatePasswordPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((result: { data: { user: any } | null; error: any }) => {
      if (result.error || !result.data?.user) {
        router.replace("/login");
      }
    });
  }, [router, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth.password_min"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      toast.error(updateError.message, { position: "top-center" });
    } else {
      toast.success(t("auth.password_updated"), { position: "top-center" });
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
          <h1 className="text-2xl font-bold">{t("auth.update_password_title")}</h1>
          <p className="text-muted-foreground">{t("auth.update_password_subtitle")}</p>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium">{t("auth.new_password")}</label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`pr-10 ${error ? "border-destructive" : ""}`}
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
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="text-sm font-medium">{t("auth.confirm_new_password")}</label>
            <Input
              id="confirm-new-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? t("auth.updating") : t("auth.update_password_btn")}
          </Button>
        </form>
      </div>
    </div>
    </>
  );
}
