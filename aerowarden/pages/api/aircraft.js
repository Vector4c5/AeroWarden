import { getServerSession } from "next-auth/next";
import connectDB from "../../lib/mongodb";
import { authOptions } from "../../lib/authOptions";
import Hangar from "../../models/hangars";
import Aircraft from "../../models/aircraft";
import { getPendingTaskType } from "../../lib/pendingTaskTypes";

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
];

async function getHangarWithAccess(hangarId, userId) {
    return Hangar.findOne({
        _id: hangarId,
        $or: [
            { owner: userId },
            { "members.user": userId },
        ],
    });
}

function sanitizeConditions(items = []) {
    return items
        .map((item) => ({
            title: item.title?.trim(),
            description: item.description?.trim() || "",
        }))
        .filter((item) => item.title);
}

function sanitizeMaintenanceTasks(items = [], userId) {
    return items
        .map((item) => ({
            title: item.title?.trim(),
            description: item.description?.trim() || "",
            taskType: getPendingTaskType(item),
            status: "pending",
            createdBy: userId,
        }))
        .filter((item) => item.title);
}

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

            const { hangarId, aircraftId } = req.query;

            if (aircraftId) {
                const aircraft = await Aircraft.findById(aircraftId).lean();

                if (!aircraft) {
                    return res.status(404).json({
                        error: "Aeronave no encontrada",
                    });
                }

                const hangar = await getHangarWithAccess(
                    aircraft.hangar,
                    session.user.id
                );

                if (!hangar) {
                    return res.status(404).json({
                        error: "Hangar no encontrado o sin acceso",
                    });
                }

                if (hangarId && hangarId !== aircraft.hangar.toString()) {
                    return res.status(400).json({
                        error: "La aeronave no pertenece a este hangar",
                    });
                }

                return res.status(200).json({
                    aircraft,
                    hangar: {
                        _id: hangar._id,
                        name: hangar.name,
                    },
                });
            }

            if (!hangarId) {
                return res.status(400).json({
                    error: "Falta el id del hangar",
                });
            }

            const hangar = await getHangarWithAccess(
                hangarId,
                session.user.id
            );

            if (!hangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado o sin acceso",
                });
            }

            const aircraft = await Aircraft.find({
                hangar: hangarId,
            })
                .sort({ createdAt: -1 })
                .lean();

            return res.status(200).json(aircraft);
        }

        if (req.method === "POST") {

            const {
                hangarId,
                aircraftId,
                title,
                notes,
                intakeReportByName,
                registration,
                manufacturer,
                serialNumber,
                aircraftType,
                stayReason,
                entryDate,
                arrivalConditions,
                maintenanceTasks,
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
            const safeIntakeName = intakeReportByName?.trim();
            const safeRegistration = registration?.trim().toUpperCase();
            const safeManufacturer = manufacturer?.trim();
            const safeSerialNumber = serialNumber?.trim();
            const safeStayReason = stayReason?.trim();

            if (
                !safeHangarId ||
                !safeIntakeName ||
                !safeRegistration ||
                !safeManufacturer ||
                !safeSerialNumber ||
                !aircraftType ||
                !safeStayReason ||
                !entryDate
            ) {
                return res.status(400).json({
                    error:
                        "Completa todos los campos obligatorios del ingreso",
                });
            }

            if (!AIRCRAFT_TYPES.includes(aircraftType)) {
                return res.status(400).json({
                    error: "El tipo de aeronave no es válido",
                });
            }

            const hangar = await getHangarWithAccess(
                safeHangarId,
                session.user.id
            );

            if (!hangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado o sin acceso",
                });
            }

            const parsedEntryDate = new Date(entryDate);

            if (Number.isNaN(parsedEntryDate.getTime())) {
                return res.status(400).json({
                    error: "La fecha de ingreso no es válida",
                });
            }

            const existingRegistration = await Aircraft.findOne({
                registration: safeRegistration,
            }).lean();

            if (existingRegistration) {
                return res.status(409).json({
                    error: "La matrícula ya está registrada",
                });
            }

            const existingSerial = await Aircraft.findOne({
                serialNumber: safeSerialNumber,
            }).lean();

            if (existingSerial) {
                return res.status(409).json({
                    error: "El número de serie ya está registrado",
                });
            }

            const aircraft = await Aircraft.create({
                hangar: safeHangarId,
                owner: session.user.id,
                intakeReportByName: safeIntakeName,
                registration: safeRegistration,
                manufacturer: safeManufacturer,
                model: safeManufacturer,
                serialNumber: safeSerialNumber,
                aircraftType,
                stayReason: safeStayReason,
                entryDate: parsedEntryDate,
                arrivalConditions: sanitizeConditions(
                    arrivalConditions
                ),
                maintenanceTasks: sanitizeMaintenanceTasks(
                    maintenanceTasks,
                    session.user.id
                ),
                status: "En hangar",
            });

            return res.status(201).json(aircraft);
        }

        if (req.method === "PATCH") {

            const {
                aircraftId,
                action = "complete_task",
                taskId,
                completedByName,
                completionNote,
                exitReportByName,
                exitNote,
            } = req.body;

            if (!aircraftId) {
                return res.status(400).json({
                    error: "Falta el id de la aeronave",
                });
            }

            const aircraft = await Aircraft.findById(aircraftId);

            if (!aircraft) {
                return res.status(404).json({
                    error: "Aeronave no encontrada",
                });
            }

            const hangar = await getHangarWithAccess(
                aircraft.hangar,
                session.user.id
            );

            if (!hangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado o sin acceso",
                });
            }

            if (aircraft.status === "Salida") {
                const allowedWhileDeparted = new Set([
                    "register_exit",
                ]);

                if (!allowedWhileDeparted.has(action)) {
                    return res.status(400).json({
                        error:
                            "No se pueden agregar pendientes ni observaciones a una aeronave que ya salió",
                    });
                }
            }

            if (action === "add_pending_task") {
                const safeTitle = req.body.title?.trim();
                const safeDescription =
                    req.body.description?.trim() || "";
                const taskType = getPendingTaskType(req.body);

                if (!safeTitle) {
                    return res.status(400).json({
                        error: "El título del pendiente es obligatorio",
                    });
                }

                const updatedAircraft = await Aircraft.findByIdAndUpdate(
                    aircraftId,
                    {
                        $push: {
                            maintenanceTasks: {
                                title: safeTitle,
                                description: safeDescription,
                                taskType,
                                status: "pending",
                                createdBy: session.user.id,
                            },
                        },
                    },
                    { new: true }
                ).lean();

                return res.status(200).json({
                    aircraft: updatedAircraft,
                    hangar: {
                        _id: hangar._id,
                        name: hangar.name,
                    },
                });
            }

            if (action === "add_stay_observation") {
                const safeTitle = req.body.title?.trim();
                const safeDescription =
                    req.body.description?.trim() || "";

                if (!safeTitle) {
                    return res.status(400).json({
                        error:
                            "El título de la observación es obligatorio",
                    });
                }

                const updatedAircraft = await Aircraft.findByIdAndUpdate(
                    aircraftId,
                    {
                        $push: {
                            stayObservations: {
                                title: safeTitle,
                                description: safeDescription,
                            },
                        },
                    },
                    { new: true }
                ).lean();

                return res.status(200).json({
                    aircraft: updatedAircraft,
                    hangar: {
                        _id: hangar._id,
                        name: hangar.name,
                    },
                });
            }

            if (action === "register_exit") {
                const safeExitReportByName = exitReportByName?.trim();
                const safeExitNote = exitNote?.trim();

                if (!safeExitReportByName) {
                    return res.status(400).json({
                        error:
                            "El nombre de quien registra la salida es obligatorio",
                    });
                }

                if (!safeExitNote) {
                    return res.status(400).json({
                        error:
                            "Agrega una breve descripción de la salida de la aeronave",
                    });
                }

                if (aircraft.status === "Salida") {
                    return res.status(400).json({
                        error: "Esta aeronave ya fue registrada como salida",
                    });
                }

                const updatedAircraft = await Aircraft.findByIdAndUpdate(
                    aircraftId,
                    {
                        $set: {
                            status: "Salida",
                            exitDate: new Date(),
                            exitReportByName: safeExitReportByName,
                            exitNote: safeExitNote,
                            exitRegisteredBy: session.user.id,
                        },
                    },
                    { new: true }
                ).lean();

                return res.status(200).json({
                    aircraft: updatedAircraft,
                    hangar: {
                        _id: hangar._id,
                        name: hangar.name,
                    },
                });
            }

            if (action !== "complete_task") {
                return res.status(400).json({
                    error: "Acción no válida",
                });
            }

            const safeCompletedByName = completedByName?.trim();
            const safeCompletionNote = completionNote?.trim();

            if (!taskId) {
                return res.status(400).json({
                    error: "Faltan datos del pendiente a completar",
                });
            }

            if (!safeCompletedByName) {
                return res.status(400).json({
                    error: "El nombre de quien completa el trabajo es obligatorio",
                });
            }

            if (!safeCompletionNote) {
                return res.status(400).json({
                    error: "Agrega una breve descripción del trabajo realizado",
                });
            }

            const task = aircraft.maintenanceTasks.id(taskId);

            if (!task) {
                return res.status(404).json({
                    error: "Pendiente no encontrado",
                });
            }

            if (task.status === "completed") {
                return res.status(400).json({
                    error: "Este pendiente ya fue marcado como terminado",
                });
            }

            const updatedAircraft = await Aircraft.findOneAndUpdate(
                {
                    _id: aircraftId,
                    "maintenanceTasks._id": taskId,
                },
                {
                    $set: {
                        "maintenanceTasks.$.status": "completed",
                        "maintenanceTasks.$.completedBy": session.user.id,
                        "maintenanceTasks.$.completedByName":
                            safeCompletedByName,
                        "maintenanceTasks.$.completionNote":
                            safeCompletionNote,
                        "maintenanceTasks.$.completedAt": new Date(),
                    },
                },
                { new: true }
            ).lean();

            return res.status(200).json({
                aircraft: updatedAircraft,
                hangar: {
                    _id: hangar._id,
                    name: hangar.name,
                },
            });
        }

        return res.status(405).json({
            error: "Método no permitido",
        });

    } catch (error) {

        console.error("ERROR EN AIRCRAFT:", error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];

            return res.status(409).json({
                error:
                    field === "registration"
                        ? "La matrícula ya está registrada"
                        : "El número de serie ya está registrado",
            });
        }

        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors || {})[0];

            return res.status(400).json({
                error:
                    firstError?.message ||
                    "Los datos de la aeronave no son válidos",
            });
        }

        return res.status(500).json({
            error: error.message,
        });
    }
}

export default handler;
