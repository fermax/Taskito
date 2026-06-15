"use client"

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import AuthControls from "@/components/AuthControls";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error(t("auth.invalid_email"), { position: "top-center" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast.error(error.message, { position: "top-center" });
    } else {
      setSent(true);
      toast.success(t("auth.email_sent"), { position: "top-center" });
    }
    setLoading(false);
  };

  return (
    <>
      <AuthControls />
      <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl border shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("auth.reset_password_title")}</h1>
          <p className="text-muted-foreground">{t("auth.reset_password_subtitle")}</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t("auth.email_sent")}</p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                {t("auth.back_to_login")}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium">{t("auth.email")}</label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? t("auth.sending") : t("auth.send_reset_link")}
            </Button>
          </form>
        )}
        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            {t("auth.back_to_login")}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
