import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import GoogleProvider from "next-auth/providers/google";
import {db} from "../../lib/db"

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "email@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials;
                const connection = await db();
                const [rows] = await connection.query(
                    "SELECT * FROM User WHERE email = ?",
                    [email]
                );

                if (rows.length === 0) {
                    throw new Error("No user found with this email");
                }

                const user = rows[0];
                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return { id: user.userID, email: user.email, role: user.userType };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.accessToken = account.access_token;
                token.role = user.role; // Add user role to the token
            }
            return token;
        },
        async session({ session, token }) {
            session.user.role = token.role; // Add role to the session
            return session;
        }, //for googgle
        async redirect({  baseUrl }) {
            return baseUrl + '/pages/dashboard';
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin",
    },
};

export default NextAuth(authOptions);
