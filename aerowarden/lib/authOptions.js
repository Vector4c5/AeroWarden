import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "./mongodb";
import User from "../models/users";
import { isAdminEmail } from "./admin";

export const authOptions = {
    pages: {
        error: "/",
    },

    session: {
        strategy: "jwt",
    },

    providers: [

        CredentialsProvider({
            name: "Credentials",

            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },

                password: {
                    label: "Password",
                    type: "password",
                },
            },

            async authorize(credentials) {

                await connectDB();

                const email = credentials?.email
                    ?.trim()
                    .toLowerCase();

                if (!email || !credentials?.password) {
                    throw new Error(
                        "Correo y contraseña son requeridos"
                    );
                }

                const user = await User.findOne({
                    email,
                });

                if (!user) {
                    throw new Error(
                        "Usuario no encontrado"
                    );
                }

                if (!user.password) {
                    throw new Error(
                        "Esta cuenta utiliza Google para iniciar sesión"
                    );
                }

                const isValidPassword =
                    await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                if (!isValidPassword) {
                    throw new Error(
                        "Contraseña incorrecta"
                    );
                }

                await User.findByIdAndUpdate(
                    user._id,
                    {
                        lastLogin: new Date(),
                    }
                );

                const role = isAdminEmail(user.email)
                    ? "admin"
                    : user.role || "user";

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role,
                };
            },
        }),

        GoogleProvider({
            clientId:
                process.env.GOOGLE_ID,

            clientSecret:
                process.env.GOOGLE_SECRET,
        }),
    ],

    callbacks: {

        async signIn({
            user,
            account,
            profile,
        }) {

            if (
                account?.provider !==
                "google"
            ) {
                return true;
            }

            await connectDB();

            const email = (
                user?.email ||
                profile?.email ||
                ""
            )
                .trim()
                .toLowerCase();

            if (!email) {
                return false;
            }

            const name =
                user?.name ||
                profile?.name ||
                "";

            const existingUser =
                await User.findOne({
                    email,
                });

            const role = isAdminEmail(email)
                ? "admin"
                : existingUser?.role || "user";

            if (!existingUser) {

                await User.create({
                    name,
                    email,
                    image:
                        user?.image ||
                        null,
                    role,
                    lastLogin:
                        new Date(),
                });

            } else {

                await User.findByIdAndUpdate(
                    existingUser._id,
                    {
                        $set: {
                            name,
                            image:
                                user?.image ||
                                existingUser.image,
                            lastLogin:
                                new Date(),
                        },
                    }
                );
            }

            return true;
        },

        async jwt({
            token,
            user,
        }) {

            if (user?.email) {

                await connectDB();

                const dbUser =
                    await User.findOne({
                        email:
                            user.email
                                .trim()
                                .toLowerCase(),
                    }).lean();

                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                    token.image = dbUser.image;
                    token.role = isAdminEmail(dbUser.email)
                        ? "admin"
                        : dbUser.role || "user";
                }
            }

            return token;
        },

        async session({
            session,
            token,
        }) {

            if (session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.image;
                session.user.role = token.role || "user";
            }

            return session;
        },
    },

    secret:
        process.env.NEXTAUTH_SECRET,
};