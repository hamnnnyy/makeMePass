import Link from "next/link"

const Navbar = () => {
    return (
        <header className="w-full px-[64px] py-6 flex justify-between items-center h-20">
            <div>logo</div>
            <nav className="flex items-center gap-2">
                <Link href={"/login"} className="text-base font-bold">로그인</Link>
                <span>|</span>
                <Link href={"/auth/register"}>회원가입</Link>
            </nav>
        </header>
    )
}

export default Navbar