import { getServerSession } from "next-auth/next";

import connectDB from "../../../lib/mongodb";
import Hangar from "../../../models/hangars";
import { authOptions } from "../../../lib/authOptions";

export default async function handler(
    req,
    res
) {

    try {

        if (req.method !== "POST") {

            return res.status(405).json({
                error: "Método no permitido",
            });
        }

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

        const { inviteCode } = req.body;

        if (!inviteCode) {

            return res.status(400).json({
                error: "Código requerido",
            });
        }

        const normalizedCode = inviteCode
            .trim()
            .toUpperCase();

        const hangar = await Hangar.findOne({
            inviteCode: normalizedCode,
        });

        if (!hangar) {

            return res.status(404).json({
                error: "Código inválido",
            });
        }

        if (
            hangar.owner.toString() ===
            session.user.id
        ) {

            return res.status(400).json({
                error:
                    "Ya eres propietario de este hangar",
            });
        }

        const isMember = hangar.members.some(
            (member) =>
                member.user.toString() ===
                session.user.id
        );

        if (isMember) {

            return res.status(400).json({
                error:
                    "Ya perteneces a este hangar",
            });
        }

        hangar.members.push({
            user: session.user.id,
            role: "technician",
        });

        await hangar.save();

        return res.status(200).json({

            ...hangar.toObject(),

            isOwner: false,

            role: "technician",

            message:
                "Te has unido correctamente",
        });

    } catch (error) {

        console.error(
            "ERROR JOIN:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Error interno del servidor",

        });
    }
}