import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { DefaultSession, User as AuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

interface ExtendedUser extends Omit<AuthUser, 'role'> {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ExtendedSession extends DefaultSession {
  user: {
    id: string;
    role: string;
  } & DefaultSession['user'];
}

interface ExtendedJWT extends JWT {
  role: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT, user?: ExtendedUser | any }): Promise<JWT> {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }): Promise<any> {
      if (token?.sub) {
        session.user.id = token.sub;
      }
       if (token?.role) {
         session.user.role = token.role;
       }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };