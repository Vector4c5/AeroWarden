import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

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
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">

          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            AeroWarden
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Login con Google
          </h1>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5">

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            {status === "loading" ? (

              <p className="text-sm text-slate-300">
                Cargando sesión...
              </p>

            ) : session ? (

              <div className="space-y-4">

                <p className="text-lg font-medium text-emerald-300">
                  Has iniciado sesión correctamente
                </p>

                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Foto de perfil"
                    className="h-20 w-20 rounded-full border border-white/20"
                  />
                )}

                <p className="text-sm text-slate-300">
                  Nombre: {session.user?.name}
                </p>

                <p className="break-all text-sm text-slate-300">
                  Correo: {session.user?.email}
                </p>

                <details className="rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
                  <summary className="cursor-pointer font-medium">
                    Ver datos de sesión
                  </summary>

                  <pre className="mt-2 overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </details>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Cerrar sesión
                </button>

              </div>

            ) : (

              <div className="space-y-4">

                <p className="text-sm text-slate-300">
                  Presiona para iniciar sesión con Google.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    signIn("google", {
                      callbackUrl: "/",
                    })
                  }
                  className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Iniciar sesión con Google
                </button>

              </div>

            )}

          </div>

        </section>
      </main>
    </div>
  );
}