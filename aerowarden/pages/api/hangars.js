import { getServerSession } from "next-auth/next";
import { nanoid } from "nanoid";

import connectDB from "../../lib/mongodb";
import Hangar from "../../models/hangars";
import { authOptions } from "../../lib/authOptions";

async function handler(req, res) {

    try {

        const session = await getServerSession(
            req,
            res,
            authOptions
        );

        if (!session) {

            return res.status(401).json({
                error: "No autorizado",
            });
        }

        await connectDB();

        // ======================
        // CREAR HANGAR
        // ======================

        if (req.method === "POST") {

            const {
                name,
                location,
            } = req.body;

            if (!name) {

                return res.status(400).json({
                    error: "El nombre es obligatorio",
                });
            }

            const hangar = await Hangar.create({

                name,
                location,
                owner: session.user.id,

                inviteCode: nanoid(8)
                    .toUpperCase(),

                members: [],
            });

            return res.status(201).json({

                ...hangar.toObject(),

                isOwner: true,

                role: "owner",
            });
        }

        // ======================
        // OBTENER HANGARES
        // ======================

        if (req.method === "GET") {

            const hangars = await Hangar.find({

                $or: [

                    {
                        owner: session.user.id,
                    },

                    {
                        "members.user": session.user.id,
                    },
                ],
            })
                .populate(
                    "owner",
                    "name email"
                )
                .lean();

            const formattedHangars = hangars.map(
                (hangar) => {

                    const member =
                        hangar.members?.find(
                            (m) =>
                                m.user.toString() ===
                                session.user.id
                        );

                    const isOwner =
                        hangar.owner._id.toString() ===
                        session.user.id;

                    return {

                        ...hangar,

                        isOwner,

                        role: isOwner
                            ? "owner"
                            : member?.role || null,
                    };
                }
            );

            return res.status(200).json(
                formattedHangars
            );
        }

        // ======================
        // ELIMINAR HANGAR
        // ======================

        if (req.method === "DELETE") {

            const { id } = req.query;

            if (!id) {

                return res.status(400).json({
                    error:
                        "Falta el id del hangar",
                });
            }

            const deletedHangar =
                await Hangar.findOneAndDelete({

                    _id: id,

                    owner: session.user.id,
                });

            if (!deletedHangar) {

                return res.status(404).json({
                    error:
                        "Hangar no encontrado o no tienes permisos",
                });
            }

            return res.status(200).json({

                success: true,

                message:
                    "Hangar eliminado",
            });
        }

        // ======================
        // MÉTODO NO PERMITIDO
        // ======================

        return res.status(405).json({

            error:
                "Método no permitido",
        });

    } catch (error) {

        console.error(
            "ERROR EN HANGARS:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Error interno del servidor",
        });
    }
}

export default handler;