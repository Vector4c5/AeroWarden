import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Componets/common/Header";

export default function Landing() {

    const { data: session } = useSession();

    const [hangars, setHangars] = useState([]);
    const [isLoadingHangars, setIsLoadingHangars] = useState(false);
    const [isCreatingHangar, setIsCreatingHangar] = useState(false);
    const [deletingHangarId, setDeletingHangarId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {

        if (!session) {
            return;
        }

        const loadHangars = async () => {

            setIsLoadingHangars(true);

            try {

                const response = await fetch(
                    "/api/hangars"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Error al cargar hangares"
                    );
                }

                setHangars(data);

            } catch (error) {

                setMessage(error.message);

            } finally {
                setIsLoadingHangars(false);
            }
        };

        loadHangars();

    }, [session]);

    const handleDeleteHangar = async (hangarId) => {

        setDeletingHangarId(hangarId);

        try {

            const response = await fetch(
                `/api/hangars?id=${hangarId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Error al borrar hangar"
                );
            }

            setHangars((currentHangars) =>
                currentHangars.filter((hangar) =>
                    hangar._id !== hangarId
                )
            );

            setMessage(data.message || "Hangar eliminado correctamente");

        } catch (error) {

            setMessage(error.message);

        } finally {
            setDeletingHangarId(null);
        }
    };

    const handleCreateHangar = async (e) => {

        e.preventDefault();

        setIsCreatingHangar(true);

        try {

            const response = await fetch(
                "/api/hangars",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        name,
                        location,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Error al crear hangar"
                );
            }

            setMessage(
                `Hangar "${data.name}" creado correctamente`
            );

            setHangars((currentHangars) => [
                data,
                ...currentHangars,
            ]);

            setName("");
            setLocation("");
            setIsFormOpen(false);

            console.log(data);

        } catch (error) {

            setMessage(
                error.message
            );

            console.error(error);

        } finally {
            setIsCreatingHangar(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">

            <Header />

            <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-5xl items-center justify-center px-6 py-10">

                <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.28)]">

                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-700/80">
                        AeroWarden
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        Welcome to AeroWarden
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
                        Your ultimate flight management solution.
                    </p>

                    {session && (

                        <div className="mt-5">

                            <Link
                                href="/hangars"
                                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 hover:text-slate-950"
                            >
                                Ver hangares y aeronaves
                            </Link>
                        </div>

                    )}

                    <div className="mt-8 space-y-8">

                        {session && (

                            <div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFormOpen(
                                            !isFormOpen
                                        )
                                    }
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-900 transition hover:bg-cyan-100"
                                >
                                    Nuevo hangar
                                    <span aria-hidden="true">
                                        {isFormOpen ? "−" : "+"}
                                    </span>
                                </button>

                                {isFormOpen && (

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                        <h2 className="mb-4 text-xl font-semibold text-slate-950">
                                            Crear Hangar
                                        </h2>

                                        <form
                                            onSubmit={
                                                handleCreateHangar
                                            }
                                            className="space-y-4"
                                        >

                                            <input
                                                type="text"
                                                placeholder="Nombre del hangar"
                                                value={name}
                                                onChange={(e) =>
                                                    setName(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                                required
                                            />

                                            <input
                                                type="text"
                                                placeholder="Ubicación"
                                                value={location}
                                                onChange={(e) =>
                                                    setLocation(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                                required
                                            />

                                            <button
                                                type="submit"
                                                disabled={isCreatingHangar}
                                                className="rounded-lg bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {isCreatingHangar
                                                    ? "Creando..."
                                                    : "Crear Hangar"}
                                            </button>

                                        </form>

                                    </div>

                                )}

                            </div>

                        )}

                        <section>

                            <div className="mb-4 flex items-center justify-between gap-4">

                                <h2 className="text-xl font-semibold text-slate-950">
                                    Tus hangares
                                </h2>

                                {session && isLoadingHangars && (

                                    <span className="text-sm text-slate-500">
                                        Cargando...
                                    </span>

                                )}

                            </div>

                            {session ? (

                                hangars.length > 0 ? (

                                    <div className="grid gap-4 sm:grid-cols-2">

                                        {hangars.map((hangar) => (

                                            <article
                                                key={hangar._id}
                                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]"
                                            >

                                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                                    Hangar
                                                </p>

                                                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                                                    {hangar.name}
                                                </h3>

                                                <p className="mt-2 text-sm text-slate-600">
                                                    {hangar.location ||
                                                        "Sin ubicación"}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteHangar(
                                                            hangar._id
                                                        )
                                                    }
                                                    disabled={
                                                        deletingHangarId ===
                                                        hangar._id
                                                    }
                                                    className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {deletingHangarId ===
                                                    hangar._id
                                                        ? "Borrando..."
                                                        : "Borrar hangar"}
                                                </button>

                                            </article>

                                        ))}

                                    </div>

                                ) : (

                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                                        Aún no tienes hangares creados.
                                    </div>

                                )

                            ) : (

                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                                    Inicia sesión para ver y crear tus hangares.
                                </div>

                            )}

                        </section>

                        {message && (

                            <p className="text-sm text-cyan-700">
                                {message}
                            </p>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}