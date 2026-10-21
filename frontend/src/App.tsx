import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
} from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import BookingPage from './pages/BookingPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
        <header className="relative z-20 border-b border-slate-200/70 bg-white/95">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <CalendarDays size={23} strokeWidth={2.3} />
              </div>

              <div>
                <span className="block text-2xl font-extrabold tracking-tight">
                  slotly<span className="text-indigo-600">.</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Scheduling made simple
                </span>
              </div>
            </NavLink>

            <nav aria-label="Main navigation" className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <CalendarDays size={16} />
                Book a slot
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
            </nav>

            <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 lg:flex">
              <Sparkles size={15} />
              Built with care
              <ArrowUpRight size={14} />
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-400 sm:px-8">
            <span>© 2026 Slotly. Make time for what matters.</span>
            <span>Built for the TeamLift Engineering Challenge</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App