import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Menu, X, Zap, LogOut, ChevronDown, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut, isAdmin } = useAuth()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-[0_12px_24px_-18px_rgba(79,70,229,0.7)]">
              <Zap size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-xl font-black tracking-tight text-slate-900">AgendaPro</span>
              <span className="hidden text-xs text-slate-400 sm:block">Agendamentos com mais clareza e conversão</span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link to="/marketplace" className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600">
              Encontrar profissionais
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600">
              Planos
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {!isDashboard && (
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                        {(profile?.full_name ?? user.email ?? 'U')[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">
                      {profile?.full_name ?? user.email}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                        <LayoutDashboard size={15} /> Meu painel
                      </Link>
                      {!isAdmin && profile?.slug && (
                        <Link to={`/professional/${profile.slug}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                          <User size={15} /> Meu perfil público
                        </Link>
                      )}
                      <hr className="my-1 border-slate-100" />
                      <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                        <LogOut size={15} /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                  Entrar
                </Link>
                <Link to="/register" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                  Comecar gratis
                </Link>
              </div>
            )}
          </div>

          <button className="p-2 md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/marketplace" className="font-medium text-slate-700" onClick={() => setOpen(false)}>Encontrar profissionais</Link>
            <Link to="/pricing" className="font-medium text-slate-700" onClick={() => setOpen(false)}>Planos</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 font-medium text-indigo-600" onClick={() => setOpen(false)}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                {!isAdmin && profile?.slug && (
                  <Link to={`/professional/${profile.slug}`} className="font-medium text-slate-700" onClick={() => setOpen(false)}>
                    Meu perfil público
                  </Link>
                )}
                <button onClick={() => { setOpen(false); void handleSignOut() }} className="flex items-center gap-2 text-left font-medium text-rose-600">
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="font-medium text-slate-700" onClick={() => setOpen(false)}>Entrar</Link>
                <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-center font-medium text-white" onClick={() => setOpen(false)}>Comecar gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
