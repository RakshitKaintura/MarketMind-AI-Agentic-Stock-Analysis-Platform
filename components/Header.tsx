import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 z-50 w-full h-14 bg-[#050505] border-b border-[#27272A]">
            <div className="container h-full flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-black text-xs tracking-tighter shadow-sm transition-transform duration-200 group-hover:scale-95">
                        M
                    </div>
                    <span className="text-white font-semibold text-base tracking-tight select-none">
                        MarketMind
                    </span>
                </Link>

                {/* Nav links — hidden on mobile, shown sm+ */}
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                {/* Right section: user dropdown (contains mobile nav inside) */}
                <UserDropdown user={user} initialStocks={initialStocks} />
            </div>
        </header>
    );
};

export default Header;
