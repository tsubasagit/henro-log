import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: '札所', icon: '⛩' },
  { to: '/timeline', label: '記録', icon: '🕒' },
  { to: '/album', label: '写真', icon: '🖼' },
  { to: '/settings', label: '設定', icon: '⚙' },
];

export default function Layout() {
  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-white text-slate-800 pb-16 shadow-sm">
      <Outlet />

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 grid grid-cols-4 z-10">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 text-xs ${isActive ? 'text-[#1f5b8c]' : 'text-slate-400'}`
            }
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="mt-0.5">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
