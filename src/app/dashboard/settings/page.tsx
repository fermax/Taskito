"use client"

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useTranslation } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";

const AVATAR_STYLES = [
  "avataaars", "bottts", "identicon", "initials",
  "lorelei", "adventurer", "pixel-art", "big-ears",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function SettingsPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarMode, setAvatarMode] = useState<"dicebear" | "custom">("dicebear");
  const [avatarStyle, setAvatarStyle] = useState("avataaars");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((result: { data: { user: any } | null; error: any }) => {
      const u = result.data?.user
      if (u) {
        setUser(u);
        setDisplayName(u.user_metadata?.full_name || "");
        const url = u.user_metadata?.avatar_url || "";
        if (url && (url.startsWith("/uploads/") || url.startsWith("http"))) {
          setAvatarMode("custom");
          setAvatarUrl(url);
        } else {
          setAvatarStyle(u.user_metadata?.avatar_style || "avataaars");
        }
      }
      setLoading(false);
    });
  }, []);

  const getDicebearUrl = (style: string) =>
    `https://api.dicebear.com/7.x/${style}/svg?seed=${user?.email || "default"}`;

  const currentAvatar = avatarMode === "custom" && avatarUrl
    ? avatarUrl
    : getDicebearUrl(avatarStyle);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || t("dashboard.settings_upload_error"));
      setUploading(false);
      return;
    }

    const avatarUrl = result.url;
    setAvatarMode("custom");
    setAvatarUrl(avatarUrl);
    setUploading(false);
    await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    setUser((prev: any) => prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: avatarUrl } } : prev);
    toast.success(t("dashboard.settings_photo_updated"));
  };

  const handleRemovePhoto = async () => {
    setAvatarMode("dicebear");
    setAvatarUrl("");
    localStorage.removeItem("taskito_avatar_url");
    await supabase.auth.updateUser({
      data: { avatar_url: undefined, avatar_style: avatarStyle, full_name: displayName },
    });
    setUser((prev: any) => prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: undefined, avatar_style: avatarStyle } } : prev);
    toast.success(t("dashboard.settings_photo_removed"));
  };

  const handleSave = async () => {
    setSaving(true);
    const metadata: any = { full_name: displayName };
    if (avatarMode === "custom" && avatarUrl) {
      metadata.avatar_url = avatarUrl;
    } else {
      metadata.avatar_style = avatarStyle;
    }
    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) {
      toast.error(t("dashboard.settings_error"));
    } else {
      toast.success(t("dashboard.settings_saved"));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t("dashboard.settings_title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.settings_subtitle")}</p>
      </header>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-lg">{t("dashboard.settings_avatar")}</h2>

        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <img
            src={currentAvatar}
            alt="Preview"
            className="w-16 h-16 rounded-full ring-2 ring-border bg-background object-cover"
          />
          <div>
            <p className="font-medium text-sm">{displayName || user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {avatarMode === "custom" ? t("dashboard.settings_custom_photo") : avatarStyle}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">{t("dashboard.settings_dicebear")}</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => { setAvatarMode("dicebear"); setAvatarStyle(style); }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  avatarMode === "dicebear" && avatarStyle === style
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
                aria-label={style}
                aria-pressed={avatarMode === "dicebear" && avatarStyle === style}
              >
                <img
                  src={getDicebearUrl(style)}
                  alt={style}
                  className="w-full aspect-square rounded-md"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm font-medium mb-3">{t("dashboard.settings_custom_photo")}</p>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {t("dashboard.settings_upload_photo")}
            </Button>
            {avatarMode === "custom" && (
              <Button variant="ghost" onClick={handleRemovePhoto}>
                {t("dashboard.settings_remove_photo")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("dashboard.settings_upload_hint")}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-lg">{t("dashboard.settings_display_name")}</h2>
        <div className="space-y-2">
          <Label htmlFor="display-name">{t("dashboard.settings_display_name")}</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("dashboard.settings_display_name_placeholder")}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-lg">{t("dashboard.settings_email")}</h2>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.email}</span>
            {user?.email_confirmed_at ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                {t("dashboard.settings_email_verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="w-3 h-3" />
                {t("dashboard.settings_email_unverified")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-lg">{t("dashboard.settings_password")}</h2>
        <Link href="/update-password">
          <Button variant="outline" className="gap-2">
            {t("dashboard.settings_change_password")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8 py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving ? t("dashboard.settings_saving") : t("dashboard.settings_save")}
        </Button>
      </div>
    </div>
  );
}
