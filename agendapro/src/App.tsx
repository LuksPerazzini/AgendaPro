import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Marketplace from './pages/Marketplace'
import ProfessionalProfile from './pages/ProfessionalProfile'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PricingPage from './pages/PricingPage'
import OnboardingPage from './pages/OnboardingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import DashboardAgenda from './pages/dashboard/DashboardAgenda'
import DashboardClientes from './pages/dashboard/DashboardClientes'
import DashboardRelatorios from './pages/dashboard/DashboardRelatorios'
import DashboardMarketing from './pages/dashboard/DashboardMarketing'
import DashboardAvaliacoes from './pages/dashboard/DashboardAvaliacoes'
import DashboardWhatsApp from './pages/dashboard/DashboardWhatsApp'
import DashboardConfiguracoes from './pages/dashboard/DashboardConfiguracoes'
import DashboardAfiliados from './pages/dashboard/DashboardAfiliados'

function Layout() {
  const location = useLocation()
  const noNavFooter = ['/login', '/register', '/onboarding'].includes(location.pathname) || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/payment')
  const noFooter = location.pathname.startsWith('/book') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/payment')

  return (
    <>
      {!noNavFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/professional/:id" element={<ProfessionalProfile />} />
        <Route path="/book/:id" element={<BookingPage />} />
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
            <Route path="configuracoes" element={<DashboardConfiguracoes />} />
            <Route path="afiliados" element={<DashboardAfiliados />} />
          </Route>
        </Route>
      </Routes>
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
