import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

import { AIRCRAFT_REPORT_LOGO_SRC } from "@/lib/aircraftReportConfig";

export default function Header() {
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";

    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const closeMenus = () => {
            setMenuOpen(false);
            setMobileMenuOpen(false);
        };

        router.events.on("routeChangeStart", closeMenus);

        return () => {
            router.events.off("routeChangeStart", closeMenus);
        };
    }, [router.events]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    const navLinks = session
        ? [
              { href: "/", label: "Inicio" },
              { href: "/hangars", label: "Hangares" },
              { href: "/pending", label: "Pendientes" },
          ]
        : [
              { href: "/", label: "Inicio" },
              { href: "/conocenos", label: "Conócenos" },
          ];

    const linkClass =
        "block rounded-xl px-4 py-2.5 text-base font-medium text-slate-900 transition hover:bg-slate-100";

    const loginButtonClass =
        "inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition duration-300 hover:scale-105 hover:bg-slate-800 hover:shadow-lg active:scale-100 lg:px-5 lg:py-2.5 lg:text-base";

    const sessionLabel =
        session?.user?.username ||
        session?.user?.name ||
        "Usuario";

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-200 p-2 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
                <Link
                    href="/"
                    className="flex min-w-0 items-center gap-2 sm:gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-10 sm:w-10">
                        <img
                            src={AIRCRAFT_REPORT_LOGO_SRC}
                            alt="AeroWarden"
                            className="h-full w-full object-contain p-1"
                        />
                    </div>
                    <span className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                        AeroWarden
                    </span>
                </Link>

                <nav className="hidden items-center gap-2 md:flex lg:gap-4">
                    {session ? (
                        <>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-xl px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-100 lg:px-4 lg:text-base"
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex max-w-[12rem] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-100 lg:max-w-none lg:text-base"
                                >
                                    <span className="truncate">
                                        {sessionLabel}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 shrink-0 transition ${
                                            menuOpen ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Perfil
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/admin/dashboard"
                                                className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                Panel Administrador
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                signOut({
                                                    callbackUrl: "/",
                                                })
                                            }
                                            className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-xl px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-100 lg:px-4 lg:text-base"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className={loginButtonClass}
                            >
                                Iniciar sesión
                            </Link>
                        </>
                    )}
                </nav>

                <button
                    type="button"
                    aria-label={
                        mobileMenuOpen
                            ? "Cerrar menú de navegación"
                            : "Abrir menú de navegación"
                    }
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-900 transition hover:bg-slate-100 md:hidden"
                >
                    {mobileMenuOpen ? (
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-slate-200 bg-slate-100/95 px-4 py-4 md:hidden">
                    <nav className="space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={linkClass}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {session ? (
                            <>
                                <p className="px-4 py-2 text-sm font-semibold text-slate-900">
                                    {sessionLabel}
                                </p>
                                <Link
                                    href="/profile"
                                    className={linkClass}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Perfil
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin/dashboard"
                                        className={linkClass}
                                        onClick={() =>
                                            setMobileMenuOpen(false)
                                        }
                                    >
                                        Panel Administrador
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        signOut({
                                            callbackUrl: "/",
                                        })
                                    }
                                    className={`${linkClass} w-full text-left text-red-600 hover:bg-red-50`}
                                >
                                    Cerrar sesión
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className={`${loginButtonClass} mt-2 w-full py-3`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Iniciar sesión
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
