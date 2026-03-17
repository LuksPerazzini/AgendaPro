import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Calendar, Users, BarChart2, Settings, MessageCircle,
  Star, Megaphone, Menu, X, Zap, Bell, ChevronRight, LogOut, Gift
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Visão Geral', exact: true },
  { path: '/dashboard/agenda', icon: <Calendar size={18} />, label: 'Agenda' },
  { path: '/dashboard/clientes', icon: <Users size={18} />, label: 'Clientes' },
  { path: '/dashboard/relatorios', icon: <BarChart2 size={18} />, label: 'Relatórios' },
  { path: '/dashboard/marketing', icon: <Megaphone size={18} />, label: 'Marketing' },
  { path: '/dashboard/avaliacoes', icon: <Star size={18} />, label: 'Avaliações' },
  { path: '/dashboard/whatsapp', icon: <MessageCircle size={18} />, label: 'WhatsApp' },
  { path: '/dashboard/afiliados', icon: <Gift size={18} />, label: 'Indicações' },
  { path: '/dashboard/configuracoes', icon: <Settings size={18} />, label: 'Configurações' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = profile?.full_name ?? 'Usuário'
  const displayPlan = profile?.plan === 'pro' ? 'Plano PRO ✨' : profile?.plan === 'business' ? 'Business 🚀' : 'Plano Gratuito'
  const planColor = profile?.plan === 'free' ? 'text-slate-400' : 'text-amber-400'

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/dashboard'
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transition-transform duration-300`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">AgendaPro</span>
          </Link>
          <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{displayName}</div>
              <div className={`text-xs font-medium ${planColor}`}>{displayPlan}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-colors ${isActive(item.path, item.exact) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors w-full">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <button className="md:hidden p-2 text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
            <span>Dashboard</span>
            {location.pathname !== '/dashboard' && (
              <>
                <ChevronRight size={14} />
                <span className="text-slate-900 font-medium capitalize">
                  {location.pathname.split('/').pop()}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-700">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
            </button>
            <Link
              to={`/professional/1`}
              className="text-sm text-indigo-600 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Ver meu perfil
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
