import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Header from "@/Componets/common/Header";
import { buildDashboardPendientes } from "@/lib/pendientes";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hangars, setHangars] = useState([]);
  const [aircraftByHangar, setAircraftByHangar] = useState({});
  const [loadingHangars, setLoadingHangars] = useState(false);
  const [loadingPendientes, setLoadingPendientes] = useState(false);

  const featuredHangars = useMemo(
    () => hangars.slice(0, 3),
    [hangars]
  );

  const dashboardPendientes = useMemo(
    () => buildDashboardPendientes(hangars, aircraftByHangar),
    [hangars, aircraftByHangar]
  );

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

  useEffect(() => {

    if (!session || hangars.length === 0) {
      setAircraftByHangar({});
      return;
    }

    const loadAircraftForHangars = async () => {

      setLoadingPendientes(true);

      try {

        const aircraftEntries = await Promise.all(
          hangars.map(async (hangar) => {
            const response = await fetch(
              `/api/aircraft?hangarId=${hangar._id}`
            );
            const data = await response.json();

            return [
              hangar._id,
              response.ok ? data : [],
            ];
          })
        );

        setAircraftByHangar(
          Object.fromEntries(aircraftEntries)
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPendientes(false);
      }
    };

    loadAircraftForHangars();

  }, [session, hangars]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-black">

      <Header />

      {errorMessage && (
        <div className="mx-auto mt-4 max-w-6xl px-4 sm:mt-6 sm:px-6">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            {errorMessage}

          </div>

        </div>
      )}

      {status ===
        "loading" ? (

        <main className="flex min-h-[50vh] items-center justify-center px-4 sm:min-h-[60vh]">

          <p className="text-slate-500">
            Cargando sesión...
          </p>

        </main>

      ) : session ? (

        /* Contenido para usuarios autenticados */
        <main>

          {/* Hero Section */}
          <section className="relative min-h-[280px] overflow-hidden bg-black sm:min-h-[360px] md:min-h-[420px] lg:min-h-[500px]">

            <img
              src="/hang_aeronave_2.jpg"
              alt="AeroWarden"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />

            <div className="absolute inset-0 flex flex-col items-start justify-end px-4 py-10 text-white sm:px-6 sm:py-12 md:px-10 md:py-16">

              <h1 className="mb-4 max-w-4xl text-3xl font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-7xl">

                Bienvenido a AeroWarden

              </h1>

              <p className="max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg md:text-xl lg:text-2xl">

                Plataforma web para la gestión de hangares,
                aeronaves y operaciones de mantenimiento aeronáutico.

              </p>

            </div>

          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">

              {/* Mis hangares */}
              {/* Hangares */}
              <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6 lg:p-8">

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      Tus hangares
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Accede rápidamente a tus hangares más recientes.
                    </p>

                  </div>

                  <Link
                    href="/hangars"
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-black transition hover:bg-slate-100 sm:py-3"
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

                  <div className="flex w-full flex-col items-stretch gap-3 p-2">

                    {featuredHangars.map((hangar) => (

                      <Link
                        key={hangar._id}
                        href={`/hangars/${hangar._id}`}
                        className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-md"
                      >

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0">

                            <p className="text-xs font-semibold uppercase text-cyan-600">
                              Hangar
                            </p>

                            <h3 className="break-words text-lg font-bold text-slate-900 group-hover:text-cyan-900 sm:text-xl">
                              {hangar.name}
                            </h3>

                            <p className="text-sm text-slate-500">
                              {hangar.location || "Ubicación no especificada"}
                            </p>

                            {hangar.baseAirport && (
                              <p className="mt-1 text-xs text-slate-500">
                                {hangar.baseAirport}
                              </p>
                            )}

                          </div>

                          <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 transition group-hover:bg-cyan-100 group-hover:text-cyan-800 sm:shrink-0">
                            Ir al hangar
                          </span>

                        </div>

                      </Link>

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
              <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6 lg:p-8">

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      Pendientes
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Actividades que requieren atención.
                    </p>

                  </div>

                  <Link
                    href="/pending"
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-black transition hover:bg-slate-100 sm:py-3"
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

                {loadingPendientes ? (

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                    Cargando pendientes...
                  </div>

                ) : dashboardPendientes.length > 0 ? (

                  <div className="space-y-4">

                    {dashboardPendientes.map((task) => (

                      <Link
                        key={`${task.aircraftId}-${task.title}`}
                        href={`/hangars/${task.hangarId}/aircraft/${task.aircraftId}`}
                        className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:bg-amber-50 hover:shadow-md sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                      >

                        <div className="min-w-0">

                          <p className="font-medium text-slate-800 group-hover:text-amber-900">
                            {task.title}
                          </p>

                          <p className="mt-1 break-words text-sm text-slate-500">
                            {task.taskType}
                            {" · "}
                            {task.registration}
                            {task.description
                              ? ` · ${task.description}`
                              : ""}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {task.hangarName}
                          </p>

                        </div>

                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pendiente
                        </span>

                      </Link>

                    ))}

                  </div>

                ) : (

                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500">

                    <p>
                      No hay trabajos pendientes en tus hangares.
                    </p>

                    <Link
                      href="/hangars"
                      className="mt-4 inline-flex items-center gap-2 font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      Ir a mis hangares

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
            </div>
          </section>
        </main>

      ) : (

        /* Landing Page */
        <main>

          {/* Hero Section */}
          <section className="relative min-h-[280px] overflow-hidden bg-black sm:min-h-[360px] md:min-h-[420px] lg:min-h-[500px]">

            <img
              src="/hang_aeronave_2.jpg"
              alt="AeroWarden"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />

            <div className="absolute inset-0 flex flex-col items-start justify-end px-4 py-10 text-white sm:px-6 sm:py-12 md:px-10 md:py-16">

              <h1 className="mb-4 max-w-4xl text-3xl font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-7xl">

                Bienvenido a AeroWarden

              </h1>

              <p className="max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg md:text-xl lg:text-2xl">

                Plataforma web para la gestión de hangares,
                aeronaves y operaciones de mantenimiento aeronáutico.

              </p>

            </div>

          </section>

          <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:space-y-14 sm:px-6 sm:py-14 lg:space-y-16 lg:py-16">

            {/* Quienes somos */}
            <section className="rounded-3xl bg-white p-5 shadow-xl sm:p-8 lg:p-10">

              <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:mb-6 sm:text-3xl">

                ¿Quiénes somos?

              </h2>

              <p className="leading-8 text-slate-600">

                AeroWarden es una plataforma diseñada para optimizar
                las operaciones de hangares aeronáuticos mediante
                la gestión digital de aeronaves, el seguimiento
                de trabajos de mantenimiento y la generación de reportes
                operativos. Centraliza la información en un solo entorno,
                reduciendo procesos manuales y mejorando el control,
                la trazabilidad y la eficiencia de las operaciones.

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

              <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:mb-10 sm:text-3xl">

                Funcionalidades Principales

              </h2>

              <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">

                <div className="rounded-3xl bg-white p-6 text-center shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-8">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl mx-auto">

                    🛬

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Gestión de Aeronaves

                  </h3>

                  <p className="text-slate-600">

                    Registra y administra todas las aeronaves
                    asociadas a tus hangares desde una única
                    plataforma.

                  </p>

                </div>

                <div className="rounded-3xl bg-white p-6 text-center shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-8">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl mx-auto">

                    📄

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Seguimiento de Trabajos

                  </h3>

                  <p className="text-slate-600">

                    Lleva un control detallado de
                    inspecciones, mantenimientos y
                    actividades pendientes.

                  </p>

                </div>

                <div className="rounded-3xl bg-white p-6 text-center shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-8">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-3xl mx-auto">

                    📈

                  </div>

                  <h3 className="mb-4 text-xl font-semibold">

                    Reportes Inteligentes

                  </h3>

                  <p className="text-slate-600">

                    Genera reportes claros y organizados
                    para facilitar la toma de decisiones
                    operativas.

                  </p>

                </div>

              </div>

            </section>

            {/* Flujo del proceso */}
            <section className="rounded-3xl bg-white p-5 text-center text-slate-900 shadow-xl sm:p-8 lg:p-12">

              <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl lg:text-4xl">

                Flujo de Proceso

              </h2>

              <p className="mx-auto max-w-4xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">

                A continuación se muestra cómo AeroWarden gestiona hangares, aeronaves y operaciones:

              </p>

              <div className="mx-auto mt-8 flex max-w-7xl flex-col items-stretch gap-4 text-center sm:mt-10 sm:gap-6 xl:flex-row xl:items-center xl:justify-center xl:gap-3">
                <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-gray-100 p-5 text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-h-44 sm:p-6 xl:min-h-52 xl:w-80 xl:px-7 xl:py-8">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    1
                  </span>
                  <h3 className="text-xl font-semibold">Registro y Acceso</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                    Crea tu cuenta y accede a tu espacio aeronáutico.
                  </p>
                </div>

                <div className="hidden shrink-0 items-center justify-center px-1 text-4xl font-black leading-none text-cyan-600 xl:flex xl:text-5xl">
                  →
                </div>

                <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-gray-100 p-5 text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-h-44 sm:p-6 xl:min-h-52 xl:w-80 xl:px-7 xl:py-8">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    2
                  </span>
                  <h3 className="text-xl font-semibold">Configura Hangares</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                    Registra tus hangares y define su ubicación.
                  </p>
                </div>

                <div className="hidden shrink-0 items-center justify-center px-1 text-4xl font-black leading-none text-cyan-600 xl:flex xl:text-5xl">
                  →
                </div>

                <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-gray-100 p-5 text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-h-44 sm:p-6 xl:min-h-52 xl:w-80 xl:px-7 xl:py-8">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    3
                  </span>
                  <h3 className="text-xl font-semibold">Administra Aeronaves</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                    Almacena datos de aeronaves y lleva su historial completo.
                  </p>
                </div>

                <div className="hidden shrink-0 items-center justify-center px-1 text-4xl font-black leading-none text-cyan-600 xl:flex xl:text-5xl">
                  →
                </div>

                <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-gray-100 p-5 text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:min-h-44 sm:p-6 xl:min-h-52 xl:w-80 xl:px-7 xl:py-8">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    4
                  </span>
                  <h3 className="text-xl font-semibold">Monitorea Operaciones</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                    Supervisa trabajos, mantenimiento y reportes desde un panel central.
                  </p>
                </div>
              </div>

            </section>
            <section className="rounded-3xl bg-white p-5 text-center text-slate-900 shadow-xl sm:p-8 lg:p-12">

              <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl lg:text-4xl">

                ¡Comienza ahora con AeroWarden!

              </h2>

              <p className="mx-auto max-w-4xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">

                Inicia tu aventura en la gestión con una plataforma segura, moderna y fácil de usar.

              </p>

              <Link
                href="/login?mode=register"
                className="mt-8 inline-flex rounded-full bg-gray-100 px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-gray-200"
              >
                Regístrate
              </Link>

            </section>

          </div>

        </main>

      )}

    </div>
  );
}