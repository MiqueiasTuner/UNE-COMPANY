import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { apiGet, apiPut, apiPost } from 'src/api/client';

/**
 * Tela cheia de gestão de um provedor parceiro.
 *
 * Substitui o modal de edição, que só cabia meia dúzia de campos genéricos. Um provedor
 * concentra cadastro, contrato comercial, homologação de ERP e concessão de módulos —
 * informação demais para um diálogo, e que precisa ficar endereçável por URL para o
 * operador conseguir voltar, compartilhar e comparar.
 */

interface ProviderDetailData {
  id: string;
  name: string;
  companyName: string;
  cnpj: string | null;
  status: string;
  domain: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  createdAt: string | null;
}

interface ModuleGrant {
  code: string;
  name: string;
  icon: string | null;
  surface: string;
  requiresErp: boolean;
  granted: boolean;
  enabled: boolean;
  expired: boolean;
}

interface ProviderOverview {
  id: string;
  subscriberCount: number;
  delinquentCount: number;
  bookCount: number;
  magazineCount: number;
  hasErpIntegration: boolean;
  lastErpSyncAt: string | null;
  modules: ModuleGrant[];
}

type Tab = 'CADASTRO' | 'ERP' | 'MODULOS';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'CADASTRO', label: 'Dados Cadastrais', icon: 'tabler:building' },
  { id: 'ERP', label: 'Homologação ERP', icon: 'tabler:api-app' },
  { id: 'MODULOS', label: 'Módulos Liberados', icon: 'tabler:puzzle' },
];

const SURFACE_LABEL: Record<string, string> = {
  B2C: 'Portal do assinante',
  PROVIDER_ADMIN: 'Painel do provedor',
  BOTH: 'Ambos',
};

const ProviderDetail = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('CADASTRO');
  const [provider, setProvider] = useState<ProviderDetailData | null>(null);
  const [overview, setOverview] = useState<ProviderOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cadastro
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [primaryColor, setPrimaryColor] = useState('#635BFF');
  const [secondaryColor, setSecondaryColor] = useState('#00C2A8');

  // Homologação ERP
  const [erpVendor, setErpVendor] = useState('VOALLE');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [syndata, setSyndata] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await apiGet<ProviderDetailData>(`/api/v1/providers/${id}`);
      setProvider(p);
      setName(p.name);
      setCompanyName(p.companyName ?? '');
      setCnpj(p.cnpj ?? '');
      setStatus(p.status);
      setPrimaryColor(p.primaryColor ?? '#635BFF');
      setSecondaryColor(p.secondaryColor ?? '#00C2A8');

      const grid = await apiGet<{ providers: ProviderOverview[] }>('/api/v1/platform/providers');
      setOverview(grid.providers?.find((x) => x.id === id) ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await apiPut(`/api/v1/providers/${id}`, {
        name,
        companyName,
        cnpj,
        status,
        primaryColor,
        secondaryColor,
      });
      setNotice('Dados cadastrais salvos.');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Testa as credenciais contra o ERP antes de gravar.
   *
   * Homologar é justamente isto: provar que o par credencial + endpoint responde. Salvar
   * uma integração sem testar produz um provedor "integrado" no papel cujo primeiro uso
   * real falha na frente do assinante.
   */
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await apiPost<{ status: string; latencyMs: number; productCount: number }>(
        '/api/v1/erp/test-connection',
        { endpointUrl, clientId, clientSecret, syndata }
      );
      setTestResult(
        `✅ Conectado em ${r.latencyMs}ms — ${r.productCount} serviço(s) retornado(s) pelo ERP.`
      );
    } catch (err: any) {
      setTestResult(`❌ ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const toggleModule = async (m: ModuleGrant) => {
    setError(null);
    setNotice(null);
    try {
      const r = await apiPut<{ message: string }>(
        `/api/v1/platform/providers/${id}/modules/${m.code}`,
        { enabled: !m.enabled }
      );
      setNotice(r.message);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <CardBox className="p-10 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        <p className="text-sm text-muted-foreground">Carregando provedor…</p>
      </CardBox>
    );
  }

  if (!provider) {
    return (
      <CardBox className="p-10 text-center space-y-3">
        <Icon icon="tabler:alert-triangle" width={40} className="mx-auto text-amber-500" />
        <h4 className="font-bold text-foreground">Provedor não encontrado</h4>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <Link to="/admin/providers" className="text-primary text-sm font-semibold">
          Voltar para a lista
        </Link>
      </CardBox>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com identidade e números reais do provedor */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/admin/providers')}
            className="shrink-0 h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted/20 transition-all"
            aria-label="Voltar para a lista de provedores"
          >
            <Icon icon="tabler:arrow-left" width={18} />
          </button>
          <div
            className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            {provider.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-bold text-foreground truncate">{provider.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">
              {provider.cnpj ? formatCnpj(provider.cnpj) : 'CNPJ não informado'} · /{provider.domain}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm shrink-0">
          <Metric label="Assinantes" value={overview?.subscriberCount ?? 0} />
          <Metric
            label="Inadimplentes"
            value={overview?.delinquentCount ?? 0}
            tone={(overview?.delinquentCount ?? 0) > 0 ? 'warn' : undefined}
          />
          <Metric label="Livros" value={overview?.bookCount ?? 0} />
          <Metric label="Revistas" value={overview?.magazineCount ?? 0} />
        </div>
      </div>

      {(error || notice) && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-2.5 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
          }`}
        >
          <Icon icon={error ? 'tabler:alert-triangle' : 'tabler:check'} width={18} className="shrink-0 mt-0.5" />
          <div>{error ?? notice}</div>
        </div>
      )}

      {/*
        Navegação em coluna, não em abas horizontais: a lista de seções cresce conforme
        a gestão do provedor ganha assuntos, e uma barra horizontal passa a exigir rolagem
        lateral — escondendo justamente os itens do fim.
      */}
      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-60 shrink-0" aria-label="Seções do provedor">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:sticky lg:top-24">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
                  tab === t.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-dark text-foreground border border-border hover:bg-muted/20'
                }`}
              >
                <Icon icon={t.icon} width={17} className="shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-6">

      {tab === 'CADASTRO' && (
        <form onSubmit={saveCadastro} className="space-y-6">
          <CardBox className="space-y-5">
            <SectionTitle icon="tabler:building" title="Identificação" subtitle="Razão social e documento do parceiro" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nome do Provedor" required>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Razão Social">
                <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
              <Field label="CNPJ" hint="Opcional — pode ser preenchido depois">
                <input
                  className={inputCls}
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              <Field label="Situação">
                <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">Ativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </Field>
            </div>
          </CardBox>

          <CardBox className="space-y-5">
            <SectionTitle
              icon="tabler:palette"
              title="White Label"
              subtitle="Cores aplicadas ao portal do assinante deste provedor"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Cor Primária">
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-lg border border-border bg-transparent cursor-pointer"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input className={inputCls} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </Field>
              <Field label="Cor Secundária">
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-lg border border-border bg-transparent cursor-pointer"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          </CardBox>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/providers')}
              className="px-5 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {tab === 'ERP' && (
        <div className="space-y-6">
          <CardBox className="space-y-5">
            <SectionTitle
              icon="tabler:api-app"
              title="Credenciais de Integração"
              subtitle="Dados do usuário integrador no ERP deste provedor"
            />

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <strong className="block mb-0.5">Onde obter estes dados</strong>
              No ERP do provedor, em <em>Suíte / Configurações / Usuários</em>, no usuário marcado como
              <strong> Integrador</strong>. O SynData vem de <em>Suíte / Configurações / Parâmetros</em>,
              menu Integração/Mapa.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Sistema ERP">
                <select className={inputCls} value={erpVendor} onChange={(e) => setErpVendor(e.target.value)}>
                  <option value="VOALLE">Voalle</option>
                  <option value="IXC">IXC Soft</option>
                  <option value="SGP">SGP</option>
                  <option value="HUBSOFT">HubSoft</option>
                </select>
              </Field>
              <Field label="Servidor (host)" hint="As portas 45700 e 45715 são anexadas pelo backend">
                <input
                  className={inputCls}
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://erp.provedor.com.br"
                />
              </Field>
              <Field label="Client Id">
                <input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </Field>
              <Field label="Client Secret" hint="Gravado cifrado; nunca é devolvido pela API">
                <input
                  type="password"
                  className={inputCls}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="SynData" hint="Token do tenant, específico deste provedor">
                  <textarea
                    className={`${inputCls} font-mono text-xs`}
                    rows={3}
                    value={syndata}
                    onChange={(e) => setSyndata(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {testResult && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-sm break-words">{testResult}</div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={testConnection}
                disabled={testing || !endpointUrl || !clientId}
                className="px-5 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted/20 disabled:opacity-50 flex items-center gap-2"
              >
                <Icon icon="tabler:plug-connected" width={16} />
                {testing ? 'Testando…' : 'Testar Conexão'}
              </button>
            </div>
          </CardBox>

          <CardBox className="space-y-4">
            <SectionTitle icon="tabler:heartbeat" title="Estado da Homologação" subtitle="Situação atual da integração" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow
                label="Integração cadastrada"
                value={overview?.hasErpIntegration ? 'Sim' : 'Não'}
                tone={overview?.hasErpIntegration ? 'ok' : 'warn'}
              />
              <InfoRow
                label="Última sincronização bem-sucedida"
                value={overview?.lastErpSyncAt ? new Date(overview.lastErpSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                tone={overview?.lastErpSyncAt ? 'ok' : 'warn'}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enquanto não houver integração cadastrada, os módulos que dependem do ERP permanecem bloqueados
              na aba Módulos Liberados.
            </p>
          </CardBox>
        </div>
      )}

      {tab === 'MODULOS' && (
        <CardBox className="space-y-5">
          <SectionTitle
            icon="tabler:puzzle"
            title="Módulos Liberados"
            subtitle="O que este provedor e os assinantes dele enxergam na plataforma"
          />

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground">
            O que for desligado aqui <strong>desaparece do acesso do provedor</strong> e do portal dos
            assinantes dele. É esta tabela que monta o menu do parceiro.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(overview?.modules ?? []).map((m) => {
              const blocked = m.requiresErp && !overview?.hasErpIntegration;
              return (
                <div
                  key={m.code}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    m.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/10'
                  }`}
                >
                  <Icon
                    icon={m.icon || 'tabler:puzzle'}
                    width={22}
                    className={`mt-0.5 shrink-0 ${m.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {SURFACE_LABEL[m.surface] ?? m.surface}
                      {m.requiresErp && ' · exige ERP'}
                    </p>
                    {blocked && (
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                        Homologue o ERP para liberar
                      </p>
                    )}
                    {m.expired && (
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Concessão expirada</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleModule(m)}
                    disabled={blocked && !m.enabled}
                    aria-pressed={m.enabled}
                    aria-label={`${m.enabled ? 'Desabilitar' : 'Habilitar'} ${m.name}`}
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
      )}
        </div>
      </div>
    </div>
  );
};

const inputCls =
  'w-full border border-border bg-white dark:bg-dark p-2.5 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary';

const Field = ({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3 border-b border-border pb-4">
    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon icon={icon} width={18} />
    </div>
    <div className="min-w-0">
      <h4 className="font-bold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) => (
  <div className="p-3 rounded-lg border border-border bg-muted/10">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
    <p className={`font-semibold ${tone === 'warn' ? 'text-amber-600' : tone === 'ok' ? 'text-emerald-600' : 'text-foreground'}`}>
      {value}
    </p>
  </div>
);

const Metric = ({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
    <p className={`font-bold text-lg ${tone === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>{value}</p>
  </div>
);

/** Formata o CNPJ só para exibição; o banco guarda apenas dígitos. */
function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default ProviderDetail;
