"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GOATCOUNTER_CODE } from "@/lib/site";

declare global {
  interface Window {
    goatcounter?: { count?: (opts: { path: string }) => void };
  }
}

export function GoatCounter() {
  const pathname = usePathname();

  useEffect(() => {
    window.goatcounter?.count?.({ path: pathname });
  }, [pathname]);

  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return null;

  return (
    <Script
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
      data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`}
    />
  );
}
