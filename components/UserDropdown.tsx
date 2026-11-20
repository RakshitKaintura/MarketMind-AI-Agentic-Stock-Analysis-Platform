'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import NavItems from "@/components/NavItems";
import { signOut } from "@/lib/actions/auth.actions";

const UserDropdown = ({ user, initialStocks }: { user: User; initialStocks: StockWithWatchlistStatus[] }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 py-1 h-auto text-[#A1A1AA] hover:text-white hover:bg-[#111111] transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                    <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src="https://avatars.githubusercontent.com/u/171288956?v=4&size=64" />
                        <AvatarFallback className="bg-[#161616] text-white text-xs font-semibold border border-[#27272A]">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-white">
                        {user.name}
                    </span>
                    <ChevronDown className="hidden md:block h-3.5 w-3.5 text-[#71717A]" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="bg-[#111111] border border-[#27272A] text-[#A1A1AA] min-w-[220px] mt-1 rounded-xl shadow-2xl"
            >
                {/* User info label */}
                <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src="https://avatars.githubusercontent.com/u/171288956?v=4&size=64" />
                            <AvatarFallback className="bg-[#161616] text-white text-sm font-semibold border border-[#27272A]">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{user.name}</span>
                            <span className="text-xs text-[#71717A] truncate">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#27272A]" />

                {/* Mobile nav links */}
                <nav className="sm:hidden px-1 py-1">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <DropdownMenuSeparator className="sm:hidden bg-[#27272A]" />

                {/* Sign out */}
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="mx-1 mb-1 rounded-md text-[#A1A1AA] hover:text-white focus:text-white hover:bg-[#161616] focus:bg-[#161616] transition-colors duration-200 cursor-pointer"
                >
                    <LogOut className="h-4 w-4 mr-2 shrink-0" />
                    <span className="text-sm font-medium">Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserDropdown;
