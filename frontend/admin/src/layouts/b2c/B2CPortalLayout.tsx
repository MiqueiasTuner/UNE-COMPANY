import { Outlet, Link, useNavigate } from 'react-router';
import { Icon } from '@iconify/react';

/**
 * Minimal, mobile-first shell for the B2C subscriber-facing "Super Portal".
 * Deliberately does NOT reuse FullLayout (sidebar + internal admin header) —
 * end customers should never see the B2B/staff dashboard chrome.
 */
const B2CPortalLayout = () => {
  const userStr = localStorage.getItem('fikta_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const navigate = useNavigate();
  const isTechNet = user?.tenantId === 'technet';
  const providerInitials = (user?.tenantName || 'ISP').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('fikta_user');
    navigate('/auth/auth2/login');
  };

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <header className="sticky top-0 z-30 bg-white dark:bg-dark border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/b2c/super-portal" className="flex items-center gap-2.5 min-w-0">
            {isTechNet ? (
              <>
                <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-[#F86D72] to-[#51A8B1] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                  TN
                </div>
                <span className="font-black tracking-tight uppercase text-base truncate">
                  <span className="text-[#F86D72]">TECH</span>
                  <span className="text-[#51A8B1]">NET</span>
                </span>
              </>
            ) : (
              <>
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                  {providerInitials}
                </div>
                <span className="font-black tracking-tight text-base text-foreground truncate">
                  {user?.tenantName || 'Meu Provedor'}
                </span>
              </>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="shrink-0 text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted/20 transition-all"
            title="Sair"
          >
            <Icon icon="tabler:logout" width={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 sm:py-6">
        <Outlet />
      </main>

      <footer className="text-center text-[11px] text-muted-foreground py-5">
        Biblioteca digital via <span className="font-bold text-primary">FIKTA</span>
      </footer>
    </div>
  );
};

export default B2CPortalLayout;
