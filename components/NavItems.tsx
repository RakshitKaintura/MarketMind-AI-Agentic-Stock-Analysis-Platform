'use client';

import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchCommand from "./SearchCommand";

const NavItems = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <ul className="flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
            {NAV_ITEMS.map(({ href, label }) => {
                if (href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                );

                const active = isActive(href);
                return (
                    <li key={href}>
                        <Link
                            href={href}
                            className={`text-sm transition-colors duration-200 ${
                                active
                                    ? 'text-white font-medium'
                                    : 'text-[#A1A1AA] hover:text-white'
                            }`}
                        >
                            {label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};

export default NavItems;
