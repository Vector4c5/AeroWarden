import bcrypt from "bcryptjs";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/users";
import { isAdminEmail } from "../../../lib/admin";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido",
        });
    }

    try {

        await connectDB();

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Todos los campos son obligatorios",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(400).json({
                error: "Este correo ya está registrado",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const normalizedEmail = email.toLowerCase();

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: isAdminEmail(normalizedEmail)
                ? "admin"
                : "user",
        });

        return res.status(201).json({
            success: true,
            message: "Usuario registrado",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {

    console.error("ERROR REGISTER:", error);

    return res.status(500).json({
        error: error.message,
        stack: error.stack,
    });
}
}