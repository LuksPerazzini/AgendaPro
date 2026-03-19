import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProfessionalProfile = lazy(() => import('./pages/ProfessionalProfile'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'))
const DashboardAgenda = lazy(() => import('./pages/dashboard/DashboardAgenda'))
const DashboardClientes = lazy(() => import('./pages/dashboard/DashboardClientes'))
const DashboardRelatorios = lazy(() => import('./pages/dashboard/DashboardRelatorios'))
const DashboardMarketing = lazy(() => import('./pages/dashboard/DashboardMarketing'))
const DashboardAvaliacoes = lazy(() => import('./pages/dashboard/DashboardAvaliacoes'))
const DashboardWhatsApp = lazy(() => import('./pages/dashboard/DashboardWhatsApp'))
const DashboardConfiguracoes = lazy(() => import('./pages/dashboard/DashboardConfiguracoes'))
const DashboardServicos = lazy(() => import('./pages/dashboard/DashboardServicos'))
const DashboardAfiliados = lazy(() => import('./pages/dashboard/DashboardAfiliados'))
const DashboardAdminContas = lazy(() => import('./pages/dashboard/DashboardAdminContas'))

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-transparent text-slate-400">
      <Loader2 size={28} className="animate-spin text-indigo-600" />
    </div>
  )
}

function Layout() {
  const location = useLocation()
  const noNavFooter = ['/login', '/register', '/onboarding'].includes(location.pathname) || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/payment') || location.pathname.startsWith('/review')
  const noFooter = location.pathname.startsWith('/book') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/payment') || location.pathname.startsWith('/review')

  return (
    <>
      {!noNavFooter && <Navbar />}
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/professional/:id" element={<ProfessionalProfile />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/review/:appointmentId" element={<ReviewPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="agenda" element={<DashboardAgenda />} />
              <Route path="clientes" element={<DashboardClientes />} />
              <Route path="relatorios" element={<DashboardRelatorios />} />
              <Route path="marketing" element={<DashboardMarketing />} />
              <Route path="avaliacoes" element={<DashboardAvaliacoes />} />
              <Route path="whatsapp" element={<DashboardWhatsApp />} />
              <Route path="servicos" element={<DashboardServicos />} />
              <Route path="configuracoes" element={<DashboardConfiguracoes />} />
              <Route path="afiliados" element={<DashboardAfiliados />} />
              <Route path="contas" element={<DashboardAdminContas />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      {!noNavFooter && !noFooter && <Footer />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
