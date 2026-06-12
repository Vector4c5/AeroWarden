import { getServerSession } from "next-auth/next";

import connectDB from "../../../lib/mongodb";
import Hangar from "../../../models/hangars";
import { authOptions } from "../../../lib/authOptions";
import {
    generateInviteCode,
    getInviteCodeExpiryDate,
    isInviteCodeExpired,
    isInviteCodeVisible,
} from "../../../lib/hangarInvite";

async function rotateExpiredInviteCode(hangar) {
    if (!isInviteCodeExpired(hangar)) {
        return hangar;
    }

    return Hangar.findByIdAndUpdate(
        hangar._id,
        {
            $set: {
                inviteCode: generateInviteCode(),
                inviteCodeExpiresAt: null,
            },
        },
        { new: true }
    ).lean();
}

function formatHangarForUser(hangar, userId) {
    const ownerId = hangar.owner?._id?.toString() || hangar.owner?.toString();
    const member = hangar.members?.find(
        (entry) => entry.user.toString() === userId
    );
    const isOwner = ownerId === userId?.toString();

    const formattedHangar = {
        ...hangar,
        isOwner,
        role: isOwner ? "owner" : member?.role || null,
        inviteCodeVisible: false,
        inviteCodeExpiresAt: hangar.inviteCodeExpiresAt || null,
    };

    if (isOwner && isInviteCodeVisible(hangar)) {
        formattedHangar.inviteCodeVisible = true;
        formattedHangar.inviteCode = hangar.inviteCode;
    } else {
        delete formattedHangar.inviteCode;
    }

    if (!isOwner) {
        delete formattedHangar.inviteCode;
        delete formattedHangar.inviteCodeExpiresAt;
    }

    return formattedHangar;
}

const HANGAR_CLASSIFICATIONS = [
    "Mantenimiento",
    "Aviación General",
    "Aviación Ejecutiva",
    "Comercial",
    "Militar/Gubernamental",
    "Multipropósito",
];

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

        if (req.method === "POST") {

            const {
                name,
                location,
                baseAirport,
                description,
                classification,
            } = req.body;

            if (!name?.trim()) {

                return res.status(400).json({
                    error: "El nombre es obligatorio",
                });
            }

            if (!location?.trim()) {

                return res.status(400).json({
                    error: "La ubicación es obligatoria",
                });
            }

            if (!baseAirport?.trim()) {

                return res.status(400).json({
                    error: "El aeropuerto base es obligatorio",
                });
            }

            const normalizedBaseAirport = baseAirport
                .trim()
                .toUpperCase();

            if (!/^[A-Z]{4}$/.test(normalizedBaseAirport)) {

                return res.status(400).json({
                    error:
                        "El aeropuerto base debe ser un código ICAO de 4 letras (ej. MMMX)",
                });
            }

            if (
                classification &&
                !HANGAR_CLASSIFICATIONS.includes(
                    classification
                )
            ) {

                return res.status(400).json({
                    error:
                        "La clasificación del hangar no es válida",
                });
            }

            const hangar = await Hangar.create({

                name: name.trim(),
                location: location.trim(),
                baseAirport: normalizedBaseAirport,
                description: description?.trim() || "",
                classification:
                    classification ||
                    "Multipropósito",
                owner: session.user.id,

                inviteCode: generateInviteCode(),
                inviteCodeExpiresAt: null,

                members: [],
            });

            return res.status(201).json(
                formatHangarForUser(
                    {
                        ...hangar.toObject(),
                        owner: session.user.id,
                    },
                    session.user.id
                )
            );
        }

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

            const formattedHangars = await Promise.all(
                hangars.map(async (hangar) => {
                    const ownerId = hangar.owner._id.toString();
                    const isOwner = ownerId === session.user.id;
                    let currentHangar = hangar;

                    if (isOwner) {
                        currentHangar =
                            (await rotateExpiredInviteCode(hangar)) ||
                            hangar;
                    }

                    return formatHangarForUser(
                        currentHangar,
                        session.user.id
                    );
                })
            );

            return res.status(200).json(
                formattedHangars
            );
        }

        if (req.method === "PATCH") {
            const { id } = req.query;
            const { action } = req.body;

            if (!id) {
                return res.status(400).json({
                    error: "Falta el id del hangar",
                });
            }

            if (action !== "reveal_invite_code") {
                return res.status(400).json({
                    error: "Acción no válida",
                });
            }

            let hangar = await Hangar.findOne({
                _id: id,
                owner: session.user.id,
            }).lean();

            if (!hangar) {
                return res.status(404).json({
                    error:
                        "Hangar no encontrado o no tienes permisos",
                });
            }

            if (isInviteCodeExpired(hangar)) {
                hangar =
                    (await rotateExpiredInviteCode(hangar)) || hangar;
            }

            if (!isInviteCodeVisible(hangar)) {
                hangar = await Hangar.findByIdAndUpdate(
                    hangar._id,
                    {
                        $set: {
                            inviteCodeExpiresAt:
                                getInviteCodeExpiryDate(),
                        },
                    },
                    { new: true }
                ).lean();
            }

            const formattedHangar = formatHangarForUser(
                hangar,
                session.user.id
            );

            return res.status(200).json({
                ...formattedHangar,
                message: formattedHangar.inviteCodeVisible
                    ? "Código de invitación visible por 24 horas"
                    : "No se pudo mostrar el código de invitación",
            });
        }

        if (req.method === "PUT") {

            const { id } = req.query;

            const {
                name,
                location,
                baseAirport,
                description,
                classification,
            } = req.body;

            if (!id) {

                return res.status(400).json({
                    error: "Falta el id del hangar",
                });
            }

            if (!name?.trim()) {

                return res.status(400).json({
                    error: "El nombre es obligatorio",
                });
            }

            if (!location?.trim()) {

                return res.status(400).json({
                    error: "La ubicación es obligatoria",
                });
            }

            if (!baseAirport?.trim()) {

                return res.status(400).json({
                    error: "El aeropuerto base es obligatorio",
                });
            }

            const normalizedBaseAirport = baseAirport
                .trim()
                .toUpperCase();

            if (!/^[A-Z]{4}$/.test(normalizedBaseAirport)) {

                return res.status(400).json({
                    error:
                        "El aeropuerto base debe ser un código ICAO de 4 letras (ej. MMMX)",
                });
            }

            if (
                classification &&
                !HANGAR_CLASSIFICATIONS.includes(
                    classification
                )
            ) {

                return res.status(400).json({
                    error:
                        "La clasificación del hangar no es válida",
                });
            }

            const updatedHangar = await Hangar.findOneAndUpdate(
                {
                    _id: id,
                    owner: session.user.id,
                },
                {
                    name: name.trim(),
                    location: location.trim(),
                    baseAirport: normalizedBaseAirport,
                    description: description?.trim() || "",
                    classification:
                        classification ||
                        "Multipropósito",
                },
                { new: true }
            ).lean();

            if (!updatedHangar) {

                return res.status(404).json({
                    error:
                        "Hangar no encontrado o no tienes permisos",
                });
            }

            return res.status(200).json(
                formatHangarForUser(
                    {
                        ...updatedHangar,
                        owner: session.user.id,
                    },
                    session.user.id
                )
            );
        }

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
