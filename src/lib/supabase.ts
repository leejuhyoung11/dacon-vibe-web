import { createBrowserClient } from "@supabase/ssr";

type Client = ReturnType<typeof createBrowserClient>;

// SSR/빌드 시 URL 검증 오류 방지: 브라우저에서만 실제 클라이언트를 생성합니다.
// useEffect는 브라우저에서만 실행되므로, SSR 중에는 이 값이 사용되지 않습니다.
function createSupabase(): Client {
  if (typeof window === "undefined") {
    return undefined as unknown as Client;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase: Client = createSupabase();
