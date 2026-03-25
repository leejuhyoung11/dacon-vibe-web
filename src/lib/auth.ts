import { supabase } from "./supabase";

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) return;

  const popup = window.open(
    data.url,
    "google-login",
    "width=500,height=600,left=" +
      (window.screenX + (window.outerWidth - 500) / 2) +
      ",top=" +
      (window.screenY + (window.outerHeight - 600) / 2)
  );

  // 팝업이 닫히면 세션 확인
  const timer = setInterval(() => {
    if (popup?.closed) {
      clearInterval(timer);
      supabase.auth.getSession();
    }
  }, 500);
}

export async function signInWithGitHub() {
  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
