import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hangars, setHangars] = useState([]);
  const [loadingHangars, setLoadingHangars] = useState(false);

  const authError = Array.isArray(
    router.query.error
  )
    ? router.query.error[0]
    : router.query.error;

  const errorMessage = authError
    ? {
      Callback:
        "No se pudo completar el inicio de sesión. Revisa Google y la base de datos.",

      OAuthAccountNotLinked:
        "Este correo ya existe con otro método de inicio de sesión.",

      AccessDenied:
        "Google denegó el acceso.",

      Configuration:
        "Hay un problema de configuración en la autenticación.",

      default:
        "No se pudo iniciar sesión. Intenta de nuevo.",
    }[authError] ||
    "No se pudo iniciar sesión. Intenta de nuevo."
    : "";

  useEffect(() => {
    if (
      session &&
      authError
    ) {
      router.replace(
        "/",
        undefined,
        {
          shallow: true,
        }
      );
    }
  }, [
    session,
    authError,
    router,
  ]);
  useEffect(() => {

  if (!session) {
    return;
  }

  const loadHangars = async () => {

    setLoadingHangars(true);

    try {

      const response = await fetch("/api/hangars");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Error al cargar hangares"
        );
      }
      setHangars(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHangars(false);

    }
  };
  loadHangars();

}, [session]);

  return (
    <div className="min-h-screen bg-slate-50 text-black">

      <Header />

      {errorMessage && (
        <div className="mx-auto mt-6 max-w-6xl px-6">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            {errorMessage}

          </div>

        </div>
      )}

      {status ===
        "loading" ? (

        <main className="flex min-h-[60vh] items-center justify-center">

          <p className="text-slate-500">
            Cargando sesión...
          </p>

        </main>

      ) : session ? (

        /* Contenido para usuarios autenticados */
       <main>

    {/* Hero Section */}
    <section className="relative bg-black h-125 overflow-hidden">

        <img
            src="/hang.aeronave_2.jpg"
            alt="AeroWarden"
            className="h-full w-full object-cover opacity-40"
        />

        <div className="absolute inset-0 flex flex-col items-start justify-end px-10 py-16 text-white">

            <h1 className="mb-6 text-5xl font-bold md:text-7xl">

                Bienvenido a AeroWarden

            </h1>

            <p className="max-w-3xl text-lg text-slate-200 md:text-2xl">

                Plataforma web para la gestión de hangares,
                aeronaves y operaciones de mantenimiento aeronáutico.

            </p>

        </div>

    </section>

    <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="grid gap-8 lg:grid-cols-2">

            {/* Mis hangares */}
           {/* Hangares */}
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

        <div className="mb-6 flex items-center justify-between">

            <div>

                <h2 className="text-2xl font-bold text-slate-900">
                    Tus hangares
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Accede rápidamente a tus hangares más recientes.
                </p>

            </div>

            <Link
                href="/hangars"
                className="flex items-center gap-2 text-sm font-semibold text-black transition hover:bg-slate-100 px-3 py-4 rounded-lg"
            >
                Ver todos

                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>

            </Link>

        </div>

        {loadingHangars ? (

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                Cargando hangares...
            </div>

        ) : hangars.length > 0 ? (

            <div className="w-full flex flex-col justify-start items-center gap-3 p-2">

                {hangars
                    .slice(0, 3)
                    .map((hangar) => (

                        <div
                            key={hangar._id}
                            className="w-full h-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 gap-1 shadow-sm 
                            transition hover:-translate-y-1 hover:shadow-md"
                        >

                            <p className="text-xs font-semibold uppercase text-cyan-600">
                                Hangar
                            </p>

                            <h3 className="text-xl font-bold text-slate-900">
                                {hangar.name}
                            </h3>

                            <p className=" text-sm text-slate-500">
                                {hangar.location || "Ubicación no especificada"}
                            </p>

                        </div>

                    ))}

            </div>

        ) : (

            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500">

                <p>
                    Aún no tienes hangares registrados.
                </p>

                <Link
                    href="/hangars"
                    className="mt-4 inline-flex items-center gap-2 font-medium text-cyan-600 hover:text-cyan-700"
                >
                    Crear mi primer hangar

                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>

                </Link>

            </div>

        )}

    </section>


    {/* Pendientes */}
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

        <div className="mb-6 flex items-center justify-between">

            <div>

                <h2 className="text-2xl font-bold text-slate-900">
                    Pendientes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Actividades que requieren atención.
                </p>

            </div>

            <Link
                href="/pending"
               className="flex items-center gap-2 text-sm font-semibold text-black transition hover:bg-slate-100 px-3 py-4 rounded-lg"
            >
                Ver todos

                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>

            </Link>

        </div>

        <div className="space-y-4">

            {[
                "Inspección Cessna 172",
                "Actualizar reporte Piper PA-28",
                "Revisión documental del hangar",
                "Mantenimiento preventivo programado",
                "Verificar inventario de herramientas",
            ].map((task, index) => (

                <div
                    key={index}
                    className="w-full h-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 gap-1 shadow-sm 
                            transition hover:-translate-y-1 hover:shadow-md"
                >
                    <div>
                        <p className="font-medium text-slate-800">
                            {task}
                        </p>
                        <p className="text-sm text-slate-500">
                            Pendiente
                        </p>

                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pendiente
                    </span>
                </div>
            ))}
        </div>
    </section>
        </div>
    </section>
</main>

      ) : (

        /* Landing Page */
        <main>

          {/* Hero Section */}
          <section className="relative bg-black h-200 overflow-hidden">

            <img
              src="/hang.aeronave_2.jpg"
              alt="AeroWarden"
              fill
              priority
              className="object-cover opacity-40"
            />

            <div className="absolute inset-0 flex flex-col items-start justify-center text-white px-10 py-16">

              <h1 className="mb-6 text-5xl font-bold md:text-7xl">

                Bienvenido a AeroWarden

              </h1>

              <p className="max-w-3xl text-lg text-slate-200 md:text-2xl">

                Plataforma web para la gestión de hangares,
                aeronaves y operaciones de mantenimiento aeronáutico.

              </p>

            </div>

          </section>

          <div className="mx-auto max-w-6xl space-y-16 px-6 py-16">

            {/* Quienes somos */}
            <section className="rounded-3xl bg-white p-10 shadow-xl">

              <h2 className="mb-6 text-3xl font-bold text-slate-900">

                ¿Quiénes somos?

              </h2>

              <p className="leading-8 text-slate-600">

                AeroWarden es una plataforma desarrollada para
                modernizar la administración de hangares
                aeronáuticos mediante herramientas digitales que
                simplifican el seguimiento de aeronaves,
                la gestión de trabajos y la generación de
                reportes operativos.

              </p>

              <p className="mt-4 leading-8 text-slate-600">

                Nuestro objetivo es ayudar a talleres y
                organizaciones aeronáuticas a optimizar
                sus procesos administrativos, mejorar
                la trazabilidad de las operaciones y
                mantener un control centralizado de toda
                la información crítica.

              </p>

            </section>

            {/* Funcionalidades */}
            <section>

              <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">

                Funcionalidades principales

              </h2>

              <div className="grid gap-8 md:grid-cols-3">

                <div className="rounded-3xl bg-white p-8 shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl">

                    ✈️

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Gestión de aeronaves

                  </h3>

                  <p className="text-slate-600">

                    Registra y administra todas las aeronaves
                    asociadas a tus hangares desde una única
                    plataforma.

                  </p>

                </div>

                <div className="rounded-3xl bg-white p-8 shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl">

                    📋

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Seguimiento de trabajos

                  </h3>

                  <p className="text-slate-600">

                    Lleva un control detallado de
                    inspecciones, mantenimientos y
                    actividades pendientes.

                  </p>

                </div>

                <div className="rounded-3xl bg-white p-8 shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl">

                    📊

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Reportes inteligentes

                  </h3>

                  <p className="text-slate-600">

                    Genera reportes claros y organizados
                    para facilitar la toma de decisiones
                    operativas.

                  </p>

                </div>

              </div>

            </section>

            {/* Sección final */}
            <section className="rounded-3xl bg-slate-900 p-12 text-center text-white shadow-xl">

              <h2 className="mb-6 text-4xl font-bold">

                La administración aeronáutica del futuro

              </h2>

              <p className="mx-auto max-w-4xl text-lg leading-8 text-slate-300">

                Centraliza la información de hangares,
                aeronaves y procesos operativos en un solo
                lugar para mejorar la eficiencia,
                reducir errores y mantener un control
                completo sobre cada operación.

              </p>

            </section>

          </div>

        </main>

      )}

    </div>
  );
}