import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Menu, X, Zap, LogOut, ChevronDown, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
    <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">AgendaPro</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/marketplace" className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">
              Encontrar Profissionais
            </Link>
            <Link to="/pricing" className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">
              Planos
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {isDashboard ? null : (
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {(profile?.full_name ?? user.email ?? 'U')[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {profile?.full_name ?? user.email}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard size={15} /> Meu painel
                      </Link>
                      {profile?.slug && (
                        <Link
                          to={`/professional/${profile.slug}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User size={15} /> Meu perfil público
                        </Link>
                      )}
                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut size={15} /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                  Entrar
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Começar grátis
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4">
          <Link to="/marketplace" className="text-slate-700 font-medium" onClick={() => setOpen(false)}>Encontrar Profissionais</Link>
          <Link to="/pricing" className="text-slate-700 font-medium" onClick={() => setOpen(false)}>Planos</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-indigo-600 font-medium flex items-center gap-2" onClick={() => setOpen(false)}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {profile?.slug && (
                <Link to={`/professional/${profile.slug}`} className="text-slate-700 font-medium" onClick={() => setOpen(false)}>
                  Meu perfil público
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); handleSignOut() }}
                className="text-rose-600 font-medium flex items-center gap-2 text-left"
              >
                <LogOut size={16} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-700 font-medium" onClick={() => setOpen(false)}>Entrar</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-center" onClick={() => setOpen(false)}>Começar grátis</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
