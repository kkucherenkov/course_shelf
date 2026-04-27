/**
 * Global route middleware — redirects unauthenticated users to /login.
 *
 * Note: the card spec said /sign-in, but the codebase route is /login;
 * using /login to minimise blast radius.
 *
 * Public routes: /login, /signup, /__tokens
 */

import { useAuthStore } from '~/stores/auth';

const PUBLIC_ROUTES = new Set(['/login', '/signup', '/__tokens']);

export default defineNuxtRouteMiddleware((to) => {
  // Defensive server-side guard; this code never runs because ssr: false.
  if (import.meta.server) return;

  if (PUBLIC_ROUTES.has(to.path)) return;

  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return navigateTo('/login');
  }
});
