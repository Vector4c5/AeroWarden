import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";
import { notifyError } from "@/lib/notifications";
import { buildAllPendientes } from "@/lib/pendientes";
import {
    filterByPendingTaskType,
    PENDING_TASK_TYPE_FILTER_ALL,
    PENDING_TASK_TYPE_FILTER_OPTIONS,
} from "@/lib/pendingTaskTypes";

function formatDate(value) {
    if (!value) {
        return "Sin fecha";
    }

    return new Date(value).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function PendingPage() {
    const { data: session } = useSession();

    const [hangars, setHangars] = useState([]);
    const [aircraftByHangar, setAircraftByHangar] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [pendingTypeFilter, setPendingTypeFilter] = useState(
        PENDING_TASK_TYPE_FILTER_ALL
    );

    const allPendientes = useMemo(
        () => buildAllPendientes(hangars, aircraftByHangar),
        [hangars, aircraftByHangar]
    );

    const filteredPendientes = useMemo(
        () =>
            filterByPendingTaskType(allPendientes, pendingTypeFilter),
        [allPendientes, pendingTypeFilter]
    );

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
                        hangarsData.error || "Error al cargar hangares"
                    );
                }

                setHangars(hangarsData);

                const aircraftEntries = await Promise.all(
                    hangarsData.map(async (hangar) => {
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
                notifyError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            <main className="mx-auto w-full max-w-4xl px-6 py-10">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link
                        href="/"
                        className="font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                        Inicio
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">
                        Pendientes
                    </span>
                </div>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-950">
                                Pendientes
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Todos los trabajos de mantenimiento pendientes
                                en tus hangares. Ordenados por tiempo de
                                estancia de la aeronave.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                            {filteredPendientes.length}
                            {pendingTypeFilter !==
                            PENDING_TASK_TYPE_FILTER_ALL
                                ? ` de ${allPendientes.length}`
                                : ""}{" "}
                            pendiente
                            {filteredPendientes.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="pending-type-filter"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Filtrar por tipo de pendiente
                        </label>
                        <select
                            id="pending-type-filter"
                            value={pendingTypeFilter}
                            onChange={(e) =>
                                setPendingTypeFilter(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 sm:max-w-xs"
                        >
                            {PENDING_TASK_TYPE_FILTER_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!session ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                            Inicia sesión para ver tus pendientes.
                        </div>
                    ) : isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                            Cargando pendientes...
                        </div>
                    ) : allPendientes.length > 0 ? (
                        filteredPendientes.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredPendientes.map((task) => (
                                <li key={task.taskId}>
                                    <Link
                                        href={`/hangars/${task.hangarId}/aircraft/${task.aircraftId}`}
                                        className="group flex w-full items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:shadow-md"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium text-slate-900 group-hover:text-amber-900">
                                                    {task.title}
                                                </p>
                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                    {task.taskType}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                                <span>
                                                    Matrícula:{" "}
                                                    <span className="font-medium text-slate-700">
                                                        {task.registration}
                                                    </span>
                                                </span>
                                                <span>
                                                    Hangar:{" "}
                                                    <span className="font-medium text-slate-700">
                                                        {task.hangarName}
                                                    </span>
                                                </span>
                                                <span>
                                                    Ingreso:{" "}
                                                    {formatDate(task.entryDate)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                            Ver aeronave
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                No hay pendientes de tipo{" "}
                                <span className="font-medium text-slate-700">
                                    {pendingTypeFilter}
                                </span>
                                .
                            </div>
                        )
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                            No tienes trabajos pendientes en tus hangares.
                            <Link
                                href="/hangars"
                                className="mt-4 block font-medium text-cyan-700 hover:text-cyan-800"
                            >
                                Ir a mis hangares
                            </Link>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
