import { getServerSession } from "next-auth/next";
import connectDB from "../../lib/mongodb";
import { authOptions } from "../../lib/authOptions";
import Hangar from "../../models/hangars";
import Aircraft from "../../models/aircraft";

export async function handler(req, res) {

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

        if (req.method === "GET") {

            const { hangarId } = req.query;

            if (!hangarId) {
                return res.status(400).json({
                    error: "Falta el id del hangar",
                });
            }

            const hangar = await Hangar.findOne({
                _id: hangarId,
                owner: session.user.id,
            });

            if (!hangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado",
                });
            }

            const aircraft = await Aircraft.find({
                hangar: hangarId,
                owner: session.user.id,
            })
                .sort({ createdAt: -1 })
                .lean();

            return res.status(200).json(aircraft);
        }

        if (req.method === "POST") {

            const {
                hangarId,
                registration,
                model,
                status,
                aircraftId,
                title,
                notes,
            } = req.body;

            if (aircraftId) {

                const reportTitle = title?.trim();
                const reportNotes = notes?.trim() || "";

                if (!reportTitle) {
                    return res.status(400).json({
                        error: "El título del reporte es obligatorio",
                    });
                }

                const updatedAircraft =
                    await Aircraft.findOneAndUpdate(
                        {
                            _id: aircraftId,
                            owner: session.user.id,
                        },
                        {
                            $push: {
                                reports: {
                                    title: reportTitle,
                                    notes: reportNotes,
                                    createdBy:
                                        session.user.id,
                                },
                            },
                        },
                        {
                            new: true,
                        }
                    ).lean();

                if (!updatedAircraft) {
                    return res.status(404).json({
                        error: "Aeronave no encontrada",
                    });
                }

                return res.status(200).json(updatedAircraft);
            }

            const safeHangarId = hangarId?.trim();
            const safeRegistration = registration?.trim();
            const safeModel = model?.trim();

            if (!safeHangarId || !safeRegistration || !safeModel) {
                return res.status(400).json({
                    error: "Hangar, matrícula y modelo son obligatorios",
                });
            }

            const hangar = await Hangar.findOne({
                _id: safeHangarId,
                owner: session.user.id,
            });

            if (!hangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado",
                });
            }

            const aircraft = await Aircraft.create({
                hangar: safeHangarId,
                owner: session.user.id,
                registration: safeRegistration,
                model: safeModel,
                status: status?.trim() || "Activo",
            });

            return res.status(201).json(aircraft);
        }

        return res.status(405).json({
            error: "Método no permitido",
        });

    } catch (error) {

        console.error("ERROR EN AIRCRAFT:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
}

export default handler;