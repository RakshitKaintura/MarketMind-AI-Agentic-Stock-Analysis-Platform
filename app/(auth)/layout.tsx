import Link from "next/link";
import Image from "next/image";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() })

    if(session?.user) redirect('/')

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-4 py-12">
            {/* Subtle ambient radial glow behind card */}
            <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
            >
                <div className="w-[600px] h-[600px] rounded-full bg-[#111111]/30 blur-3xl" />
            </div>

            {/* Auth card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex justify-center mb-8">
                    <Image
                        src="/assets/icons/logo.svg"
                        alt="Signalist logo"
                        width={140}
                        height={32}
                        className="h-8 w-auto"
                    />
                </Link>

                <div className="bg-[#111111] border border-[#27272A] rounded-2xl px-8 py-10 scrollbar-hide-default overflow-y-auto max-h-[85vh]">
                    {children}
                </div>
            </div>
        </main>
    )
}
export default Layout
