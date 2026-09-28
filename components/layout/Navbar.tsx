import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/service-role"
import { RARITY_COLOR } from "@/features/gamification/constants"
import { signOut } from "@/features/auth/server/account.server"

// 로그인하면 [장착 칭호] 이름, 아니면 로그인/회원가입
const Navbar = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let name: string | null = null
    let title: { name_ko: string; rarity: keyof typeof RARITY_COLOR } | null = null
    if (user) {
        // select('*'): 칭호 컬럼 마이그레이션 전에도 에러 없이 동작
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
        name = profile?.display_name ?? user.email ?? null
        if (profile?.equipped_achievement_id) {
            // 숨김 칭호는 RLS 로 안 보이므로 service role 로 조회 (본인 프로필의 id 라 안전)
            const { data } = await createServiceClient()
                .from("achievements_master")
                .select("name_ko, rarity")
                .eq("id", profile.equipped_achievement_id)
                .maybeSingle()
            title = data
        }
    }

    return (
        <header className="absolute inset-x-0 top-0 z-10 w-full px-6 md:px-16 py-6 flex justify-between items-center h-20">
            <Link href="/" className="font-bold tracking-tight">합사카</Link>
            <nav className="flex items-center gap-2 text-sm text-white/80">
                <Link href="/collection" className="hover:text-white">도감</Link>
                <span className="text-white/30">|</span>
                {user ? (
                    <details className="relative">
                        <summary className="list-none cursor-pointer hover:text-white select-none">
                            {title && <span style={{ color: RARITY_COLOR[title.rarity] }}>[{title.name_ko}] </span>}
                            {name} ▾
                        </summary>
                        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-neutral-900 border border-neutral-800 py-1 shadow-xl flex flex-col text-sm">
                            <Link href="/settings" className="px-4 py-2 hover:bg-neutral-800">프로필 · 설정</Link>
                            <Link href="/collection?tab=titles" className="px-4 py-2 hover:bg-neutral-800">칭호</Link>
                            <form action={signOut}>
                                <button className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-400">로그아웃</button>
                            </form>
                        </div>
                    </details>
                ) : (
                    <>
                        <Link href="/login" className="hover:text-white">로그인</Link>
                        <span className="text-white/30">|</span>
                        <Link href="/signup" className="hover:text-white">회원가입</Link>
                    </>
                )}
            </nav>
        </header>
    )
}

export default Navbar
