import { Link } from 'react-router-dom'
import { Zap, Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">AgendaPro</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              A plataforma para profissionais que querem crescer. Simplifique seus agendamentos e atraia mais clientes.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-indigo-600">
                <Instagram size={14} />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-indigo-600">
                <Facebook size={14} />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-indigo-600">
                <Twitter size={14} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace" className="transition-colors hover:text-white">Encontrar profissionais</Link></li>
              <li><Link to="/pricing" className="transition-colors hover:text-white">Planos e preços</Link></li>
              <li><a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Para profissionais</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="transition-colors hover:text-white">Criar meu perfil</Link></li>
              <li><Link to="/pricing" className="transition-colors hover:text-white">Por que assinar o Pro</Link></li>
              <li><Link to="/marketplace" className="transition-colors hover:text-white">Ver perfis em destaque</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="transition-colors hover:text-white">Termos de uso</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © 2026 AgendaPro. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
