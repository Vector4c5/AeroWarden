import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Landing() {

    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";

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
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">

            <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">

                <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">

                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                        AeroWarden
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                        Welcome to AeroWarden
                    </h1>

                    <p className="mt-4 text-sm text-slate-300">
                        Your ultimate flight management solution.
                    </p>

                    {session && (

                        <div className="mt-5">

                            <Link
                                href="/hangars"
                                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Ver hangares y aeronaves
                            </Link>

                            {isAdmin && (

                                <Link
                                    href="/admin/dashboard"
                                    className="ml-3 inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                                >
                                    Abrir dashboard
                                </Link>

                            )}

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
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                                >
                                    Nuevo hangar
                                    <span aria-hidden="true">
                                        {isFormOpen ? "−" : "+"}
                                    </span>
                                </button>

                                {isFormOpen && (

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">

                                        <h2 className="mb-4 text-xl font-semibold">
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
                                                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-cyan-400"
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
                                                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none transition focus:border-cyan-400"
                                                required
                                            />

                                            <button
                                                type="submit"
                                                disabled={isCreatingHangar}
                                                className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
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

                                <h2 className="text-xl font-semibold text-white">
                                    Tus hangares
                                </h2>

                                {session && isLoadingHangars && (

                                    <span className="text-sm text-slate-400">
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
                                                className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20"
                                            >

                                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                                                    Hangar
                                                </p>

                                                <h3 className="mt-2 text-lg font-semibold text-white">
                                                    {hangar.name}
                                                </h3>

                                                <p className="mt-2 text-sm text-slate-300">
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
                                                    className="mt-4 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-sm font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
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

                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                                        Aún no tienes hangares creados.
                                    </div>

                                )

                            ) : (

                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                                    Inicia sesión para ver y crear tus hangares.
                                </div>

                            )}

                        </section>

                        {message && (

                            <p className="text-sm text-cyan-300">
                                {message}
                            </p>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}