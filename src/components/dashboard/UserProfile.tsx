"use client"

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";

export default function UserProfile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((result: { data: { user: any } | null; error: any }) => {
      const user = result.data?.user
      setUser(user);
      const url = user?.user_metadata?.avatar_url;
      if (url && url.startsWith("/uploads/")) setAvatarUrl(url);
    });
  }, []);

  if (!user) return <div className="animate-pulse bg-muted h-20 rounded-lg w-full" />;

  const displayName = user.user_metadata?.full_name || "";
  const avatarStyle = user.user_metadata?.avatar_style || "avataaars";
  const dicebearUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${user.email}`;
  const src = avatarUrl || dicebearUrl;

  return (
    <div className="p-6 bg-card rounded-xl border shadow-sm flex items-center gap-4">
      <img
        src={src}
        alt={displayName || user.email}
        className="w-12 h-12 rounded-full bg-muted ring-2 ring-border object-cover"
        onError={() => avatarUrl && setAvatarUrl(null)}
      />
      <div>
        <h3 className="font-semibold text-lg">{displayName || user.email}</h3>
        <p className="text-sm text-muted-foreground">{t("dashboard.profile_welcome")}</p>
      </div>
    </div>
  );
}
