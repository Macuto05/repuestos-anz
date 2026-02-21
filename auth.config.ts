import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const userRole = auth?.user?.role;

            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnProductos = nextUrl.pathname.startsWith('/productos');
            const isOnTienda = nextUrl.pathname.startsWith('/tienda');
            const isOnVentas = nextUrl.pathname.startsWith('/ventas');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isLoginPage = nextUrl.pathname === '/login';

            // Admin routes
            if (isOnAdmin) {
                if (isLoggedIn && userRole === 'admin') return true;
                return false;
            }

            // Vendor routes
            if (isOnDashboard || isOnProductos || isOnTienda || isOnVentas) {
                if (isLoggedIn && userRole === 'vendedor') return true;
                return false;
            }

            // Redirect already-logged-in users away from login
            if (isLoginPage && isLoggedIn) {
                if (userRole === 'admin') {
                    return Response.redirect(new URL('/admin/dashboard', nextUrl));
                } else {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.rol;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
