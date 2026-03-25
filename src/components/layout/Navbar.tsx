"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sun, Moon, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, signOut } from "@/lib/auth";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }

    // 초기 세션 확인
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setUser(res.data.session?.user ?? null);
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleSignOut() {
    await signOut();
    window.location.reload();
  }

  const navLinks = [
    { href: "/", label: "메인", exact: true },
    { href: "/hackathons", label: "해커톤", exact: false },
    { href: "/camp", label: "캠프", exact: false },
    { href: "/rankings", label: "랭킹", exact: false },
  ];

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-bold text-xl tracking-tight">
          <span className="text-primary">DAKER</span>
          <span className="text-xs font-normal text-muted-foreground bg-muted rounded px-1.5 py-0.5">VIBE</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLinks.map((l) => {
            const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="테마 전환"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {avatarLetter}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg py-1 z-50">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border truncate">
                    {user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut size={14} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <LogIn size={14} />
              로그인
            </button>
          )}
        </div>
      </div>

      {/* 메뉴 외부 클릭 닫기 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
