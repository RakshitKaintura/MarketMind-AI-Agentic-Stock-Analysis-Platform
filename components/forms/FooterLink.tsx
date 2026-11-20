import Link from "next/link";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
    return (
        <div className="text-center pt-4">
            <p className="text-sm text-[#71717A]">
                {text}{` `}
                <Link href={href} className="text-white font-medium hover:underline transition-colors duration-200">
                    {linkText}
                </Link>
            </p>
        </div>
    )
}
export default FooterLink