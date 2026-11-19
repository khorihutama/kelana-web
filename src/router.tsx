import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { ToastProvider } from '@/components/overlay';
import { session } from '@/lib/session';
import type { MyTripTab } from '@/lib/types';
import { Welcome, SignIn, SignUp, Verify } from './routes/auth';
import { Home } from './routes/home';
import { Destinations } from './routes/destinations';
import { SearchPage } from './routes/search';
import { TripDetailPage } from './routes/trip';
import { BookingPage } from './routes/booking';
import { CheckoutPage } from './routes/checkout';
import { PayPage } from './routes/pay';
import { SuccessPage } from './routes/success';
import { MyTripsPage } from './routes/mytrips';
import { ProfilePage } from './routes/profile';
import { EmptyState } from '@/components/ui';

const rootRoute = createRootRoute({
  component: () => (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  ),
  notFoundComponent: () => (
    <div className="shell items-center justify-center px-6">
      <EmptyState title="Halaman tidak ditemukan" description="Tautan mungkin sudah berubah. Kembali ke beranda untuk melanjutkan." />
    </div>
  ),
});

const requireSession = () => {
  if (!session.get()) throw redirect({ to: '/welcome' });
};

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: session.get() ? '/home' : '/welcome' });
  },
});

const welcomeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/welcome', component: Welcome });
const signInRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signin', component: SignIn });
const signUpRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signup', component: SignUp });

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify',
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: Verify,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: requireSession,
  component: Home,
});

const destinationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/destinations',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  component: Destinations,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { q: string } => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  component: SearchPage,
});

const tripRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trips/$slug',
  beforeLoad: requireSession,
  component: TripDetailPage,
});

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/booking/$slug',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { schedule?: string } => ({
    schedule: typeof search.schedule === 'string' ? search.schedule : undefined,
  }),
  component: BookingPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout/$reservationId',
  beforeLoad: requireSession,
  component: CheckoutPage,
});

const payRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pay/$paymentId',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { reservation?: string } => ({
    reservation: typeof search.reservation === 'string' ? search.reservation : undefined,
  }),
  component: PayPage,
});

const successRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/success/$reservationId',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { payment?: string } => ({
    payment: typeof search.payment === 'string' ? search.payment : undefined,
  }),
  component: SuccessPage,
});

const myTripsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mytrips',
  beforeLoad: requireSession,
  validateSearch: (search: Record<string, unknown>): { tab?: MyTripTab } => ({
    tab:
      search.tab === 'BELUM_BAYAR' || search.tab === 'SIAP_BERANGKAT' || search.tab === 'SELESAI' || search.tab === 'RIWAYAT'
        ? search.tab
        : undefined,
  }),
  component: MyTripsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireSession,
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  welcomeRoute,
  signInRoute,
  signUpRoute,
  verifyRoute,
  homeRoute,
  destinationsRoute,
  searchRoute,
  tripRoute,
  bookingRoute,
  checkoutRoute,
  payRoute,
  successRoute,
  myTripsRoute,
  profileRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}