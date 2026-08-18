import { Outlet, Link, useNavigate } from 'react-router';
import { Icon } from '@iconify/react';
import { getCurrentTenant } from 'src/data/tenants';

/**
 * Minimal, mobile-first shell for the B2C subscriber-facing "Super Portal".
 * Deliberately does NOT reuse FullLayout (sidebar + internal admin header) —
 * end customers should never see the B2B/staff dashboard chrome.
 */
const B2CPortalLayout = () => {
  const userStr = localStorage.getItem('fikta_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const navigate = useNavigate();
  const tenant = getCurrentTenant();
  const isProviderBranded = tenant.id !== 'fikta';
  const providerInitials = (user?.tenantName || 'ISP').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('fikta_user');
    navigate('/auth/auth2/login');
  };

  /**
   * Staff (FIKTA master or provider admin) reaching this layout are previewing what their
   * subscribers see — they are not subscribers. Without an explicit way out they get stuck
   * here, because this shell deliberately drops the admin sidebar and the only other
   * control is "Sair", which logs them out entirely.
   */
  const isPreviewingAsStaff = user?.role === 'PROVIDER_ADMIN' || user?.role === 'UNE_ADMIN';

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      {isPreviewingAsStaff && (
        <div className="sticky top-0 z-40 bg-amber-500 text-amber-950">
          <div className="max-w-3xl mx-auto px-4 h-11 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-bold min-w-0">
              <Icon icon="tabler:eye" width={16} className="shrink-0" />
              <span className="truncate">Pré-visualização do portal do assinante</span>
            </span>
            <button
              onClick={() => navigate('/')}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-amber-950/10 hover:bg-amber-950/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <Icon icon="tabler:arrow-left" width={15} />
              Voltar ao painel
            </button>
          </div>
        </div>
      )}

      <header
        className={`sticky z-30 bg-white dark:bg-dark border-b border-border ${
          isPreviewingAsStaff ? 'top-11' : 'top-0'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/b2c/super-portal" className="flex items-center gap-2.5 min-w-0">
            {isProviderBranded ? (
              <>
                <div
                  className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shadow-sm"
                  style={{ backgroundImage: `linear-gradient(to bottom right, ${tenant.colors.primary}, ${tenant.colors.secondary})` }}
                >
                  {tenant.initials}
                </div>
                <span className="font-black tracking-tight uppercase text-base truncate">
                  <span style={{ color: tenant.colors.primary }}>{tenant.wordmark.lead}</span>
                  <span style={{ color: tenant.colors.secondary }}>{tenant.wordmark.tail}</span>
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
