"use client"

import { useTranslation } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">{t("common.welcome")}</h1>
      <p className="text-lg mb-8 text-muted-foreground max-w-2xl">
        {t("common.welcome_desc")}
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="outline">{t("common.login")}</Button>
        </Link>
        <Link href="/signup">
          <Button>{t("common.get_started")}</Button>
        </Link>
      </div>
    </div>
  );
}
