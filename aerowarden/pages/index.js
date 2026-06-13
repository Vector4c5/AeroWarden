import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Header from "@/Componets/common/Header";
import { AIRCRAFT_REPORT_LOGO_SRC } from "@/lib/aircraftReportConfig";
import { buildDashboardPendientes } from "@/lib/pendientes";
import { IoMdAirplane } from "react-icons/io";
import { BsClipboard2CheckFill } from "react-icons/bs";
import { BsFileEarmarkBarGraphFill } from "react-icons/bs";

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Registro y Acceso",
    description: "Crea tu cuenta y accede a tu espacio aeronáutico.",
  },
  {
    step: 2,
    title: "Configura Hangares",
    description: "Registra tus hangares y define su ubicación.",
  },
  {
    step: 3,
    title: "Administra Aeronaves",
    description: "Almacena datos de aeronaves y lleva su historial completo.",
  },
  {
    step: 4,
    title: "Monitorea Operaciones",
    description:
      "Supervisa trabajos, mantenimiento y genera reportes rápidamente.",
  },
];

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

      <Header/>

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
          <section className="relative isolate overflow-hidden bg-black">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url(/hang_aeronave_2.jpg)" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

            <div className="relative z-10 flex min-h-56 flex-col items-center justify-end px-4 py-8 text-center text-white sm:min-h-[360px] sm:items-start sm:px-6 sm:py-12 sm:text-left md:min-h-[420px] md:px-10 md:py-16 lg:min-h-[500px]">

              <h1 className="mb-3 max-w-4xl text-2xl font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-7xl">

                Bienvenido a AeroWarden

              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-lg md:text-xl lg:text-2xl">

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
        <main className="w-full">

          {/* Hero Section */}
          <section className="relative isolate overflow-hidden bg-black">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url(/hang_aeronave_2.jpg)" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

            <div className="relative z-10 flex min-h-56 flex-col items-center justify-end px-4 py-8 text-center text-white sm:min-h-[360px] sm:items-start sm:px-6 sm:py-12 sm:text-left md:min-h-[420px] md:px-10 md:py-16 lg:min-h-[500px]">

              <h1 className="mb-3 max-w-4xl text-2xl font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-7xl">

                Bienvenido a AeroWarden

              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-lg md:text-xl lg:text-2xl">

                Plataforma web para la gestión de hangares,
                aeronaves y operaciones de mantenimiento aeronáutico.

              </p>

            </div>

          </section>

          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:gap-16 lg:py-16">

            {/* Quienes somos */}
            <section className="flex w-full flex-col items-center justify-center text-justify
            gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:gap-6 sm:p-8 
            lg:p-10">

              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">

                Acerca de AeroWarden

              </h2>

              <p className="max-w-4xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8 lg:text-xl">

                AeroWarden es una plataforma diseñada para optimizar
                las operaciones de hangares aeronáuticos mediante
                la gestión digital de aeronaves, el seguimiento
                de trabajos de mantenimiento y la generación de reportes
                operativos. Centraliza la información en un solo entorno,
                reduciendo procesos manuales y mejorando el control,
                la trazabilidad y la eficiencia de las operaciones.

              </p>

              <p className="max-w-4xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8 lg:text-xl">

                Nuestro objetivo es ayudar a talleres y
                organizaciones aeronáuticas a optimizar
                sus procesos administrativos, mejorar
                la trazabilidad de las operaciones y
                mantener un control centralizado de toda
                la información crítica.

              </p>

            </section>

            {/* Funcionalidades */}
            <section className="flex w-full flex-col items-center justify-center gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:gap-8 sm:p-8 lg:p-10">

              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">

                ¿Qué puede hacer AeroWarden?

              </h2>

              <div className="grid w-full gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">

                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">

                  <IoMdAirplane className="text-slate-900" size={64} />

                  <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">

                    Gestión de Aeronaves

                  </h3>

                  <p className="text-sm leading-6 text-slate-600 sm:text-base">

                    Registra y administra todas las aeronaves
                    asociadas a tus hangares desde una única
                    plataforma.

                  </p>

                </div>

                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">

                  <BsClipboard2CheckFill className="text-slate-900" size={64} />

                  <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">

                    Seguimiento de Trabajos

                  </h3>

                  <p className="text-sm leading-6 text-slate-600 sm:text-base">

                    Lleva un control detallado de
                    inspecciones, mantenimientos y
                    actividades pendientes.

                  </p>

                </div>

                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6 sm:col-span-2 lg:col-span-1">

                  <BsFileEarmarkBarGraphFill className="text-slate-900" size={64} />

                  <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">

                    Reportes Inteligentes

                  </h3>

                  <p className="text-sm leading-6 text-slate-600 sm:text-base">

                    Genera reportes claros y organizados
                    para facilitar la toma de decisiones
                    operativas.

                  </p>

                </div>

              </div>

            </section>

            {/* Flujo del proceso */}
            <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-center text-slate-900 shadow-lg sm:p-6 lg:p-8">

              <h2 className="mb-2 text-2xl font-bold sm:mb-3 sm:text-3xl lg:text-4xl">

                ¿Cómo funciona AeroWarden?

              </h2>

              <p className="mx-auto max-w-2xl text-sm text-slate-500 sm:text-base">
                Cuatro pasos para centralizar la operación de tu hangar.
              </p>

              <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col items-stretch gap-2 sm:mt-8 xl:flex-row xl:items-center xl:justify-center xl:gap-1">
                {HOW_IT_WORKS_STEPS.map((item, index) => (
                  <div key={item.step} className="contents">
                    <div className="flex min-w-0 h-full min-h-60 flex-col items-center justify-center 
                    rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition 
                    hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5 xl:flex-1 
                    xl:max-w-[13.5rem]">
                      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {item.step}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    {index < HOW_IT_WORKS_STEPS.length - 1 && (
                      <>
                        <div
                          aria-hidden="true"
                          className="flex shrink-0 items-center justify-center py-1 text-2xl font-light text-slate-300 xl:hidden"
                        >
                          ↓
                        </div>
                        <div
                          aria-hidden="true"
                          className="hidden shrink-0 items-center justify-center px-1 text-3xl font-light text-slate-300 xl:flex"
                        >
                          →
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

            </section>

            <section className="flex w-full max-w-3xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-5 text-center text-slate-900 shadow-lg sm:p-6">

              <h2 className="mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl">

                ¡Comienza ahora con AeroWarden!

              </h2>

              <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">

                Inicia tu aventura en la gestión con una plataforma segura, moderna y fácil de usar.

              </p>

              <div className="mt-4 flex h-20 w-auto items-center justify-center sm:h-80 sm:w-auto">
                <img
                  src={AIRCRAFT_REPORT_LOGO_SRC}
                  alt="Logo AeroWarden"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <Link
                href="/login?mode=register"
                className="mt-4 inline-flex rounded-full bg-slate-900 
                px-8 py-3 text-base font-semibold transition duration-300
                hover:bg-slate-800 sm:px-10 hover:scale-105 hover:shadow-lg"
              >
                <p className="text-white">
                Regístrate

                </p>
                
              </Link>

            </section>

          </div>

        </main>

      )}

    </div>
  );
}