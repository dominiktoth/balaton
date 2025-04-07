import type { Session, User } from '@supabase/supabase-js'

declare global {
  interface CustomSession {
    user: User & {
      id: string
      email?: string
      role?: string
    }
    expires_at: number
  }
}

export type { Session, User, CustomSession }

interface JwtType {
  sub?: string;
  role?: string;
  expires_at?: number;
  [key: string]: unknown;
}

export const authConfig = {
  providers: [],
  callbacks: {
    async session({ session, token }: { session: Session; token: JwtType }): Promise<CustomSession> {
      if (token) {
        const customSession: CustomSession = {
          ...session,
          user: {
            ...session.user,
            id: token.sub ?? '',
            role: token.role,
          },
          expires_at: token.expires_at ?? Date.now()
        };
        return customSession;
      }
      return session as CustomSession;
    },
    async jwt({ token, user }: { token: JwtType; user?: User }): Promise<JwtType> {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    }
  }
};