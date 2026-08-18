import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { apiGet, apiPut } from 'src/api/client';
import { useAutoRefresh } from 'src/hooks/useAutoRefresh';

/**
 * Visão global da FIKTA: matriz de provedores × módulos.
 *
 * É aqui que a FIKTA liga e desliga capacidades por parceiro. Todo dado desta tela vem
 * de GET /api/v1/platform/providers — inclusive as contagens, que são agregadas no banco.
 * Nada é calculado no frontend, para que o número mostrado seja o mesmo que um relatório
 * em SQL devolveria.
 */

interface ModuleGrant {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  surface: string;
  requiresErp: boolean;
  granted: boolean;
  enabled: boolean;
  expired: boolean;
  expiresAt: string | null;
}

interface ProviderRow {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  subscriberCount: number;
  delinquentCount: number;
  bookCount: number;
  magazineCount: number;
  hasErpIntegration: boolean;
  lastErpSyncAt: string | null;
  modules: ModuleGrant[];
}

const SURFACE_LABEL: Record<string, string> = {
  B2C: 'Portal do assinante',
  PROVIDER_ADMIN: 'Painel do provedor',
  BOTH: 'Ambos',
};

const PlatformModules = () => {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ providers: ProviderRow[] }>('/api/v1/platform/providers');
      setProviders(data.providers ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Mantém a matriz de módulos viva sem F5.
  useAutoRefresh(load, 30_000);

  const toggleModule = async (provider: ProviderRow, mod: ModuleGrant) => {
    const key = `${provider.id}:${mod.code}`;
    setSavingKey(key);
    setError(null);
    try {
      await apiPut(`/api/v1/platform/providers/${provider.id}/modules/${mod.code}`, {
        enabled: !mod.enabled,
      });
      // Relê do servidor em vez de ajustar o estado local: o backend recusa combinações
      // inválidas (módulo que exige ERP sem integração), então o estado autoritativo é o dele.
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <CardBox className="p-10 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        <p className="text-sm text-muted-foreground">Carregando provedores e módulos…</p>
      </CardBox>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Módulos por Provedor</h3>
          <p className="text-sm text-muted-foreground">
            Visão global da FIKTA — habilite ou desabilite capacidades de cada parceiro
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm font-semibold border border-border px-4 py-2 rounded-lg hover:bg-muted/20 transition-all"
        >
          <Icon icon="tabler:refresh" width={16} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 flex items-start gap-2.5">
          <Icon icon="tabler:alert-triangle" width={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {providers.length === 0 && !error && (
        <CardBox className="p-10 text-center space-y-2">
          <Icon icon="tabler:building-broadcast-tower" width={40} className="mx-auto text-muted-foreground/40" />
          <h4 className="font-bold text-foreground">Nenhum provedor cadastrado</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Cadastre um provedor em Gestão de Provedores para então liberar módulos a ele.
          </p>
        </CardBox>
      )}

      {providers.map((p) => (
        <CardBox key={p.id} className="border border-border overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-foreground truncate">{p.name}</h4>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {p.status}
                </span>
                {!p.hasErpIntegration && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Sem ERP
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.cnpj}</p>
            </div>

            {/* Contagens agregadas no banco — não somadas aqui. */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm shrink-0">
              <Metric label="Assinantes" value={p.subscriberCount} />
              <Metric
                label="Inadimplentes"
                value={p.delinquentCount}
                tone={p.delinquentCount > 0 ? 'warn' : undefined}
              />
              <Metric label="Livros" value={p.bookCount} />
              <Metric label="Revistas" value={p.magazineCount} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Último sync</p>
                <p className="font-semibold text-foreground">
                  {p.lastErpSyncAt ? new Date(p.lastErpSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-4">
            {p.modules.map((m) => {
              const key = `${p.id}:${m.code}`;
              const blockedByErp = m.requiresErp && !p.hasErpIntegration;
              return (
                <div
                  key={m.code}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    m.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/10'
                  }`}
                >
                  <Icon
                    icon={m.icon || 'tabler:puzzle'}
                    width={20}
                    className={`mt-0.5 shrink-0 ${m.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {SURFACE_LABEL[m.surface] ?? m.surface}
                      {m.requiresErp && ' · exige ERP'}
                    </p>
                    {m.expired && (
                      <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Concessão expirada</p>
                    )}
                    {blockedByErp && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Configure a integração para liberar
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleModule(p, m)}
                    disabled={savingKey === key || (blockedByErp && !m.enabled)}
                    aria-pressed={m.enabled}
                    aria-label={`${m.enabled ? 'Desabilitar' : 'Habilitar'} ${m.name} para ${p.name}`}
                    className={`shrink-0 w-11 h-6 rounded-full relative transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      m.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        m.enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardBox>
      ))}
    </div>
  );
};

const Metric = ({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
    <p className={`font-bold ${tone === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>{value}</p>
  </div>
);

export default PlatformModules;
