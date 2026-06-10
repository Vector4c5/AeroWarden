import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const emptyAircraftForm = {
    registration: "",
    model: "",
    status: "Activo",
};

const emptyReportForm = {
    title: "",
    notes: "",
};

export default function HangarsPage() {
 
    const { data: session } = useSession();
    const [hangars, setHangars] = useState([]);
    const [aircraftByHangar, setAircraftByHangar] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [openAircraftFormHangarId, setOpenAircraftFormHangarId] = useState(null);
    const [openReportAircraftId, setOpenReportAircraftId] = useState(null);
    const [savingAircraftHangarId, setSavingAircraftHangarId] = useState(null);
    const [savingReportAircraftId, setSavingReportAircraftId] = useState(null);
    const [aircraftForm, setAircraftForm] = useState(emptyAircraftForm);
    const [reportForm, setReportForm] = useState(emptyReportForm);

    useEffect(() => {

        if (!session) {
            return;
        }

        const loadData = async () => {

            setIsLoading(true);

            try {

                const hangarsResponse = await fetch("/api/hangars");
                const hangarsData = await hangarsResponse.json();

                if (!hangarsResponse.ok) {
                    throw new Error(
                        hangarsData.error ||
                        "Error al cargar hangares"
                    );
                }

                setHangars(hangarsData);

                const aircraftEntries = await Promise.all(
                    hangarsData.map(async (hangar) => {

                        const aircraftResponse = await fetch(
                            `/api/aircraft?hangarId=${hangar._id}`
                        );

                        const aircraftData = await aircraftResponse.json();

                        if (!aircraftResponse.ok) {
                            throw new Error(
                                aircraftData.error ||
                                "Error al cargar aeronaves"
                            );
                        }

                        return [hangar._id, aircraftData];
                    })
                );

                setAircraftByHangar(Object.fromEntries(aircraftEntries));

            } catch (error) {

                setMessage(error.message);

            } finally {
                setIsLoading(false);
            }
        };

        loadData();

    }, [session]);

    const handleCreateAircraft = async (hangarId, e) => {

        e.preventDefault();
        setSavingAircraftHangarId(hangarId);

        try {

            const response = await fetch("/api/aircraft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    hangarId,
                    registration: aircraftForm.registration,
                    model: aircraftForm.model,
                    status: aircraftForm.status,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Error al crear aeronave"
                );
            }

            setAircraftByHangar((current) => ({
                ...current,
                [hangarId]: [data, ...(current[hangarId] || [])],
            }));

            setAircraftForm(emptyAircraftForm);
            setOpenAircraftFormHangarId(null);
            setMessage(`Aeronave ${data.registration} creada correctamente`);

        } catch (error) {

            setMessage(error.message);

        } finally {
            setSavingAircraftHangarId(null);
        }
    };

    const handleCreateReport = async (hangarId, aircraftId, e) => {

        e.preventDefault();
        setSavingReportAircraftId(aircraftId);

        try {

            const response = await fetch("/api/aircraft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aircraftId,
                    title: reportForm.title,
                    notes: reportForm.notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Error al crear reporte"
                );
            }

            setAircraftByHangar((current) => ({
                ...current,
                [hangarId]: (current[hangarId] || []).map((aircraft) =>
                    aircraft._id === aircraftId ? data : aircraft
                ),
            }));

            setReportForm(emptyReportForm);
            setOpenReportAircraftId(null);
            setMessage("Reporte de aeronave creado correctamente");

        } catch (error) {

            setMessage(error.message);

        } finally {
            setSavingReportAircraftId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">

            <main className="mx-auto w-full max-w-6xl">

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                            AeroWarden
                        </p>

                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                            Hangares y aeronaves
                        </h1>

                        <p className="mt-3 text-sm text-slate-300">
                            Revisa el contenido de cada hangar y genera reportes por aeronave.
                        </p>

                    </div>

                    <Link
                        href="/landing"
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        Volver al panel
                    </Link>

                </div>

                {message && (

                    <p className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
                        {message}
                    </p>

                )}

                {!session ? (

                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                        Inicia sesión para ver los hangares y aeronaves.
                    </div>

                ) : isLoading ? (

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                        Cargando hangares y aeronaves...
                    </div>

                ) : hangars.length > 0 ? (

                    <div className="space-y-6">

                        {hangars.map((hangar) => {

                            const aircraftList = aircraftByHangar[hangar._id] || [];

                            return (

                                <section
                                    key={hangar._id}
                                    className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur"
                                >

                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                                        <div>

                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                                                Hangar
                                            </p>

                                            <h2 className="mt-2 text-2xl font-semibold text-white">
                                                {hangar.name}
                                            </h2>

                                            <p className="mt-2 text-sm text-slate-300">
                                                {hangar.location || "Sin ubicación"}
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpenReportAircraftId(null);
                                                setOpenAircraftFormHangarId(
                                                    openAircraftFormHangarId === hangar._id
                                                        ? null
                                                        : hangar._id
                                                );
                                            }}
                                            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400"
                                        >
                                            {openAircraftFormHangarId === hangar._id
                                                ? "Cerrar formulario"
                                                : "Agregar aeronave"}
                                        </button>

                                    </div>

                                    {openAircraftFormHangarId === hangar._id && (

                                        <form
                                            onSubmit={(e) => handleCreateAircraft(hangar._id, e)}
                                            className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-4"
                                        >

                                            <input
                                                type="text"
                                                placeholder="Matrícula"
                                                value={aircraftForm.registration}
                                                onChange={(e) =>
                                                    setAircraftForm((current) => ({
                                                        ...current,
                                                        registration: e.target.value,
                                                    }))
                                                }
                                                className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-cyan-400"
                                                required
                                            />

                                            <input
                                                type="text"
                                                placeholder="Modelo"
                                                value={aircraftForm.model}
                                                onChange={(e) =>
                                                    setAircraftForm((current) => ({
                                                        ...current,
                                                        model: e.target.value,
                                                    }))
                                                }
                                                className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-cyan-400"
                                                required
                                            />

                                            <input
                                                type="text"
                                                placeholder="Estado"
                                                value={aircraftForm.status}
                                                onChange={(e) =>
                                                    setAircraftForm((current) => ({
                                                        ...current,
                                                        status: e.target.value,
                                                    }))
                                                }
                                                className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-cyan-400"
                                            />

                                            <button
                                                type="submit"
                                                disabled={savingAircraftHangarId === hangar._id}
                                                className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {savingAircraftHangarId === hangar._id
                                                    ? "Guardando..."
                                                    : "Crear aeronave"}
                                            </button>

                                        </form>

                                    )}

                                    <div className="mt-6">

                                        <div className="mb-4 flex items-center justify-between gap-4">

                                            <h3 className="text-lg font-semibold text-white">
                                                Aeronaves del hangar
                                            </h3>

                                            <span className="text-sm text-slate-400">
                                                {aircraftList.length} aeronaves
                                            </span>

                                        </div>

                                        {aircraftList.length > 0 ? (

                                            <div className="grid gap-4 lg:grid-cols-2">

                                                {aircraftList.map((aircraft) => (

                                                    <article
                                                        key={aircraft._id}
                                                        className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"
                                                    >

                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                                            <div>

                                                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                                                                    Aeronave
                                                                </p>

                                                                <h4 className="mt-2 text-lg font-semibold text-white">
                                                                    {aircraft.registration}
                                                                </h4>

                                                                <p className="mt-1 text-sm text-slate-300">
                                                                    {aircraft.model}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    Estado: {aircraft.status}
                                                                </p>

                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenAircraftFormHangarId(null);
                                                                    setOpenReportAircraftId(
                                                                        openReportAircraftId === aircraft._id
                                                                            ? null
                                                                            : aircraft._id
                                                                    );
                                                                }}
                                                                className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                                                            >
                                                                {openReportAircraftId === aircraft._id
                                                                    ? "Cerrar reporte"
                                                                    : "Crear reporte"}
                                                            </button>

                                                        </div>

                                                        <p className="mt-4 text-sm text-slate-300">
                                                            Reportes guardados: {aircraft.reports?.length || 0}
                                                        </p>

                                                        {aircraft.reports?.[0] && (

                                                            <p className="mt-2 text-xs text-slate-400">
                                                                Último reporte: {aircraft.reports[0].title}
                                                            </p>

                                                        )}

                                                        {openReportAircraftId === aircraft._id && (

                                                            <form
                                                                onSubmit={(e) => handleCreateReport(hangar._id, aircraft._id, e)}
                                                                className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                                                            >

                                                                <input
                                                                    type="text"
                                                                    placeholder="Título del reporte"
                                                                    value={reportForm.title}
                                                                    onChange={(e) =>
                                                                        setReportForm((current) => ({
                                                                            ...current,
                                                                            title: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-emerald-400"
                                                                    required
                                                                />

                                                                <textarea
                                                                    placeholder="Notas del reporte"
                                                                    value={reportForm.notes}
                                                                    onChange={(e) =>
                                                                        setReportForm((current) => ({
                                                                            ...current,
                                                                            notes: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-emerald-400"
                                                                />

                                                                <button
                                                                    type="submit"
                                                                    disabled={savingReportAircraftId === aircraft._id}
                                                                    className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                                                                >
                                                                    {savingReportAircraftId === aircraft._id
                                                                        ? "Guardando..."
                                                                        : "Guardar reporte"}
                                                                </button>

                                                            </form>
                                                        )}
                                                    </article>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                                                Este hangar no tiene aeronaves todavía.
                                            </div>
                                        )}

                                    </div>

                                </section>
                            );
                        })}
                    </div>

                ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                        Aún no tienes hangares creados.
                    </div>
                )}
            </main>
        </div>
    );
}