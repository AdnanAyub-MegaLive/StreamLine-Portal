import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: { signIn: "/" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (
          email === process.env.ADMIN_EMAIL?.toLowerCase() &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "Platform Admin", email };
        }

        return null;
      },
    }),
  ],
});
