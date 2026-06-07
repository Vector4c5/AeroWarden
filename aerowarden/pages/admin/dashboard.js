import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

const statCardClass =
  "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("es-ES") : "Sin fecha";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      router.replace("/landing");
      return;
    }

    if (session?.user?.role !== "admin") {
      router.replace("/landing");
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/landing");
            return;
          }

          throw new Error(data.error || "No se pudo cargar el dashboard");
        }

        setDashboard(data);
      } catch (error) {
        if (error?.message) {
          setErrorMessage(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router, session, status]);

  const statusItems = useMemo(
    () => dashboard?.statusBreakdown || [],
    [dashboard]
  );

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <main className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              AeroWarden Admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard de control
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Vista general para revisar qué está funcionando, qué crece y dónde
              conviene intervenir.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/landing"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir al panel
            </Link>
            <Link
              href="/hangars"
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
            >
              Ver hangares
            </Link>
          </div>
        </div>

        {errorMessage && (
          <p className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <div className={statCardClass}>
            <p className="text-sm text-slate-300">Cargando métricas del dashboard...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Usuarios",
                  value: dashboard?.stats?.usersCount || 0,
                  hint: "Cuentas registradas",
                },
                {
                  label: "Hangares",
                  value: dashboard?.stats?.hangarsCount || 0,
                  hint: "Espacios activos",
                },
                {
                  label: "Aeronaves",
                  value: dashboard?.stats?.aircraftCount || 0,
                  hint: "Flota registrada",
                },
                {
                  label: "Reportes",
                  value: dashboard?.stats?.reportsCount || 0,
                  hint: "Observaciones acumuladas",
                },
              ].map((item) => (
                <article key={item.label} className={statCardClass}>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                    {item.label}
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{item.hint}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className={statCardClass}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                      Salud operativa
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Estado de aeronaves
                    </h2>
                  </div>
                </div>

                {statusItems.length > 0 ? (
                  <div className="space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item._id || item.status}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {item._id || "Sin estado"}
                            </p>
                            <p className="text-xs text-slate-400">
                              Categoría de seguimiento
                            </p>
                          </div>
                          <p className="text-2xl font-semibold text-cyan-300">
                            {item.count}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">
                    Todavía no hay aeronaves para evaluar.
                  </p>
                )}
              </article>

              <article className={statCardClass}>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                  Lectura rápida
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Resumen del sistema
                </h2>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <p>
                    Puedes usar este panel para detectar crecimiento, carga de
                    reportes y cambios recientes sin entrar a cada hangar.
                  </p>
                  <p>
                    Última revisión del contenido: {formatDate(dashboard?.recentAircraft?.[0]?.updatedAt)}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  Si algo sube rápido en reportes o baja en actividad, este es el
                  primer lugar para detectarlo.
                </div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className={statCardClass}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                      Actividad reciente
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Hangares recientes
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {dashboard?.recentHangars?.length > 0 ? (
                    dashboard.recentHangars.map((hangar) => (
                      <div
                        key={hangar._id}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-medium text-white">
                              {hangar.name}
                            </p>
                            <p className="text-sm text-slate-300">
                              {hangar.location || "Sin ubicación"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Propietario: {hangar.owner?.name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {hangar.owner?.email || "Sin correo"}
                            </p>
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                            {formatDate(hangar.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">
                      No hay hangares recientes para mostrar.
                    </p>
                  )}
                </div>
              </article>

              <article className={statCardClass}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                      Seguimiento
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Aeronaves recientes
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {dashboard?.recentAircraft?.length > 0 ? (
                    dashboard.recentAircraft.map((aircraft) => (
                      <div
                        key={aircraft._id}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-medium text-white">
                              {aircraft.registration}
                            </p>
                            <p className="text-sm text-slate-300">
                              {aircraft.model}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Estado: {aircraft.status || "Sin estado"}
                            </p>
                            <p className="text-xs text-slate-400">
                              Hangar: {aircraft.hangar?.name || "Sin hangar"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                              Reportes
                            </p>
                            <p className="text-2xl font-semibold text-white">
                              {aircraft.reports?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">
                      No hay aeronaves recientes para mostrar.
                    </p>
                  )}
                </div>
              </article>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
