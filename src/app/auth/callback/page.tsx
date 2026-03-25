"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function AuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        window.close();
      });
    } else {
      window.close();
    }
  }, [searchParams]);

  // Full-screen overlay so the Navbar/layout is never visible in the popup
  return <div className="fixed inset-0 bg-background z-[9999]" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}
