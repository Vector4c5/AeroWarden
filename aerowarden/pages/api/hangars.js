import { getServerSession } from "next-auth/next";
import connectDB from "../../lib/mongodb";
import Hangar from "../../models/hangars";
import { authOptions } from "../../lib/authOptions";

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

        if (req.method === "POST") {

            const {
                name,
                location,
            } = req.body;
            const hangar =
                await Hangar.create({
                    name,
                    location,
                    owner: session.user.id,
                });
            return res.status(201).json(hangar);
        }

        if (req.method === "GET") {

            const hangars = await Hangar.find({
                owner: session.user.id,
            });

            return res.status(200).json(hangars);
        }

        if (req.method === "DELETE") {

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({
                    error: "Falta el id del hangar",
                });
            }

            const deletedHangar = await Hangar.findOneAndDelete({
                _id: id,
                owner: session.user.id,
            });

            if (!deletedHangar) {
                return res.status(404).json({
                    error: "Hangar no encontrado",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Hangar eliminado",
            });
        }

        return res.status(405).json({
            error: "Método no permitido",
        });

    } catch (error) {

        console.error("ERROR EN HANGARS:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
}

export default handler;