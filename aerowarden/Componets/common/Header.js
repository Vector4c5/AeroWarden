import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

export default function Header() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [menuOpen, setMenuOpen] = useState(false);
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

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl">

            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* Logo */}
                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
                        AW
                    </div>

                    <span className="text-xl font-bold text-slate-900">
                        AeroWarden
                    </span>

                </div>

                {/* Navegación */}
                <nav className="flex items-center gap-8">

                    {session ? (

                        <div className="flex items-center gap-4">
                            <Link
                                href="/hangars"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Hangares
                            </Link>

                            <Link
                                href="/pending"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Pendientes
                            </Link>

                            <Link
                                href="/reports"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Reportes
                            </Link>

                            {/* Usuario */}
                            <div
                                className="relative"
                                ref={menuRef}
                            >

                                <button
                                    onClick={() =>
                                        setMenuOpen(
                                            !menuOpen
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    {session.user?.name ||
                                        "Usuario"}

                                    <svg
                                        className={`h-4 w-4 transition ${
                                            menuOpen
                                                ? "rotate-180"
                                                : ""
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
                                            onClick={() =>
                                                setMenuOpen(
                                                    false
                                                )
                                            }
                                        >
                                            Perfil
                                        </Link>

                                        <button
                                            onClick={() =>
                                                signOut({
                                                    callbackUrl:
                                                        "/",
                                                })
                                            }
                                            className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                                        >
                                            Cerrar sesión
                                        </button>

                                    </div>

                                )}

                            </div>
                        </div>

                    ) : (

                       <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Inicio
                            </Link>

                            <Link
                                href="/how-it-works"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Cómo funciona
                            </Link>

                            <Link
                                href="/contact"
                                className="text-sm font-medium text-black p-1 px-4 rounded-xl transition hover:bg-slate-100"
                            >
                                Contáctanos
                            </Link>

                            <button
                                onClick={() =>
                                    signIn(
                                        "google",
                                        {
                                            callbackUrl:
                                                router.asPath ||
                                                "/",
                                        }
                                    )
                                }
                                disabled={
                                    status ===
                                    "loading"
                                }
                                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                            >
                                {status ===
                                "loading"
                                    ? "Cargando..."
                                    : "Iniciar sesión"}
                            </button>
                        </div>
                    )}

                </nav>

            </div>

        </header>
    );
}