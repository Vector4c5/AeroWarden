import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
    filterByPendingTaskType,
    getPendingTaskType,
    PENDING_TASK_TYPE_FILTER_ALL,
    PENDING_TASK_TYPE_FILTER_OPTIONS,
    PENDING_TASK_TYPES,
} from "@/lib/pendingTaskTypes";

function formatDate(value) {
    if (!value) {
        return "Sin fecha";
    }

    return new Date(value).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateTime(value) {
    if (!value) {
        return "Sin fecha";
    }

    return new Date(value).toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function InfoItem({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function ActivityCard({
    title,
    description,
    meta,
    badge,
    badgeClass,
    taskType,
    commitNote,
    completedAt,
    completedByName,
    action,
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-950">
                    {title}
                </h3>
                {badge && (
                    <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
                    >
                        {badge}
                    </span>
                )}
            </div>
            {taskType && (
                <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {taskType}
                </span>
            )}
            {description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    {description}
                </p>
            )}
            {commitNote && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                        Cierre del trabajo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                        {commitNote}
                    </p>
                    <div className="mt-3 space-y-1 border-t border-emerald-200 pt-3 text-xs text-emerald-800">
                        {completedByName && (
                            <p>
                                Terminado por:{" "}
                                <span className="font-medium">
                                    {completedByName}
                                </span>
                            </p>
                        )}
                        {completedAt && (
                            <p>
                                Fecha de cierre:{" "}
                                <span className="font-medium">
                                    {formatDateTime(completedAt)}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            )}
            {meta && (
                <p className="mt-3 text-xs text-slate-500">{meta}</p>
            )}
            {action}
        </article>
    );
}

function EmptyBlock({ message }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            {message}
        </div>
    );
}

export default function AircraftDetailPage() {
    const router = useRouter();
    const { id: hangarId, aircraftId } = router.query;
    const { data: session } = useSession();

    const [aircraft, setAircraft] = useState(null);
    const [hangarName, setHangarName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isCompletingTask, setIsCompletingTask] = useState(false);
    const [completionForm, setCompletionForm] = useState({
        completedByName: "",
        completionNote: "",
    });
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isRegisteringExit, setIsRegisteringExit] = useState(false);
    const [exitForm, setExitForm] = useState({
        exitReportByName: "",
        exitNote: "",
    });
    const [pendingTypeFilter, setPendingTypeFilter] = useState(
        PENDING_TASK_TYPE_FILTER_ALL
    );
    const [isAddPendingModalOpen, setIsAddPendingModalOpen] =
        useState(false);
    const [isAddingPending, setIsAddingPending] = useState(false);
    const [pendingForm, setPendingForm] = useState({
        title: "",
        description: "",
        taskType: "Mantenimiento",
    });
    const [isAddObservationModalOpen, setIsAddObservationModalOpen] =
        useState(false);
    const [isAddingObservation, setIsAddingObservation] = useState(false);
    const [observationForm, setObservationForm] = useState({
        title: "",
        description: "",
    });

    const isDeparted = aircraft?.status === "Salida";

    const pendingTasks = useMemo(
        () =>
            aircraft?.maintenanceTasks?.filter(
                (task) => task.status === "pending"
            ) || [],
        [aircraft]
    );

    const filteredPendingTasks = useMemo(
        () =>
            filterByPendingTaskType(
                pendingTasks.map((task) => ({
                    ...task,
                    taskType: getPendingTaskType(task),
                })),
                pendingTypeFilter
            ),
        [pendingTasks, pendingTypeFilter]
    );

    const completedTasks = useMemo(
        () =>
            aircraft?.maintenanceTasks?.filter(
                (task) => task.status === "completed"
            ) || [],
        [aircraft]
    );

    useEffect(() => {
        if (!session || !hangarId || !aircraftId) {
            return;
        }

        const loadAircraft = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(
                    `/api/aircraft?hangarId=${hangarId}&aircraftId=${aircraftId}`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Error al cargar la aeronave"
                    );
                }

                setAircraft(data.aircraft);
                setHangarName(data.hangar?.name || "");
            } catch (error) {
                notifyError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadAircraft();
    }, [session, hangarId, aircraftId]);

    useEffect(() => {
        const isModalOpen =
            isCompleteModalOpen ||
            isExitModalOpen ||
            isAddPendingModalOpen ||
            isAddObservationModalOpen;

        if (!isModalOpen) {
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [
        isCompleteModalOpen,
        isExitModalOpen,
        isAddPendingModalOpen,
        isAddObservationModalOpen,
    ]);

    const openCompleteModal = (task) => {
        setSelectedTask(task);
        setCompletionForm({
            completedByName: session?.user?.name || "",
            completionNote: "",
        });
        setIsCompleteModalOpen(true);
    };

    const closeCompleteModal = () => {
        setIsCompleteModalOpen(false);
        setSelectedTask(null);
        setCompletionForm({
            completedByName: "",
            completionNote: "",
        });
    };

    const handleCompleteTask = async (e) => {
        e.preventDefault();
        setIsCompletingTask(true);

        try {
            const response = await fetch("/api/aircraft", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aircraftId,
                    taskId: selectedTask._id,
                    completedByName: completionForm.completedByName,
                    completionNote: completionForm.completionNote,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al completar el pendiente"
                );
            }

            setAircraft(data.aircraft);
            setHangarName(data.hangar?.name || hangarName);
            closeCompleteModal();
            notifySuccess("Pendiente marcado como terminado");
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsCompletingTask(false);
        }
    };

    const openExitModal = () => {
        setExitForm({
            exitReportByName: session?.user?.name || "",
            exitNote: "",
        });
        setIsExitModalOpen(true);
    };

    const closeExitModal = () => {
        setIsExitModalOpen(false);
        setExitForm({
            exitReportByName: "",
            exitNote: "",
        });
    };

    const closeAddPendingModal = () => {
        setIsAddPendingModalOpen(false);
        setPendingForm({
            title: "",
            description: "",
            taskType: "Mantenimiento",
        });
    };

    const closeAddObservationModal = () => {
        setIsAddObservationModalOpen(false);
        setObservationForm({
            title: "",
            description: "",
        });
    };

    const handleAddPending = async (e) => {
        e.preventDefault();
        setIsAddingPending(true);

        try {
            const response = await fetch("/api/aircraft", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aircraftId,
                    action: "add_pending_task",
                    title: pendingForm.title,
                    description: pendingForm.description,
                    taskType: pendingForm.taskType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al agregar el pendiente"
                );
            }

            setAircraft(data.aircraft);
            setHangarName(data.hangar?.name || hangarName);
            closeAddPendingModal();
            notifySuccess("Pendiente agregado correctamente");
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsAddingPending(false);
        }
    };

    const handleAddObservation = async (e) => {
        e.preventDefault();
        setIsAddingObservation(true);

        try {
            const response = await fetch("/api/aircraft", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aircraftId,
                    action: "add_stay_observation",
                    title: observationForm.title,
                    description: observationForm.description,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al agregar la observación"
                );
            }

            setAircraft(data.aircraft);
            setHangarName(data.hangar?.name || hangarName);
            closeAddObservationModal();
            notifySuccess("Observación registrada correctamente");
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsAddingObservation(false);
        }
    };

    const handleRegisterExit = async (e) => {
        e.preventDefault();
        setIsRegisteringExit(true);

        try {
            const response = await fetch("/api/aircraft", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aircraftId,
                    action: "register_exit",
                    exitReportByName: exitForm.exitReportByName,
                    exitNote: exitForm.exitNote,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al registrar la salida"
                );
            }

            setAircraft(data.aircraft);
            setHangarName(data.hangar?.name || hangarName);
            closeExitModal();
            notifySuccess("Salida de aeronave registrada correctamente");
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsRegisteringExit(false);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
            <Header />

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link
                        href="/hangars"
                        className="font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                        Hangares
                    </Link>
                    <span>/</span>
                    <Link
                        href={`/hangars/${hangarId}`}
                        className="font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                        {hangarName || "Hangar"}
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">
                        {aircraft?.registration || "Aeronave"}
                    </span>
                </div>

                {!session ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                        Inicia sesión para ver el historial de la aeronave.
                    </div>
                ) : isLoading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                        Cargando historial de la aeronave...
                    </div>
                ) : aircraft ? (
                    <div className="space-y-8">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                        Historial de aeronave
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                                        {aircraft.registration}
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {[aircraft.manufacturer, aircraft.model]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                            {aircraft.aircraftType}
                                        </span>
                                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                                            {aircraft.status || "En hangar"}
                                        </span>
                                        {pendingTasks.length > 0 && (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                                                {pendingTasks.length} pendiente
                                                {pendingTasks.length === 1
                                                    ? ""
                                                    : "s"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={`/hangars/${hangarId}`}
                                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                                    >
                                        Volver al hangar
                                    </Link>
                                    {!isDeparted && (
                                        <button
                                            type="button"
                                            onClick={openExitModal}
                                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                                        >
                                            Registrar salida
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <h2 className="text-xl font-semibold text-slate-950">
                                Datos del ingreso
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Información registrada al momento del ingreso al
                                hangar.
                            </p>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                <InfoItem
                                    label="Reporte realizado por"
                                    value={aircraft.intakeReportByName}
                                />
                                <InfoItem
                                    label="Matrícula"
                                    value={aircraft.registration}
                                />
                                <InfoItem
                                    label="Fabricante"
                                    value={aircraft.manufacturer}
                                />
                                <InfoItem
                                    label="Modelo"
                                    value={aircraft.model || "Sin modelo"}
                                />
                                <InfoItem
                                    label="Número de serie"
                                    value={aircraft.serialNumber}
                                />
                                <InfoItem
                                    label="Tipo de aeronave"
                                    value={aircraft.aircraftType}
                                />
                                <InfoItem
                                    label="Razón de estancia"
                                    value={aircraft.stayReason}
                                />
                                <InfoItem
                                    label="Fecha de ingreso"
                                    value={formatDate(aircraft.entryDate)}
                                />
                                <InfoItem
                                    label="Registrada el"
                                    value={formatDateTime(aircraft.createdAt)}
                                />
                            </div>
                        </section>

                        {isDeparted && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Datos de la salida
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Información registrada al momento de la
                                    salida del hangar.
                                </p>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <InfoItem
                                        label="Salida registrada por"
                                        value={
                                            aircraft.exitReportByName ||
                                            "Sin registro"
                                        }
                                    />
                                    <InfoItem
                                        label="Fecha de salida"
                                        value={formatDateTime(
                                            aircraft.exitDate
                                        )}
                                    />
                                    <InfoItem
                                        label="Estado actual"
                                        value={aircraft.status}
                                    />
                                </div>

                                {aircraft.exitNote && (
                                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                            Descripción de la salida
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">
                                            {aircraft.exitNote}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        <div className="grid gap-8 xl:grid-cols-2">
                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-950">
                                            Por realizar
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Trabajos y mantenimientos pendientes
                                            para esta aeronave.
                                        </p>
                                    </div>
                                    {!isDeparted && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsAddPendingModalOpen(true)
                                            }
                                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                                        >
                                            + Agregar pendiente
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <label
                                        htmlFor="aircraft-pending-type-filter"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Filtrar por tipo
                                    </label>
                                    <select
                                        id="aircraft-pending-type-filter"
                                        value={pendingTypeFilter}
                                        onChange={(e) =>
                                            setPendingTypeFilter(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
                                    >
                                        {PENDING_TASK_TYPE_FILTER_OPTIONS.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="mt-6 space-y-4">
                                    {pendingTasks.length > 0 ? (
                                        filteredPendingTasks.length > 0 ? (
                                        filteredPendingTasks.map((task) => (
                                            <ActivityCard
                                                key={task._id}
                                                title={task.title}
                                                description={task.description}
                                                taskType={getPendingTaskType(
                                                    task
                                                )}
                                                meta={`Programado el ${formatDateTime(task.createdAt)}`}
                                                badge="Pendiente"
                                                badgeClass="border border-amber-200 bg-amber-50 text-amber-800"
                                                action={
                                                    !isDeparted ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openCompleteModal(
                                                                    task
                                                                )
                                                            }
                                                            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                                                        >
                                                            Marcar como terminado
                                                        </button>
                                                    ) : null
                                                }
                                            />
                                        ))
                                        ) : (
                                            <EmptyBlock
                                                message={`No hay pendientes de tipo "${pendingTypeFilter}" para esta aeronave.`}
                                            />
                                        )
                                    ) : (
                                        <EmptyBlock message="No hay trabajos pendientes registrados para esta aeronave." />
                                    )}
                                </div>
                            </section>

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Realizado
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Trabajos completados y reportes generados.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {completedTasks.length > 0 ? (
                                        completedTasks.map((task) => (
                                            <ActivityCard
                                                key={task._id}
                                                title={task.title}
                                                description={task.description}
                                                taskType={getPendingTaskType(
                                                    task
                                                )}
                                                commitNote={task.completionNote}
                                                completedAt={task.completedAt}
                                                completedByName={
                                                    task.completedByName
                                                }
                                                meta={`Registrado en el historial el ${formatDateTime(task.updatedAt || task.createdAt)}`}
                                                badge="Completado"
                                                badgeClass="border border-emerald-200 bg-emerald-50 text-emerald-800"
                                            />
                                        ))
                                    ) : null}

                                    {aircraft.reports?.length > 0 ? (
                                        aircraft.reports.map((report) => (
                                            <ActivityCard
                                                key={report._id}
                                                title={report.title}
                                                description={report.notes}
                                                meta={`Reporte del ${formatDateTime(report.createdAt)}`}
                                                badge="Reporte"
                                                badgeClass="border border-cyan-200 bg-cyan-50 text-cyan-800"
                                            />
                                        ))
                                    ) : null}

                                    {completedTasks.length === 0 &&
                                        (!aircraft.reports ||
                                            aircraft.reports.length === 0) && (
                                            <EmptyBlock message="Aún no hay trabajos completados ni reportes registrados." />
                                        )}
                                </div>
                            </section>
                        </div>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <h2 className="text-xl font-semibold text-slate-950">
                                Estado de llegada
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Condiciones observadas al ingreso de la aeronave.
                            </p>

                            <div className="mt-6 space-y-4">
                                {aircraft.arrivalConditions?.length > 0 ? (
                                    aircraft.arrivalConditions.map(
                                        (condition) => (
                                            <ActivityCard
                                                key={condition._id}
                                                title={condition.title}
                                                description={
                                                    condition.description
                                                }
                                                meta={`Registrada el ${formatDateTime(condition.createdAt)}`}
                                                badge="Ingreso"
                                                badgeClass="border border-slate-200 bg-slate-100 text-slate-700"
                                            />
                                        )
                                    )
                                ) : (
                                    <EmptyBlock message="No se registraron condiciones de llegada para esta aeronave." />
                                )}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-950">
                                        Observaciones de estancia
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Notas y hallazgos registrados durante la
                                        permanencia de la aeronave en el hangar.
                                    </p>
                                </div>
                                {!isDeparted && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsAddObservationModalOpen(true)
                                        }
                                        className="inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
                                    >
                                        + Agregar observación
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 space-y-4">
                                {aircraft.stayObservations?.length > 0 ? (
                                    aircraft.stayObservations.map(
                                        (observation) => (
                                            <ActivityCard
                                                key={observation._id}
                                                title={observation.title}
                                                description={
                                                    observation.description
                                                }
                                                meta={`Registrada el ${formatDateTime(observation.createdAt)}`}
                                                badge="Estancia"
                                                badgeClass="border border-cyan-200 bg-cyan-50 text-cyan-800"
                                            />
                                        )
                                    )
                                ) : (
                                    <EmptyBlock message="Aún no hay observaciones registradas durante la estancia de esta aeronave." />
                                )}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                        No se pudo cargar la información de la aeronave.
                    </div>
                )}
            </main>

            {isExitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar registro de salida"
                        onClick={closeExitModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Registrar salida
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Documenta la salida de{" "}
                                    {aircraft?.registration} del hangar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeExitModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRegisterExit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Salida registrada por
                                </label>
                                <input
                                    type="text"
                                    value={exitForm.exitReportByName}
                                    onChange={(e) =>
                                        setExitForm((current) => ({
                                            ...current,
                                            exitReportByName: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-rose-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Descripción breve de la salida
                                </label>
                                <textarea
                                    placeholder="Ej. Aeronave entregada al cliente tras inspección final aprobada."
                                    value={exitForm.exitNote}
                                    onChange={(e) =>
                                        setExitForm((current) => ({
                                            ...current,
                                            exitNote: e.target.value,
                                        }))
                                    }
                                    className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-rose-400"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeExitModal}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRegisteringExit}
                                    className="flex-1 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500 disabled:opacity-70"
                                >
                                    {isRegisteringExit
                                        ? "Guardando..."
                                        : "Confirmar salida"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCompleteModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar confirmación de trabajo terminado"
                        onClick={closeCompleteModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Cerrar pendiente
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Registra el cierre del trabajo como si fuera
                                    un commit: quién lo terminó y qué se hizo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCompleteModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                                Pendiente
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-slate-950">
                                {selectedTask.title}
                            </h3>
                            {selectedTask.description && (
                                <p className="mt-2 text-sm text-slate-600">
                                    {selectedTask.description}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleCompleteTask} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Marcado como terminado por
                                </label>
                                <input
                                    type="text"
                                    value={completionForm.completedByName}
                                    onChange={(e) =>
                                        setCompletionForm((current) => ({
                                            ...current,
                                            completedByName: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-emerald-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Descripción breve del cierre
                                </label>
                                <textarea
                                    placeholder="Ej. Se reemplazó filtro de combustible y se verificó presión nominal."
                                    value={completionForm.completionNote}
                                    onChange={(e) =>
                                        setCompletionForm((current) => ({
                                            ...current,
                                            completionNote: e.target.value,
                                        }))
                                    }
                                    className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-emerald-400"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeCompleteModal}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCompletingTask}
                                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-70"
                                >
                                    {isCompletingTask
                                        ? "Guardando..."
                                        : "Confirmar cierre"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddPendingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar formulario de pendiente"
                        onClick={closeAddPendingModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Agregar pendiente
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Registra un nuevo trabajo pendiente para{" "}
                                    {aircraft?.registration}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAddPendingModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddPending} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tipo de pendiente
                                </label>
                                <select
                                    value={pendingForm.taskType}
                                    onChange={(e) =>
                                        setPendingForm((current) => ({
                                            ...current,
                                            taskType: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                >
                                    {PENDING_TASK_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={pendingForm.title}
                                    onChange={(e) =>
                                        setPendingForm((current) => ({
                                            ...current,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej. Revisión de tren de aterrizaje"
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Descripción
                                </label>
                                <textarea
                                    value={pendingForm.description}
                                    onChange={(e) =>
                                        setPendingForm((current) => ({
                                            ...current,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Detalle breve del trabajo a realizar."
                                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeAddPendingModal}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingPending}
                                    className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black transition hover:bg-amber-400 disabled:opacity-70"
                                >
                                    {isAddingPending
                                        ? "Guardando..."
                                        : "Agregar pendiente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddObservationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar formulario de observación"
                        onClick={closeAddObservationModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Agregar observación
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Registra un hallazgo o nota durante la
                                    estancia de {aircraft?.registration}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAddObservationModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleAddObservation}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={observationForm.title}
                                    onChange={(e) =>
                                        setObservationForm((current) => ({
                                            ...current,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej. Desgaste en cubierta de ala izquierda"
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Descripción
                                </label>
                                <textarea
                                    value={observationForm.description}
                                    onChange={(e) =>
                                        setObservationForm((current) => ({
                                            ...current,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Describe lo observado durante la estancia."
                                    className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeAddObservationModal}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingObservation}
                                    className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500 disabled:opacity-70"
                                >
                                    {isAddingObservation
                                        ? "Guardando..."
                                        : "Agregar observación"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
