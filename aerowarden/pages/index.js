import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const authError = Array.isArray(router.query.error)
    ? router.query.error[0]
    : router.query.error;

  const errorMessage = authError
    ? {
        Callback:
          "No se pudo completar el inicio de sesión. Revisa Google y la base de datos.",
        OAuthAccountNotLinked:
          "Este correo ya existe con otro método de inicio de sesión.",
        AccessDenied: "Google denegó el acceso.",
        Configuration:
          "Hay un problema de configuración en la autenticación.",
        default:
          "No se pudo iniciar sesión. Intenta de nuevo.",
      }[authError] ||
      "No se pudo iniciar sesión. Intenta de nuevo."
    : "";

  useEffect(() => {
    if (session && authError) {
      router.replace("/", undefined, {
        shallow: true,
      });
    }
  }, [session, authError, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-black">
      <Header />

      <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-4xl items-start justify-center px-6 py-10">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.28)]">

          <p className="text-sm uppercase tracking-[0.3em] text-cyan-700/80">
            AeroWarden
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Login con Google
          </h1>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {status === "loading" ? (

              <p className="text-sm text-slate-500">
                Cargando sesión...
              </p>

            ) : session ? (

              <div className="space-y-4">

                <p className="text-lg font-medium text-emerald-700">
                  Has iniciado sesión correctamente
                </p>

                <p className="text-sm text-slate-600">
                  Nombre: {session.user?.name}
                </p>

                <p className="break-all text-sm text-slate-600">
                  Correo: {session.user?.email}
                </p>

                <Link
                  href="/landing"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100"
                >
                  Ir a landing
                </Link>

                <details className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
                  <summary className="cursor-pointer font-medium">
                    Ver datos de sesión
                  </summary>

                  <pre className="mt-2 overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </details>

              </div>

            ) : (

              <div className="space-y-4">

                <p className="text-sm text-slate-600">
                  Usa el botón del encabezado para iniciar sesión con Google.
                </p>

              </div>

            )}

          </div>

        </section>
      </main>
    </div>
  );
}