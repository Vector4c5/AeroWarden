import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { PENDING_TASK_TYPES } from "@/lib/pendingTaskTypes";
import { buildDisplayName } from "@/lib/userProfile";

const HANGAR_CLASSIFICATIONS = [
    "Mantenimiento",
    "Aviación General",
    "Aviación Ejecutiva",
    "Comercial",
    "Militar/Gubernamental",
    "Multipropósito",
];

const AIRCRAFT_TYPES = [
    "Ala fija",
    "Ala rotativa",
    "Vehículo no tripulado",
    "Otro",
];

const STAY_REASONS = [
    "Mantenimiento",
    "Inspección",
    "Reparación",
    "Resguardo",
    "Modificación",
    "Pruebas",
    "Otro",
];

const ARRIVAL_TITLE_SUGGESTIONS = [
    "Nivel de combustible",
    "Horas de vuelo",
    "Daños del fuselaje",
    "Daños tapicería",
];

const emptyCondition = () => ({
    title: "",
    description: "",
});

const emptyMaintenanceTask = () => ({
    title: "",
    description: "",
    taskType: "Mantenimiento",
});

const getEmptyAircraftForm = () => ({
    registration: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    aircraftType: "Ala fija",
    stayReason: "Mantenimiento",
    customStayReason: "",
    entryDate: new Date().toISOString().split("T")[0],
    arrivalConditions: [],
    maintenanceEnabled: false,
    maintenanceTasks: [],
});

const emptyHangarForm = {
    name: "",
    location: "",
    baseAirport: "",
    description: "",
    classification: "Multipropósito",
};

const AIRCRAFT_VIEW_TABS = [
    { id: "all", label: "Todos" },
    { id: "in_hangar", label: "En hangar" },
    { id: "pending", label: "Con pendientes" },
    { id: "departed", label: "Salidas" },
];

function getPendingCount(aircraft) {
    return (
        aircraft.maintenanceTasks?.filter(
            (task) => task.status === "pending"
        ).length || 0
    );
}

function isInHangar(aircraft) {
    return aircraft.status !== "Salida";
}

function filterAircraftByTab(aircraftList, tabId) {
    if (tabId === "all") {
        return aircraftList;
    }

    if (tabId === "pending") {
        return aircraftList.filter(
            (aircraft) =>
                isInHangar(aircraft) && getPendingCount(aircraft) > 0
        );
    }

    if (tabId === "departed") {
        return aircraftList.filter((aircraft) => aircraft.status === "Salida");
    }

    return aircraftList.filter((aircraft) => isInHangar(aircraft));
}

function filterAircraftByRegistration(aircraftList, query) {
    const normalizedQuery = query.trim().toUpperCase();

    if (!normalizedQuery) {
        return aircraftList;
    }

    return aircraftList.filter((aircraft) =>
        aircraft.registration?.toUpperCase().includes(normalizedQuery)
    );
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

export default function HangarDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [hangar, setHangar] = useState(null);
    const [aircraftList, setAircraftList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAircraftModalOpen, setIsAircraftModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [savingAircraft, setSavingAircraft] = useState(false);
    const [savingHangar, setSavingHangar] = useState(false);
    const [deletingHangar, setDeletingHangar] = useState(false);
    const [aircraftForm, setAircraftForm] = useState(getEmptyAircraftForm());
    const [hangarForm, setHangarForm] = useState(emptyHangarForm);
    const [aircraftViewTab, setAircraftViewTab] = useState("all");
    const [aircraftSearchQuery, setAircraftSearchQuery] = useState("");
    const [selectedAircraftForExit, setSelectedAircraftForExit] =
        useState(null);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isRegisteringExit, setIsRegisteringExit] = useState(false);
    const [exitForm, setExitForm] = useState({
        exitReportByName: "",
        exitNote: "",
    });

    const isOwner = hangar?.isOwner === true;

    const hangarAircraft = useMemo(
        () => aircraftList,
        [aircraftList]
    );

    const tabFilteredAircraft = useMemo(
        () => filterAircraftByTab(hangarAircraft, aircraftViewTab),
        [hangarAircraft, aircraftViewTab]
    );

    const filteredAircraft = useMemo(
        () =>
            filterAircraftByRegistration(
                tabFilteredAircraft,
                aircraftSearchQuery
            ),
        [tabFilteredAircraft, aircraftSearchQuery]
    );

    const aircraftTabCounts = useMemo(
        () => ({
            all: hangarAircraft.length,
            in_hangar: filterAircraftByTab(hangarAircraft, "in_hangar").length,
            pending: filterAircraftByTab(hangarAircraft, "pending").length,
            departed: filterAircraftByTab(hangarAircraft, "departed").length,
        }),
        [hangarAircraft]
    );

    const intakeReporterName = useMemo(
        () =>
            buildDisplayName(
                session?.user?.firstNames,
                session?.user?.lastNames
            ) || session?.user?.name || "",
        [session]
    );

    const openAircraftModal = () => {
        setAircraftForm(getEmptyAircraftForm());
        setIsAircraftModalOpen(true);
    };

    const closeAircraftModal = () => {
        setIsAircraftModalOpen(false);
        setAircraftForm(getEmptyAircraftForm());
    };

    const addArrivalCondition = () => {
        setAircraftForm((current) => ({
            ...current,
            arrivalConditions: [
                ...current.arrivalConditions,
                emptyCondition(),
            ],
        }));
    };

    const updateArrivalCondition = (index, field, value) => {
        setAircraftForm((current) => ({
            ...current,
            arrivalConditions: current.arrivalConditions.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const removeArrivalCondition = (index) => {
        setAircraftForm((current) => ({
            ...current,
            arrivalConditions: current.arrivalConditions.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const addMaintenanceTask = () => {
        setAircraftForm((current) => ({
            ...current,
            maintenanceTasks: [
                ...current.maintenanceTasks,
                emptyMaintenanceTask(),
            ],
        }));
    };

    const updateMaintenanceTask = (index, field, value) => {
        setAircraftForm((current) => ({
            ...current,
            maintenanceTasks: current.maintenanceTasks.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const removeMaintenanceTask = (index) => {
        setAircraftForm((current) => ({
            ...current,
            maintenanceTasks: current.maintenanceTasks.filter(
                (_, i) => i !== index
            ),
        }));
    };

    useEffect(() => {
        if (!session || !id) {
            return;
        }

        const loadData = async () => {
            setIsLoading(true);

            try {
                const hangarsResponse = await fetch("/api/hangars");
                const hangarsData = await hangarsResponse.json();

                if (!hangarsResponse.ok) {
                    throw new Error(
                        hangarsData.error || "Error al cargar hangar"
                    );
                }

                const currentHangar = hangarsData.find(
                    (item) => item._id === id
                );

                if (!currentHangar) {
                    throw new Error("Hangar no encontrado o sin acceso");
                }

                setHangar(currentHangar);
                setHangarForm({
                    name: currentHangar.name || "",
                    location: currentHangar.location || "",
                    baseAirport: currentHangar.baseAirport || "",
                    description: currentHangar.description || "",
                    classification:
                        currentHangar.classification || "Multipropósito",
                });

                const aircraftResponse = await fetch(
                    `/api/aircraft?hangarId=${id}`
                );
                const aircraftData = await aircraftResponse.json();

                if (!aircraftResponse.ok) {
                    throw new Error(
                        aircraftData.error || "Error al cargar aeronaves"
                    );
                }

                setAircraftList(aircraftData);
            } catch (error) {
                notifyError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session, id]);

    useEffect(() => {
        const isModalOpen =
            isAircraftModalOpen ||
            isEditModalOpen ||
            isDeleteModalOpen ||
            isExitModalOpen;

        if (!isModalOpen) {
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [
        isAircraftModalOpen,
        isEditModalOpen,
        isDeleteModalOpen,
        isExitModalOpen,
    ]);

    const handleCreateAircraft = async (e) => {
        e.preventDefault();
        setSavingAircraft(true);

        const resolvedStayReason =
            aircraftForm.stayReason === "Otro"
                ? aircraftForm.customStayReason.trim()
                : aircraftForm.stayReason;

        if (!resolvedStayReason) {
            notifyError("Debes indicar la razón de estancia");
            setSavingAircraft(false);
            return;
        }

        if (!intakeReporterName) {
            notifyError(
                "Completa tu perfil con nombres y apellidos antes de registrar una aeronave"
            );
            setSavingAircraft(false);
            return;
        }

        try {
            const response = await fetch("/api/aircraft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    hangarId: id,
                    intakeReportByName: intakeReporterName,
                    registration: aircraftForm.registration,
                    manufacturer: aircraftForm.manufacturer,
                    model: aircraftForm.model,
                    serialNumber: aircraftForm.serialNumber,
                    aircraftType: aircraftForm.aircraftType,
                    stayReason: resolvedStayReason,
                    entryDate: aircraftForm.entryDate,
                    arrivalConditions: aircraftForm.arrivalConditions,
                    maintenanceTasks: aircraftForm.maintenanceEnabled
                        ? aircraftForm.maintenanceTasks
                        : [],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al registrar aeronave"
                );
            }

            setAircraftList((current) => [data, ...current]);
            closeAircraftModal();
            notifySuccess(
                `Aeronave ${data.registration} registrada correctamente`
            );
        } catch (error) {
            notifyError(error.message);
        } finally {
            setSavingAircraft(false);
        }
    };

    const openExitModal = (aircraft) => {
        setSelectedAircraftForExit(aircraft);
        setExitForm({
            exitReportByName: session?.user?.name || "",
            exitNote: "",
        });
        setIsExitModalOpen(true);
    };

    const closeExitModal = () => {
        setIsExitModalOpen(false);
        setSelectedAircraftForExit(null);
        setExitForm({
            exitReportByName: "",
            exitNote: "",
        });
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
                    aircraftId: selectedAircraftForExit._id,
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

            setAircraftList((current) =>
                current.map((item) =>
                    item._id === data.aircraft._id ? data.aircraft : item
                )
            );
            closeExitModal();
            notifySuccess(
                `Salida de ${data.aircraft.registration} registrada correctamente`
            );
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsRegisteringExit(false);
        }
    };

    const handleUpdateHangar = async (e) => {
        e.preventDefault();
        setSavingHangar(true);

        try {
            const response = await fetch(`/api/hangars?id=${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(hangarForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al actualizar hangar"
                );
            }

            setHangar(data);
            setIsEditModalOpen(false);
            notifySuccess(`Hangar "${data.name}" actualizado correctamente`);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setSavingHangar(false);
        }
    };

    const handleDeleteHangar = async () => {
        setDeletingHangar(true);

        try {
            const response = await fetch(`/api/hangars?id=${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al borrar hangar"
                );
            }

            notifySuccess("Hangar eliminado correctamente");
            router.push("/hangars");
        } catch (error) {
            notifyError(error.message);
            setIsDeleteModalOpen(false);
        } finally {
            setDeletingHangar(false);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
            <Header />

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                <div className="mb-6">
                    <Link
                        href="/hangars"
                        className="inline-flex items-center text-sm font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                        ← Volver a hangares
                    </Link>
                </div>

                {!session ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                        Inicia sesión para ver este hangar.
                    </div>
                ) : isLoading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                        Cargando hangar y aeronaves...
                    </div>
                ) : hangar ? (
                    <div className="space-y-8">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                        Hangar
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                                        {hangar.name}
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {hangar.location || "Sin ubicación"}
                                    </p>
                                    {hangar.baseAirport && (
                                        <p className="mt-1 text-sm text-slate-600">
                                            Aeropuerto base:{" "}
                                            <span className="font-mono font-semibold text-cyan-700">
                                                {hangar.baseAirport}
                                            </span>
                                        </p>
                                    )}
                                    {hangar.classification && (
                                        <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                                            {hangar.classification}
                                        </span>
                                    )}
                                    {hangar.description && (
                                        <p className="mt-3 max-w-2xl text-sm text-slate-500">
                                            {hangar.description}
                                        </p>
                                    )}
                                    <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                        {isOwner ? "Propietario" : "Miembro"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={openAircraftModal}
                                        className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
                                    >
                                        Registrar ingreso de aeronave
                                    </button>

                                    {isOwner && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsEditModalOpen(true)
                                                }
                                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                                            >
                                                Modificar hangar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsDeleteModalOpen(true)
                                                }
                                                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                                            >
                                                Borrar hangar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-950">
                                        Aeronaves del hangar
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Busca por matrícula y filtra aeronaves
                                        activas, con pendientes o que ya
                                        salieron de {hangar.name}.
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                                    {filteredAircraft.length}
                                    {aircraftSearchQuery.trim() ||
                                    aircraftViewTab !== "all"
                                        ? ` de ${tabFilteredAircraft.length}`
                                        : ""}{" "}
                                    aeronaves
                                </span>
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="aircraft-search"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Buscar por matrícula
                                </label>
                                <div className="relative">
                                    <input
                                        id="aircraft-search"
                                        type="search"
                                        value={aircraftSearchQuery}
                                        onChange={(e) =>
                                            setAircraftSearchQuery(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ej. XA-ABC"
                                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-slate-900 outline-none transition focus:border-cyan-400"
                                    />
                                    {aircraftSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAircraftSearchQuery("")
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                            aria-label="Limpiar búsqueda"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6 flex flex-wrap gap-2">
                                {AIRCRAFT_VIEW_TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            setAircraftViewTab(tab.id)
                                        }
                                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                                            aircraftViewTab === tab.id
                                                ? "bg-slate-900 text-white"
                                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {tab.label}
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${
                                                aircraftViewTab === tab.id
                                                    ? "bg-white/15 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {aircraftTabCounts[tab.id]}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {hangarAircraft.length > 0 ? (
                                filteredAircraft.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {filteredAircraft.map((aircraft) => {
                                            const pendingCount =
                                                getPendingCount(aircraft);
                                            const isDeparted =
                                                aircraft.status === "Salida";

                                            return (
                                                <article
                                                    key={aircraft._id}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                                            Aeronave
                                                        </p>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                isDeparted
                                                                    ? "border border-slate-300 bg-slate-200 text-slate-700"
                                                                    : "border border-cyan-200 bg-cyan-50 text-cyan-800"
                                                            }`}
                                                        >
                                                            {aircraft.status ||
                                                                "En hangar"}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                        {aircraft.registration}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        {[aircraft.manufacturer, aircraft.model]
                                                            .filter(Boolean)
                                                            .join(" · ") ||
                                                            "Sin modelo"}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Serie:{" "}
                                                        {aircraft.serialNumber}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Tipo:{" "}
                                                        {aircraft.aircraftType}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Estancia:{" "}
                                                        {aircraft.stayReason}
                                                    </p>
                                                    {aircraft.entryDate && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Ingreso:{" "}
                                                            {new Date(
                                                                aircraft.entryDate
                                                            ).toLocaleDateString(
                                                                "es-MX"
                                                            )}
                                                        </p>
                                                    )}
                                                    {isDeparted &&
                                                        aircraft.exitDate && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Salida:{" "}
                                                                {formatDateTime(
                                                                    aircraft.exitDate
                                                                )}
                                                            </p>
                                                        )}
                                                    {isDeparted &&
                                                        aircraft.exitReportByName && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Salida registrada
                                                                por:{" "}
                                                                {
                                                                    aircraft.exitReportByName
                                                                }
                                                            </p>
                                                        )}
                                                    <p className="mt-3 text-xs text-slate-500">
                                                        Reporte por:{" "}
                                                        {
                                                            aircraft.intakeReportByName
                                                        }
                                                    </p>
                                                    {pendingCount > 0 &&
                                                        !isDeparted && (
                                                            <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                                                {pendingCount}{" "}
                                                                pendiente
                                                                {pendingCount ===
                                                                1
                                                                    ? ""
                                                                    : "s"}
                                                            </p>
                                                        )}
                                                    {isDeparted &&
                                                        aircraft.exitNote && (
                                                            <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                                                                {aircraft.exitNote}
                                                            </p>
                                                        )}

                                                    <div className="mt-4 space-y-2">
                                                        <Link
                                                            href={`/hangars/${id}/aircraft/${aircraft._id}`}
                                                            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                                        >
                                                            Ver historial completo
                                                        </Link>
                                                        {!isDeparted && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openExitModal(
                                                                        aircraft
                                                                    )
                                                                }
                                                                className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                                                            >
                                                                Registrar salida
                                                            </button>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                        {aircraftSearchQuery.trim() &&
                                        tabFilteredAircraft.length > 0
                                            ? `No se encontró ninguna aeronave con la matrícula "${aircraftSearchQuery.trim().toUpperCase()}".`
                                            : aircraftViewTab === "pending"
                                              ? "No hay aeronaves con pendientes en este hangar."
                                              : aircraftViewTab === "departed"
                                                ? "Aún no hay aeronaves registradas como salida."
                                                : aircraftViewTab === "all"
                                                  ? "No hay aeronaves registradas en este hangar."
                                                  : "No hay aeronaves activas en este hangar."}
                                    </div>
                                )
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                    Aún no hay aeronaves registradas en este
                                    hangar.
                                    <button
                                        type="button"
                                        onClick={openAircraftModal}
                                        className="mt-4 block w-full rounded-full bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500"
                                    >
                                        Registrar primer ingreso
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                        No se pudo cargar el hangar solicitado.
                    </div>
                )}
            </main>

            {isAircraftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar formulario de aeronave"
                        onClick={closeAircraftModal}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Reporte de ingreso de aeronave
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Registra el ingreso y las condiciones de la
                                    aeronave en este hangar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAircraftModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateAircraft} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Nombre de quien realiza el reporte de ingreso
                                    </label>
                                    <input
                                        type="text"
                                        value={intakeReporterName}
                                        readOnly
                                        className="w-full rounded-lg border border-slate-200 bg-slate-100 p-3 text-slate-600"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Se toma de los nombres y apellidos de tu
                                        perfil.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Matrícula
                                    </label>
                                    <input
                                        type="text"
                                        value={aircraftForm.registration}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                registration: e.target.value
                                                    .toUpperCase(),
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 uppercase text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Fabricante
                                    </label>
                                    <input
                                        type="text"
                                        value={aircraftForm.manufacturer}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                manufacturer: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Modelo
                                    </label>
                                    <input
                                        type="text"
                                        value={aircraftForm.model}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                model: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Número de serie
                                    </label>
                                    <input
                                        type="text"
                                        value={aircraftForm.serialNumber}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                serialNumber: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tipo de aeronave
                                    </label>
                                    <select
                                        value={aircraftForm.aircraftType}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                aircraftType: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    >
                                        {AIRCRAFT_TYPES.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Razón de estancia
                                    </label>
                                    <select
                                        value={aircraftForm.stayReason}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                stayReason: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    >
                                        {STAY_REASONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {aircraftForm.stayReason === "Otro" && (
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Especifica la razón de estancia
                                        </label>
                                        <input
                                            type="text"
                                            value={aircraftForm.customStayReason}
                                            onChange={(e) =>
                                                setAircraftForm((current) => ({
                                                    ...current,
                                                    customStayReason: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Fecha de ingreso
                                    </label>
                                    <input
                                        type="date"
                                        value={aircraftForm.entryDate}
                                        onChange={(e) =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                entryDate: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Estado de llegada (opcional)
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Agrega condiciones observadas al ingreso.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addArrivalCondition}
                                        className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800 transition hover:bg-cyan-100"
                                    >
                                        + Agregar condición
                                    </button>
                                </div>

                                {aircraftForm.arrivalConditions.length > 0 ? (
                                    <div className="space-y-3">
                                        {aircraftForm.arrivalConditions.map(
                                            (condition, index) => (
                                                <div
                                                    key={`arrival-${index}`}
                                                    className="rounded-xl border border-slate-200 bg-white p-4"
                                                >
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                            Condición {index + 1}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeArrivalCondition(
                                                                    index
                                                                )
                                                            }
                                                            className="text-xs font-medium text-rose-600 hover:underline"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        list="arrival-title-suggestions"
                                                        placeholder="Título (ej. Nivel de combustible)"
                                                        value={condition.title}
                                                        onChange={(e) =>
                                                            updateArrivalCondition(
                                                                index,
                                                                "title",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mb-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                                    />
                                                    <textarea
                                                        placeholder="Descripción de la condición"
                                                        value={condition.description}
                                                        onChange={(e) =>
                                                            updateArrivalCondition(
                                                                index,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        Sin condiciones de llegada registradas.
                                    </p>
                                )}

                                <datalist id="arrival-title-suggestions">
                                    {ARRIVAL_TITLE_SUGGESTIONS.map((suggestion) => (
                                        <option
                                            key={suggestion}
                                            value={suggestion}
                                        />
                                    ))}
                                </datalist>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Mantenimiento / trabajos (opcional)
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Los trabajos agregados se guardan como
                                            pendientes del hangar.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAircraftForm((current) => ({
                                                ...current,
                                                maintenanceEnabled:
                                                    !current.maintenanceEnabled,
                                                maintenanceTasks:
                                                    !current.maintenanceEnabled &&
                                                    current.maintenanceTasks
                                                        .length === 0
                                                        ? [emptyMaintenanceTask()]
                                                        : current.maintenanceTasks,
                                            }))
                                        }
                                        className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                                            aircraftForm.maintenanceEnabled
                                                ? "bg-amber-500 text-black hover:bg-amber-400"
                                                : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                        }`}
                                    >
                                        {aircraftForm.maintenanceEnabled
                                            ? "Sección activa"
                                            : "Activar sección"}
                                    </button>
                                </div>

                                {aircraftForm.maintenanceEnabled && (
                                    <div className="mt-4 space-y-3">
                                        <button
                                            type="button"
                                            onClick={addMaintenanceTask}
                                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                                        >
                                            + Agregar trabajo pendiente
                                        </button>

                                        {aircraftForm.maintenanceTasks.map(
                                            (task, index) => (
                                                <div
                                                    key={`maintenance-${index}`}
                                                    className="rounded-xl border border-amber-200 bg-white p-4"
                                                >
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                                                            Pendiente {index + 1}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeMaintenanceTask(
                                                                    index
                                                                )
                                                            }
                                                            className="text-xs font-medium text-rose-600 hover:underline"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                                            Tipo de pendiente
                                                        </label>
                                                        <select
                                                            value={
                                                                task.taskType ||
                                                                "Mantenimiento"
                                                            }
                                                            onChange={(e) =>
                                                                updateMaintenanceTask(
                                                                    index,
                                                                    "taskType",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                                        >
                                                            {PENDING_TASK_TYPES.map(
                                                                (type) => (
                                                                    <option
                                                                        key={
                                                                            type
                                                                        }
                                                                        value={
                                                                            type
                                                                        }
                                                                    >
                                                                        {type}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Título del trabajo"
                                                        value={task.title}
                                                        onChange={(e) =>
                                                            updateMaintenanceTask(
                                                                index,
                                                                "title",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mb-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                                    />
                                                    <textarea
                                                        placeholder="Descripción del trabajo"
                                                        value={task.description}
                                                        onChange={(e) =>
                                                            updateMaintenanceTask(
                                                                index,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-amber-400"
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeAircraftModal}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAircraft}
                                    className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500 disabled:opacity-70"
                                >
                                    {savingAircraft
                                        ? "Guardando..."
                                        : "Registrar ingreso"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && isOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar formulario de editar hangar"
                        onClick={() => setIsEditModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-950">
                                    Modificar hangar
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Actualiza la información de tu hangar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateHangar} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Nombre del hangar
                                </label>
                                <input
                                    type="text"
                                    value={hangarForm.name}
                                    onChange={(e) =>
                                        setHangarForm((current) => ({
                                            ...current,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Ubicación
                                </label>
                                <input
                                    type="text"
                                    value={hangarForm.location}
                                    onChange={(e) =>
                                        setHangarForm((current) => ({
                                            ...current,
                                            location: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Aeropuerto base
                                </label>
                                <input
                                    type="text"
                                    value={hangarForm.baseAirport}
                                    onChange={(e) =>
                                        setHangarForm((current) => ({
                                            ...current,
                                            baseAirport: e.target.value
                                                .toUpperCase()
                                                .slice(0, 4),
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 uppercase text-slate-900 outline-none transition focus:border-cyan-400"
                                    maxLength={4}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Descripción
                                </label>
                                <textarea
                                    value={hangarForm.description}
                                    onChange={(e) =>
                                        setHangarForm((current) => ({
                                            ...current,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Clasificación
                                </label>
                                <select
                                    value={hangarForm.classification}
                                    onChange={(e) =>
                                        setHangarForm((current) => ({
                                            ...current,
                                            classification: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                >
                                    {HANGAR_CLASSIFICATIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingHangar}
                                    className="flex-1 rounded-lg bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:opacity-70"
                                >
                                    {savingHangar
                                        ? "Guardando..."
                                        : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && isOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar confirmación de borrado"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-slate-950">
                            ¿Estás seguro?
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Esta acción eliminará el hangar{" "}
                            <span className="font-semibold text-slate-900">
                                {hangar?.name}
                            </span>{" "}
                            de forma permanente. No se puede deshacer.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteHangar}
                                disabled={deletingHangar}
                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500 disabled:opacity-70"
                            >
                                {deletingHangar
                                    ? "Borrando..."
                                    : "Sí, borrar hangar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isExitModalOpen && selectedAircraftForExit && (
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
                                    Documenta la salida de la aeronave del
                                    hangar con quién la registró y una breve
                                    descripción.
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

                        <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                                Aeronave
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-slate-950">
                                {selectedAircraftForExit.registration}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {[selectedAircraftForExit.manufacturer, selectedAircraftForExit.model]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
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
        </div>
    );
}
