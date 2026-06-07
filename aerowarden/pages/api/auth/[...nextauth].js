import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "../../../lib/mongodb";
import User from "../../../models/users";

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

                const user = await User.findOne({
                    email: credentials.email
                        ?.trim()
                        .toLowerCase(),
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

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
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

            if (!existingUser) {

                await User.create({
                    name,
                    email,
                    lastLogin:
                        new Date(),
                });

            } else {

                await User.findByIdAndUpdate(
                    existingUser._id,
                    {
                        $set: {
                            name,
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

            const email = (
                user?.email ||
                token.email ||
                ""
            )
                .trim()
                .toLowerCase();

            if (email) {

                await connectDB();

                const dbUser =
                    await User.findOne({
                        email,
                    }).lean();

                if (dbUser) {

                    token.id =
                        dbUser._id.toString();

                    token.role =
                        dbUser.role;

                    token.name =
                        dbUser.name;
                }
            }

            return token;
        },

        async session({
            session,
            token,
        }) {

            if (session.user) {

                session.user.id =
                    token.id;

                session.user.name =
                    token.name;

                session.user.email =
                    token.email;
            }

            return session;
        },
    },

    secret:
        process.env.NEXTAUTH_SECRET,
};

export default NextAuth(
    authOptions
);