import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";
import { formatInviteExpiry } from "@/lib/hangarInvite";
import { notifyError, notifySuccess } from "@/lib/notifications";

const HANGAR_CLASSIFICATIONS = [
    "Mantenimiento",
    "Aviación General",
    "Aviación Ejecutiva",
    "Comercial",
    "Militar/Gubernamental",
    "Multipropósito",
];

function getHangarPendientes(aircraftList = [], hangarId) {
    if (!hangarId) {
        return [];
    }

    return aircraftList
        .filter((aircraft) => aircraft.status !== "Salida")
        .map((aircraft) => {
            const firstPending = aircraft.maintenanceTasks?.find(
                (task) => task.status === "pending"
            );

            if (!firstPending) {
                return null;
            }

            return {
                taskId: firstPending._id,
                aircraftId: aircraft._id,
                hangarId,
                aircraftRegistration: aircraft.registration,
                title: firstPending.title,
                description: firstPending.description,
                taskType: firstPending.taskType || "Otro",
            };
        })
        .filter(Boolean);
}

const emptyHangarForm = {
    name: "",
    location: "",
    baseAirport: "",
    description: "",
    classification: "Multipropósito",
};

const OWNED_PANEL_TABS = [
    { id: "pending", label: "Pendientes" },
    { id: "members", label: "Miembros" },
];

const MEMBER_ROLE_LABELS = {
    admin: "Administrador",
    engineer: "Ingeniero",
    technician: "Técnico",
};

function formatMemberRole(role) {
    return MEMBER_ROLE_LABELS[role] || role || "Miembro";
}

function formatJoinedDate(value) {
    if (!value) {
        return "Sin fecha";
    }

    return new Date(value).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function HangarsPage() {
    const { data: session } = useSession();

    const [hangars, setHangars] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingHangar, setIsCreatingHangar] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [hangarForm, setHangarForm] = useState(emptyHangarForm);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [selectedOwnedHangarId, setSelectedOwnedHangarId] = useState(null);
    const [selectedMemberHangarId, setSelectedMemberHangarId] = useState(null);
    const [aircraftByHangar, setAircraftByHangar] = useState({});
    const [revealingInviteHangarId, setRevealingInviteHangarId] =
        useState(null);
    const [ownedPanelTab, setOwnedPanelTab] = useState("pending");
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [hangarToLeave, setHangarToLeave] = useState(null);
    const [isRemovingMember, setIsRemovingMember] = useState(false);
    const [isLeavingHangar, setIsLeavingHangar] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [memberActionsMenuOpen, setMemberActionsMenuOpen] = useState(false);
    const memberActionsMenuRef = useRef(null);

    const ownedHangars = useMemo(
        () => hangars.filter((hangar) => hangar.isOwner),
        [hangars]
    );

    const memberHangars = useMemo(
        () => hangars.filter((hangar) => !hangar.isOwner),
        [hangars]
    );

    const selectedOwnedHangar = ownedHangars.find(
        (hangar) => hangar._id === selectedOwnedHangarId
    );

    const selectedMemberHangar = memberHangars.find(
        (hangar) => hangar._id === selectedMemberHangarId
    );

    const ownedPendientes = useMemo(
        () =>
            getHangarPendientes(
                aircraftByHangar[selectedOwnedHangarId] || [],
                selectedOwnedHangarId
            ),
        [aircraftByHangar, selectedOwnedHangarId]
    );

    const memberPendientes = useMemo(
        () =>
            getHangarPendientes(
                aircraftByHangar[selectedMemberHangarId] || [],
                selectedMemberHangarId
            ),
        [aircraftByHangar, selectedMemberHangarId]
    );

    useEffect(() => {
        if (!session) {
            return;
        }

        const hangarIds = [
            selectedOwnedHangarId,
            selectedMemberHangarId,
        ].filter(Boolean);

        if (hangarIds.length === 0) {
            return;
        }

        const loadAircraftForHangars = async () => {
            const entries = await Promise.all(
                hangarIds.map(async (hangarId) => {
                    try {
                        const response = await fetch(
                            `/api/aircraft?hangarId=${hangarId}`
                        );
                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.error || "Error al cargar aeronaves"
                            );
                        }

                        return [hangarId, data];
                    } catch {
                        return [hangarId, []];
                    }
                })
            );

            setAircraftByHangar((current) => ({
                ...current,
                ...Object.fromEntries(entries),
            }));
        };

        loadAircraftForHangars();
    }, [session, selectedOwnedHangarId, selectedMemberHangarId]);

    const loadHangars = async ({ showLoading = true } = {}) => {
        if (!session) {
            return;
        }

        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const response = await fetch("/api/hangars");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al cargar hangares");
            }

            setHangars(data);
        } catch (error) {
            notifyError(error.message);
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadHangars();
    }, [session]);

    useEffect(() => {
        const visibleHangars = hangars.filter(
            (hangar) =>
                hangar.isOwner &&
                hangar.inviteCodeVisible &&
                hangar.inviteCodeExpiresAt
        );

        if (visibleHangars.length === 0) {
            return;
        }

        const nextExpiry = Math.min(
            ...visibleHangars.map((hangar) =>
                new Date(hangar.inviteCodeExpiresAt).getTime()
            )
        );
        const delay = nextExpiry - Date.now();

        if (delay <= 0) {
            loadHangars({ showLoading: false });
            return;
        }

        const timer = setTimeout(() => {
            loadHangars({ showLoading: false });
            notifySuccess(
                "El código de invitación expiró y se generó uno nuevo"
            );
        }, delay);

        return () => clearTimeout(timer);
    }, [hangars, session]);

    const handleRevealInviteCode = async (hangarId) => {
        setRevealingInviteHangarId(hangarId);

        try {
            const response = await fetch(`/api/hangars?id=${hangarId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "reveal_invite_code",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al mostrar el código de invitación"
                );
            }

            const { message, ...updatedHangar } = data;

            setHangars((current) =>
                current.map((hangar) =>
                    hangar._id?.toString() === hangarId.toString()
                        ? updatedHangar
                        : hangar
                )
            );

            if (!updatedHangar.inviteCodeVisible) {
                throw new Error(
                    message ||
                        "No se pudo mostrar el código de invitación"
                );
            }

            notifySuccess(
                message ||
                    "Código visible por 24 horas. Luego se renovará automáticamente."
            );
        } catch (error) {
            notifyError(error.message);
        } finally {
            setRevealingInviteHangarId(null);
        }
    };

    useEffect(() => {
        if (ownedHangars.length === 0) {
            setSelectedOwnedHangarId(null);
            return;
        }

        const stillExists = ownedHangars.some(
            (hangar) => hangar._id === selectedOwnedHangarId
        );

        if (!stillExists) {
            setSelectedOwnedHangarId(ownedHangars[0]._id);
        }
    }, [ownedHangars, selectedOwnedHangarId]);

    useEffect(() => {
        if (memberHangars.length === 0) {
            setSelectedMemberHangarId(null);
            return;
        }

        const stillExists = memberHangars.some(
            (hangar) => hangar._id === selectedMemberHangarId
        );

        if (!stillExists) {
            setSelectedMemberHangarId(memberHangars[0]._id);
        }
    }, [memberHangars, selectedMemberHangarId]);

    useEffect(() => {
        if (!isFormOpen && !isJoinOpen && !memberToRemove && !hangarToLeave) {
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isFormOpen, isJoinOpen, memberToRemove, hangarToLeave]);

    useEffect(() => {
        if (isFormOpen || isJoinOpen) {
            setIsFabMenuOpen(false);
        }
    }, [isFormOpen, isJoinOpen]);

    useEffect(() => {
        setMemberActionsMenuOpen(false);
    }, [selectedMemberHangarId]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                memberActionsMenuRef.current &&
                !memberActionsMenuRef.current.contains(event.target)
            ) {
                setMemberActionsMenuOpen(false);
            }
        }

        if (!memberActionsMenuOpen) {
            return undefined;
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [memberActionsMenuOpen]);

    const handleCreateHangar = async (e) => {
        e.preventDefault();
        setIsCreatingHangar(true);

        try {
            const response = await fetch("/api/hangars", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(hangarForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al crear hangar"
                );
            }

            notifySuccess(`Hangar "${data.name}" creado correctamente`);
            setHangars((currentHangars) => [data, ...currentHangars]);
            setHangarForm(emptyHangarForm);
            setIsFormOpen(false);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsCreatingHangar(false);
        }
    };

    const handleJoinHangar = async (e) => {
        e.preventDefault();
        setIsJoining(true);

        try {
            const response = await fetch("/api/hangars/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inviteCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Error al unirse al hangar"
                );
            }

            setHangars((current) => [...current, data]);
            notifySuccess(`Te has unido a "${data.name}"`);
            setInviteCode("");
            setIsJoinOpen(false);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsJoining(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) {
            return;
        }

        setIsRemovingMember(true);

        try {
            const response = await fetch(
                `/api/hangars?id=${memberToRemove.hangarId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "remove_member",
                        memberUserId: memberToRemove.member.userId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "No se pudo expulsar al miembro"
                );
            }

            const { message, ...updatedHangar } = data;

            setHangars((current) =>
                current.map((hangar) =>
                    hangar._id?.toString() ===
                    memberToRemove.hangarId.toString()
                        ? updatedHangar
                        : hangar
                )
            );

            notifySuccess(
                message || "Miembro expulsado correctamente"
            );
            setMemberToRemove(null);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsRemovingMember(false);
        }
    };

    const handleLeaveHangar = async () => {
        if (!hangarToLeave) {
            return;
        }

        setIsLeavingHangar(true);

        try {
            const response = await fetch(
                `/api/hangars?id=${hangarToLeave._id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "leave_hangar",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "No se pudo salir del hangar"
                );
            }

            setHangars((current) =>
                current.filter(
                    (hangar) =>
                        hangar._id?.toString() !==
                        hangarToLeave._id.toString()
                )
            );

            notifySuccess(
                data.message || "Has salido del hangar correctamente"
            );
            setHangarToLeave(null);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsLeavingHangar(false);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
            <Header />

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                <div className="mb-6 sm:mb-8">
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-3 sm:text-3xl">
                        Mis hangares
                    </h1>

                    <p className="mt-3 text-lg text-slate-600">
                        Crea hangares, únete a equipos y consulta pendientes
                        de las aeronaves.
                    </p>
                </div>

                {!session ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                        Inicia sesión para ver y gestionar tus hangares.
                    </div>
                ) : (
                    <div className="space-y-8">

                        {isFormOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <button
                                    type="button"
                                    aria-label="Cerrar formulario de crear hangar"
                                    onClick={() => setIsFormOpen(false)}
                                    className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                                />

                                <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-950">
                                                Crear hangar
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Completa los datos para registrar un nuevo hangar.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                            aria-label="Cerrar"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <form
                                        onSubmit={handleCreateHangar}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Nombre del hangar
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Hangar Norte"
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
                                                placeholder="Ciudad, estado o dirección"
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
                                                placeholder="Ej. MMMX"
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
                                                pattern="[A-Za-z]{4}"
                                                title="Código ICAO de 4 letras"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Descripción
                                            </label>
                                            <textarea
                                                placeholder="Describe las características o servicios del hangar"
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
                                                Clasificación de hangar
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
                                                onClick={() => setIsFormOpen(false)}
                                                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isCreatingHangar}
                                                className="flex-1 rounded-lg bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {isCreatingHangar
                                                    ? "Creando..."
                                                    : "Crear hangar"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {isJoinOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <button
                                    type="button"
                                    aria-label="Cerrar formulario de unirse a hangar"
                                    onClick={() => setIsJoinOpen(false)}
                                    className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                                />

                                <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-950">
                                                Unirse a un hangar
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Ingresa el código de invitación que te compartió el propietario.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsJoinOpen(false)}
                                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                            aria-label="Cerrar"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <form
                                        onSubmit={handleJoinHangar}
                                        className="space-y-4"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Código de invitación"
                                            value={inviteCode}
                                            onChange={(e) =>
                                                setInviteCode(
                                                    e.target.value.toUpperCase()
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-emerald-400"
                                            required
                                        />

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsJoinOpen(false)}
                                                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isJoining}
                                                className="flex-1 rounded-lg bg-black px-4 py-2 font-medium text-white
                                                 transition hover:bg-slate-800 disabled:opacity-70"
                                            >
                                                {isJoining ? "Uniéndose..." : "Unirse"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                Cargando hangares...
                            </div>
                        ) : (
                            <>
                                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-semibold text-slate-950">
                                            Hangares de los que soy propietario
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Selecciona uno de tus hangares para ver
                                            sus pendientes y acceder a sus aeronaves.
                                        </p>
                                    </div>

                                    {ownedHangars.length > 0 ? (
                                        <div className="grid gap-6 lg:grid-cols-2">
                                            <div className="space-y-3">
                                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                                    Hangares
                                                </p>

                                                {ownedHangars.map((hangar) => (
                                                    <div
                                                        key={hangar._id}
                                                        className={`w-full rounded-2xl border p-4 text-left transition ${
                                                            selectedOwnedHangarId === hangar._id
                                                                ? "border-cyan-400 bg-cyan-50 shadow-md shadow-cyan-100"
                                                                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedOwnedHangarId(
                                                                    hangar._id
                                                                )
                                                            }
                                                            className="w-full text-left"
                                                        >
                                                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                                                Hangar
                                                            </p>
                                                            <div className="mt-2 flex items-start justify-between gap-3">
                                                                <h3 className="min-w-0 text-lg font-semibold text-slate-950">
                                                                    {hangar.name}
                                                                </h3>
                                                                {hangar.classification && (
                                                                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                                                                        {hangar.classification}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {hangar.location ||
                                                                    "Sin ubicación"}
                                                            </p>
                                                            {hangar.baseAirport && (
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Aeropuerto:{" "}
                                                                    <span className="font-mono font-semibold text-cyan-700">
                                                                        {hangar.baseAirport}
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </button>

                                                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                                                            <p className="text-xs text-slate-500">
                                                                Código de invitación
                                                            </p>

                                                            {hangar.inviteCodeVisible &&
                                                            hangar.inviteCode ? (
                                                                <>
                                                                    <div className="mt-2 flex items-center justify-between gap-3">
                                                                        <code className="font-mono text-sm font-bold text-slate-900">
                                                                            {
                                                                                hangar.inviteCode
                                                                            }
                                                                        </code>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(
                                                                                    hangar.inviteCode
                                                                                );
                                                                                notifySuccess(
                                                                                    "Código copiado al portapapeles"
                                                                                );
                                                                            }}
                                                                            className="text-sm font-medium text-cyan-700 hover:underline"
                                                                        >
                                                                            Copiar
                                                                        </button>
                                                                    </div>
                                                                    <p className="mt-2 text-xs text-slate-500">
                                                                        Visible hasta{" "}
                                                                        {formatInviteExpiry(
                                                                            hangar.inviteCodeExpiresAt
                                                                        )}
                                                                        . Después se
                                                                        generará uno
                                                                        nuevo.
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p className="mt-2 text-xs text-slate-500">
                                                                        Oculto por
                                                                        seguridad.
                                                                        Al mostrarlo
                                                                        estará
                                                                        disponible
                                                                        por 24
                                                                        horas.
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleRevealInviteCode(
                                                                                hangar._id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            revealingInviteHangarId ===
                                                                            hangar._id
                                                                        }
                                                                        className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-70"
                                                                    >
                                                                        {revealingInviteHangarId ===
                                                                        hangar._id
                                                                            ? "Mostrando..."
                                                                            : "Mostrar código"}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>

                                            <div>
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    {OWNED_PANEL_TABS.map((tab) => (
                                                        <button
                                                            key={tab.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setOwnedPanelTab(
                                                                    tab.id
                                                                )
                                                            }
                                                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                                                ownedPanelTab ===
                                                                tab.id
                                                                    ? "bg-cyan-600 text-white"
                                                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {selectedOwnedHangar ? (
                                                    <div className="flex min-h-80 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                        <div className="mb-4 flex items-start justify-between gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                {ownedPanelTab ===
                                                                "pending" ? (
                                                                    <>
                                                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                                                            Pendientes
                                                                        </p>
                                                                        <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                                            {
                                                                                selectedOwnedHangar.name
                                                                            }
                                                                        </h3>
                                                                        <p className="mt-1 text-sm text-slate-500">
                                                                            Actividades que requieren
                                                                            atención en este hangar.
                                                                        </p>
                                                                        <span className="mt-3 inline-flex rounded-full border border-cyan-200 bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
                                                                            {ownedPendientes.length}{" "}
                                                                            pendiente
                                                                            {ownedPendientes.length === 1
                                                                                ? ""
                                                                                : "s"}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                                                            Miembros
                                                                        </p>
                                                                        <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                                            {
                                                                                selectedOwnedHangar.name
                                                                            }
                                                                        </h3>
                                                                        <p className="mt-1 text-sm text-slate-500">
                                                                            Usuarios que forman parte de
                                                                            este hangar.
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <Link
                                                                href={`/hangars/${selectedOwnedHangar._id}`}
                                                                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 hover:text-cyan-800"
                                                            >
                                                                Ir
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

                                                        {ownedPanelTab ===
                                                        "pending" ? (
                                                            <div className="flex-1 space-y-3">
                                                                    {ownedPendientes.length > 0 ? (
                                                                        ownedPendientes.map(
                                                                            (task) => (
                                                                                <Link
                                                                                    key={task.taskId}
                                                                                    href={`/hangars/${task.hangarId}/aircraft/${task.aircraftId}`}
                                                                                    className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:shadow-sm"
                                                                                >
                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                        <div>
                                                                                            <p className="font-medium text-slate-800 group-hover:text-amber-900">
                                                                                                {task.title}
                                                                                            </p>
                                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                                {task.taskType}
                                                                                                {" · "}
                                                                                                {task.aircraftRegistration}
                                                                                                {task.description
                                                                                                    ? ` · ${task.description}`
                                                                                                    : ""}
                                                                                            </p>
                                                                                        </div>
                                                                                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                                                            Ver aeronave
                                                                                        </span>
                                                                                    </div>
                                                                                </Link>
                                                                            )
                                                                        )
                                                                    ) : (
                                                                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                                            No hay trabajos de
                                                                            mantenimiento pendientes
                                                                            en este hangar.
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 space-y-3">
                                                                {selectedOwnedHangar.members
                                                                    ?.length > 0 ? (
                                                                    selectedOwnedHangar.members.map(
                                                                        (member) => (
                                                                            <div
                                                                                key={
                                                                                    member.userId
                                                                                }
                                                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                                                                            >
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate font-medium text-slate-900">
                                                                                        {
                                                                                            member.displayLabel
                                                                                        }
                                                                                    </p>
                                                                                    {member.name &&
                                                                                        member.displayLabel !==
                                                                                            member.name && (
                                                                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                                                                {
                                                                                                    member.name
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        {formatMemberRole(
                                                                                            member.role
                                                                                        )}
                                                                                        {" · "}
                                                                                        Se unió el{" "}
                                                                                        {formatJoinedDate(
                                                                                            member.joinedAt
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setMemberToRemove(
                                                                                            {
                                                                                                hangarId:
                                                                                                    selectedOwnedHangar._id,
                                                                                                hangarName:
                                                                                                    selectedOwnedHangar.name,
                                                                                                member,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                    className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                                                                                >
                                                                                    Expulsar
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    )
                                                                ) : (
                                                                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                                        Este hangar aún no tiene
                                                                        miembros. Comparte el código
                                                                        de invitación para que se
                                                                        unan.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 p-8 text-center text-sm text-cyan-800">
                                                        Selecciona un hangar para ver su
                                                        información.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                                            Aún no tienes hangares registrados como
                                            propietario.
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-semibold text-slate-950">
                                            Hangares donde soy miembro
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Hangares a los que te has unido. Selecciona
                                            uno para consultar pendientes y entrar al
                                            detalle.
                                        </p>
                                    </div>

                                    {memberHangars.length > 0 ? (
                                        <div className="grid gap-6 lg:grid-cols-2">
                                            <div className="space-y-3">
                                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                                    Hangares
                                                </p>

                                                {memberHangars.map((hangar) => (
                                                    <button
                                                        key={hangar._id}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMemberHangarId(
                                                                hangar._id
                                                            )
                                                        }
                                                        className={`w-full rounded-2xl border p-4 text-left transition ${
                                                            selectedMemberHangarId ===
                                                            hangar._id
                                                                ? "border-amber-400 bg-amber-50 shadow-md shadow-amber-100"
                                                                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                                        }`}
                                                    >
                                                        <p className="text-xs uppercase tracking-[0.24em] text-amber-700/80">
                                                            Hangar
                                                        </p>
                                                        <div className="mt-2 flex items-start justify-between gap-3">
                                                            <h3 className="min-w-0 text-lg font-semibold text-slate-950">
                                                                {hangar.name}
                                                            </h3>
                                                            {hangar.classification && (
                                                                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                                                                    {hangar.classification}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {hangar.location ||
                                                                "Sin ubicación"}
                                                        </p>
                                                        {hangar.baseAirport && (
                                                            <p className="mt-2 text-xs text-slate-500">
                                                                Aeropuerto:{" "}
                                                                <span className="font-mono font-semibold text-amber-700">
                                                                    {hangar.baseAirport}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div>
                                                <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                                                    Panel de pendientes
                                                </p>

                                                {selectedMemberHangar ? (
                                                    <div className="flex min-h-80 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                        <div className="mb-4 flex items-start justify-between gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                                                    Pendientes
                                                                </p>
                                                                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                                    {selectedMemberHangar.name}
                                                                </h3>
                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    Actividades que requieren
                                                                    atención en este hangar.
                                                                </p>
                                                                <span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                                                    {memberPendientes.length}{" "}
                                                                    pendiente
                                                                    {memberPendientes.length === 1
                                                                        ? ""
                                                                        : "s"}
                                                                </span>
                                                            </div>

                                                            <div
                                                                className="relative shrink-0"
                                                                ref={memberActionsMenuRef}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setMemberActionsMenuOpen(
                                                                            (open) => !open
                                                                        )
                                                                    }
                                                                    aria-label="Opciones del hangar"
                                                                    aria-expanded={
                                                                        memberActionsMenuOpen
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                                                >
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
                                                                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                                                        />
                                                                    </svg>
                                                                </button>

                                                                {memberActionsMenuOpen && (
                                                                    <div className="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                                                        <Link
                                                                            href={`/hangars/${selectedMemberHangar._id}`}
                                                                            onClick={() =>
                                                                                setMemberActionsMenuOpen(
                                                                                    false
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                                                                        >
                                                                            Ir al hangar
                                                                            <svg
                                                                                className="h-4 w-4 text-amber-700"
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
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMemberActionsMenuOpen(
                                                                                    false
                                                                                );
                                                                                setHangarToLeave(
                                                                                    selectedMemberHangar
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                                                        >
                                                                            Salir del hangar
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 space-y-3">
                                                            {memberPendientes.length > 0 ? (
                                                                memberPendientes.map(
                                                                    (task) => (
                                                                        <Link
                                                                            key={task.taskId}
                                                                            href={`/hangars/${task.hangarId}/aircraft/${task.aircraftId}`}
                                                                            className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:shadow-sm"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="font-medium text-slate-800 group-hover:text-amber-900">
                                                                                        {task.title}
                                                                                    </p>
                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        {task.taskType}
                                                                                        {" · "}
                                                                                        {task.aircraftRegistration}
                                                                                        {task.description
                                                                                            ? ` · ${task.description}`
                                                                                            : ""}
                                                                                    </p>
                                                                                </div>
                                                                                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                                                    Ver aeronave
                                                                                </span>
                                                                            </div>
                                                                        </Link>
                                                                    )
                                                                )
                                                            ) : (
                                                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                                    No hay trabajos de
                                                                    mantenimiento pendientes
                                                                    en este hangar.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800">
                                                        Selecciona un hangar para ver sus
                                                        pendientes.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                                            No formas parte de ningún hangar como miembro.
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                )}
            </main>

            {memberToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar confirmación de expulsión"
                        onClick={() => setMemberToRemove(null)}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-slate-950">
                            ¿Estás seguro?
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Vas a expulsar a{" "}
                            <span className="font-semibold text-slate-900">
                                {memberToRemove.member.displayLabel}
                            </span>{" "}
                            del hangar{" "}
                            <span className="font-semibold text-slate-900">
                                {memberToRemove.hangarName}
                            </span>
                            . Esta acción no se puede deshacer.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMemberToRemove(null)}
                                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveMember}
                                disabled={isRemovingMember}
                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500 disabled:opacity-70"
                            >
                                {isRemovingMember
                                    ? "Expulsando..."
                                    : "Sí, expulsar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {hangarToLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Cerrar confirmación de salida"
                        onClick={() => setHangarToLeave(null)}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                    />

                    <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-slate-950">
                            ¿Estás seguro?
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Vas a salir del hangar{" "}
                            <span className="font-semibold text-slate-900">
                                {hangarToLeave.name}
                            </span>
                            . Ya no podrás acceder a sus aeronaves hasta que te
                            inviten de nuevo.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setHangarToLeave(null)}
                                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleLeaveHangar}
                                disabled={isLeavingHangar}
                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500 disabled:opacity-70"
                            >
                                {isLeavingHangar
                                    ? "Saliendo..."
                                    : "Sí, salir del hangar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {session && (
                <>
                    {isFabMenuOpen && (
                        <button
                            type="button"
                            aria-label="Cerrar menú de acciones"
                            onClick={() => setIsFabMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-950/10"
                        />
                    )}

                    <div className="fixed bottom-8 right-5 z-50 sm:bottom-10 sm:right-8">
                        <div className="relative h-20 w-20">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFabMenuOpen(false);
                                    setIsJoinOpen(false);
                                    setIsFormOpen(true);
                                }}
                                className={`absolute bottom-[5.75rem] right-0 whitespace-nowrap rounded-full border border-cyan-200 bg-white px-5 py-3 text-base font-semibold text-cyan-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 ${
                                    isFabMenuOpen
                                        ? "pointer-events-auto scale-100 opacity-100"
                                        : "pointer-events-none scale-75 opacity-0"
                                }`}
                            >
                                Crear hangar
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsFabMenuOpen(false);
                                    setIsFormOpen(false);
                                    setIsJoinOpen(true);
                                }}
                                className={`absolute bottom-5 right-[7.25rem] whitespace-nowrap rounded-full border border-emerald-200 bg-white px-5 py-3 text-base font-semibold text-emerald-900 shadow-xl transition-all duration-300 hover:bg-emerald-50 ${
                                    isFabMenuOpen
                                        ? "pointer-events-auto scale-100 opacity-100"
                                        : "pointer-events-none scale-75 opacity-0"
                                }`}
                            >
                                Unirse a hangar
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsFabMenuOpen((open) => !open)}
                                aria-label={
                                    isFabMenuOpen
                                        ? "Cerrar menú de hangares"
                                        : "Abrir menú de hangares"
                                }
                                aria-expanded={isFabMenuOpen}
                                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-600 text-4xl font-light !text-white shadow-2xl transition duration-300 hover:scale-105 hover:bg-cyan-500"
                            >
                                <span
                                    className={`block leading-none transition-transform duration-300 ${
                                        isFabMenuOpen ? "rotate-45" : ""
                                    }`}
                                >
                                    +
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
