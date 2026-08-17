import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from 'src/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';

export interface B2BProvider {
  id: string;
  name: string;
  cnpj: string;
  subscribers: number;
  erp: string;
  status: boolean;
  onboardedAt: string;
  stage: 'lead' | 'contract' | 'sva_setup' | 'erp_homologation' | 'active';
  contactEmail: string;
  contactPhone: string;
}

const STAGE_LABELS: Record<B2BProvider['stage'], string> = {
  lead: '1. Lead / Prospecção',
  contract: '2. Contrato & Assinatura',
  sva_setup: '3. Mapeamento & SVA',
  erp_homologation: '4. Homologação ERP',
  active: '5. Produção (Ativo)',
};

const STAGE_ORDER: B2BProvider['stage'][] = ['lead', 'contract', 'sva_setup', 'erp_homologation', 'active'];

interface Props {
  provider: B2BProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (p: B2BProvider) => void;
}

export default function ProviderDetailDrawer({ provider, open, onOpenChange, onEdit }: Props) {
  if (!provider) return null;

  // Local state for tabs and test actions
  const [activeTab, setActiveTab] = useState('overview');
  const [isPingLoading, setIsPingLoading] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Mock API Credentials & Technical Config
  const erpEndpoint = `https://api.${provider.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br/v1`;
  const apiToken = `fk_live_${provider.id}_99283749182374918274`;
  const webhookSecret = `whsec_${provider.id}_a89d7f6e5w4q3e2r1t`;

  // Mock Financial & Plan Mapping Data
  const mrr = provider.subscribers * 12.90;
  const repasseFikta = provider.subscribers * 4.50;
  const marginNet = mrr - repasseFikta;

  // Mock SVA Plans
  const svaPlans = [
    { id: '1', broadbandPlan: '300 Mega Fibra Turbo', fiktaPackage: 'FIKTA Leitura Bronze', subscribers: Math.round(provider.subscribers * 0.45), pricePerSub: 'R$ 3,90', status: 'Ativo' },
    { id: '2', broadbandPlan: '500 Mega Fibra Gamer', fiktaPackage: 'FIKTA Leitura + Revistas Ouro', subscribers: Math.round(provider.subscribers * 0.35), pricePerSub: 'R$ 5,90', status: 'Ativo' },
    { id: '3', broadbandPlan: '1 Giga Ultra Fibra', fiktaPackage: 'FIKTA Família Diamante (E-books + Revistas + Audio)', subscribers: Math.round(provider.subscribers * 0.20), pricePerSub: 'R$ 8,90', status: 'Ativo' },
  ];

  // Mock B2C Subscribers
  const subscribersList = [
    { name: 'Ricardo Silva Santos', cpf: '123.***.***-89', plan: '500 Mega Fibra Gamer', statusConnection: 'ONLINE', latency: '12ms', lastAccess: 'Hoje, 14:22' },
    { name: 'Mariana Albuquerque Cruz', cpf: '987.***.***-10', plan: '1 Giga Ultra Fibra', statusConnection: 'ONLINE', latency: '14ms', lastAccess: 'Hoje, 13:05' },
    { name: 'Juliana Costa Martins', cpf: '456.***.***-33', plan: '300 Mega Fibra Turbo', statusConnection: 'OSCILANDO', latency: '48ms', lastAccess: 'Ontem, 21:40' },
    { name: 'Bruno Alves Ferreira', cpf: '321.***.***-55', plan: '500 Mega Fibra Gamer', statusConnection: 'OFFLINE', latency: '--', lastAccess: '10/08/2026' },
  ];

  // Mock Support Tickets
  const supportTickets = [
    { id: 'TK-8821', subject: 'Dúvida na Sincronia de Clientes Inadimplentes', priority: 'Média', status: 'Respondido', date: '11/08/2026' },
    { id: 'TK-7910', subject: 'Solicitação de Novo Banner Promocional para Fibra 1GB', priority: 'Baixa', status: 'Concluído', date: '04/08/2026' },
  ];

  const handleTestConnection = () => {
    setIsPingLoading(true);
    setPingSuccess(null);
    setTimeout(() => {
      setIsPingLoading(false);
      setPingSuccess(true);
    }, 1200);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl overflow-y-auto p-0 border-l border-slate-200 bg-slate-50/50"
      >
        <div className="sr-only">
          <SheetTitle>Gestão 360° - {provider.name}</SheetTitle>
          <SheetDescription>Painel completo de administração e parâmetros B2B do contratante</SheetDescription>
        </div>

        {/* TOP BRANDING BAR */}
        <div className="p-6 bg-gradient-to-r from-[#0B1D3A] via-[#0B1D3A] to-[#132a52] text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
            <Icon icon="tabler:building-broadcast-tower" width={240} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                {provider.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">{provider.name}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-0.5 rounded-full border ${
                    provider.status
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${provider.status ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {provider.status ? 'Licença Ativa (Em Produção)' : 'Licença Inativa'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-1 font-mono">
                  <span>CNPJ: {provider.cnpj}</span>
                  <span>•</span>
                  <span>ERP: <strong className="text-emerald-300">{provider.erp}</strong></span>
                  <span>•</span>
                  <span>Cadastrado em: {provider.onboardedAt}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => onEdit(provider)}
                className="bg-secondary hover:bg-secondary/90 text-[#0B1D3A] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <Icon icon="tabler:edit" width={16} />
                Editar Cadastro
              </button>
            </div>
          </div>

          {/* QUICK METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assinantes Ativos</span>
              <span className="text-xl font-black text-white mt-0.5 block">{provider.subscribers.toLocaleString('pt-BR')}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento BRUTO B2B</span>
              <span className="text-xl font-black text-emerald-300 mt-0.5 block">
                R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repasse FIKTA</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                R$ {repasseFikta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Etapa do Onboarding</span>
              <span className="text-xs font-bold text-cyan-300 mt-1 block truncate">{STAGE_LABELS[provider.stage]}</span>
            </div>
          </div>
        </div>

        {/* TABS CONTAINER */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm gap-1">
              <TabsTrigger value="overview" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:building" width={16} />
                Visão 360°
              </TabsTrigger>
              <TabsTrigger value="integration" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:api-app" width={16} />
                ERP & Credenciais
              </TabsTrigger>
              <TabsTrigger value="sva_mapping" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:sitemap" width={16} />
                Planos SVA
              </TabsTrigger>
              <TabsTrigger value="whitelabel" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:palette" width={16} />
                White-Label B2C
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:receipt-2" width={16} />
                Financeiro B2B
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:users-group" width={16} />
                Assinantes
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-3.5 py-2">
                <Icon icon="tabler:headset" width={16} />
                Chamados & SLA
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: VISÃO GERAL 360° */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados da Empresa */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Icon icon="tabler:building-store" width={18} className="text-primary" />
                      Dados Cadastrais & Jurídicos
                    </h4>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Razão Social:</span>
                      <span className="font-semibold text-slate-800">{provider.name} Telecomunicações LTDA</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">CNPJ:</span>
                      <span className="font-semibold text-slate-800 font-mono">{provider.cnpj}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Inscrição Estadual (IE):</span>
                      <span className="font-semibold text-slate-800 font-mono">109.882.773.110</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Regime Tributário:</span>
                      <span className="font-semibold text-slate-800">Simples Nacional / Lucro Presumido</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Endereço da Sede:</span>
                      <span className="font-semibold text-slate-800">Av. Paulista, 1000 - São Paulo/SP</span>
                    </div>
                  </div>
                </div>

                {/* Contatos & Responsáveis */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Icon icon="tabler:users-group" width={18} className="text-primary" />
                      Contatos & Responsáveis Principais
                    </h4>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Contato Comercial / Direção</span>
                        <span className="font-bold text-slate-800 block text-sm mt-0.5">{provider.contactEmail}</span>
                        <span className="text-slate-500">{provider.contactPhone}</span>
                      </div>
                      <a href={`mailto:${provider.contactEmail}`} className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all">
                        <Icon icon="tabler:mail" width={16} />
                      </a>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Suporte Técnico / NOC ISP</span>
                        <span className="font-bold text-slate-800 block text-sm mt-0.5">noc@{provider.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br</span>
                        <span className="text-slate-500">(11) 97000-8811</span>
                      </div>
                      <a href="tel:11970008811" className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all">
                        <Icon icon="tabler:phone" width={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onboarding Timeline Stepper */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Icon icon="tabler:stepper" width={18} className="text-primary" />
                  Evolução do Funil de Onboarding B2B
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {STAGE_ORDER.map((stageKey, idx) => {
                    const isDone = STAGE_ORDER.indexOf(provider.stage) >= idx;
                    const isCurrent = provider.stage === stageKey;

                    return (
                      <div
                        key={stageKey}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-lightprimary border-primary shadow-sm ring-2 ring-primary/20'
                            : isDone
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-white border-slate-100 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold text-xs mb-2 ${
                          isDone ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold block">{STAGE_LABELS[stageKey].split('. ')[1]}</span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {isCurrent ? 'Etapa Atual' : isDone ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: INTEGRAÇÃO ERP & CREDENCIAIS API */}
            <TabsContent value="integration" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Icon icon="tabler:api" width={18} className="text-primary" />
                      Parâmetros da Conexão com o ERP do Provedor
                    </h4>
                    <p className="text-xs text-slate-500">Chaves de API e Endpoints utilizados para sincronização de contratos e liberação de acesso aos e-books</p>
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={isPingLoading}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-60"
                  >
                    <Icon icon={isPingLoading ? "tabler:loader-2" : "tabler:plug-connected"} width={16} className={isPingLoading ? "animate-spin" : ""} />
                    {isPingLoading ? 'Testando Conexão...' : 'Testar Conexão ERP'}
                  </button>
                </div>

                {pingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <Icon icon="tabler:circle-check-filled" width={18} className="text-primary shrink-0" />
                    <span>Conexão bem sucedida com o ERP {provider.erp}! Latência: 18ms. Autenticação JWT válida.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Sistema ERP Selecionado</label>
                    <input
                      readOnly
                      value={provider.erp}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">URL / Endpoint Base de Integração</label>
                    <input
                      readOnly
                      value={erpEndpoint}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Chave API de Produção (Bearer Token FIKTA)</label>
                    <div className="relative flex items-center">
                      <input
                        readOnly
                        value={apiToken}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-800 pr-24"
                      />
                      <button
                        onClick={handleCopyToken}
                        className="absolute right-2 text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {copiedToken ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Segredo para Assinatura de Webhooks (HMAC)</label>
                    <input
                      readOnly
                      value={webhookSecret}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold text-emerald-400">Log da Última Sincronização Automática</span>
                    <span>12/08/2026 14:30:00 UTC</span>
                  </div>
                  <p className="text-emerald-300">GET {erpEndpoint}/contracts?status=active -&gt; HTTP 200 OK (233 contratos)</p>
                  <p className="text-slate-400">Sincronia efetuada em 0.42s. 0 falhas registradas.</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: MAPEAMENTO DE PLANOS SVA */}
            <TabsContent value="sva_mapping" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Icon icon="tabler:sitemap" width={18} className="text-primary" />
                      Planos de Banda Larga do Provedor x Pacotes de E-books FIKTA
                    </h4>
                    <p className="text-xs text-slate-500">Mapeamento dos pacotes promocionais atrelados à fatura de banda larga dos clientes do ISP</p>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all">
                    <Icon icon="tabler:plus" width={16} />
                    Vincular Novo Plano SVA
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Plano Fibra no ERP</th>
                        <th className="p-3">Pacote Digital FIKTA Inclusivo</th>
                        <th className="p-3">Base de Assinantes</th>
                        <th className="p-3">Repasse por Licença</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {svaPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3 font-bold text-slate-800">{plan.broadbandPlan}</td>
                          <td className="p-3 font-semibold text-primary">{plan.fiktaPackage}</td>
                          <td className="p-3 font-bold text-slate-800">{plan.subscribers} clientes</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{plan.pricePerSub} / mês</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              {plan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: WHITE-LABEL B2C */}
            <TabsContent value="whitelabel" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Icon icon="tabler:palette" width={18} className="text-primary" />
                    Personalização Visual do Super Portal B2C
                  </h4>
                  <p className="text-xs text-slate-500">Defina a identidade visual exibida aos assinantes finais do provedor {provider.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 block">Identidade Visual do Provedor</span>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg border border-slate-700">
                        {provider.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-slate-500 block">Logotipo Personalizado (PNG/SVG)</span>
                        <button className="mt-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-all">
                          Alterar Imagem de Logo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 block">Paleta de Cores Principais do B2C</span>
                    <p className="text-slate-500">Cor de destaque exibida no Super Portal do assinante deste provedor (independente da marca FIKTA).</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#F86D72] border border-white shadow-sm inline-block"></span>
                        <span className="font-mono text-slate-700 font-bold">#F86D72 (Cor do Provedor)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: FINANCEIRO B2B */}
            <TabsContent value="financial" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Icon icon="tabler:receipt-2" width={18} className="text-primary" />
                      Histórico de Faturamentos B2B com a FIKTA
                    </h4>
                    <p className="text-xs text-slate-500">Demonstrativo de faturas e repasse mensal referente às licenças de e-books consumidas</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Mês de Referência</th>
                        <th className="p-3">Licenças Ativas</th>
                        <th className="p-3">Valor Faturado FIKTA</th>
                        <th className="p-3">Status do Pagamento</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { ref: 'Agosto / 2026', subs: provider.subscribers, val: repasseFikta, status: 'Em Aberto (Venc: 20/08)' },
                        { ref: 'Julho / 2026', subs: Math.round(provider.subscribers * 0.95), val: repasseFikta * 0.95, status: 'Pago em 18/07' },
                        { ref: 'Junho / 2026', subs: Math.round(provider.subscribers * 0.90), val: repasseFikta * 0.90, status: 'Pago em 19/06' },
                      ].map((inv, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3 font-bold text-slate-800">{inv.ref}</td>
                          <td className="p-3 font-bold text-slate-700">{inv.subs} licenças</td>
                          <td className="p-3 font-mono font-bold text-emerald-700">
                            R$ {inv.val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              inv.status.includes('Pago')
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded-lg transition-all">
                              Baixar Segunda Via Boleto PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* TAB 6: ASSINANTES */}
            <TabsContent value="subscribers" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Icon icon="tabler:users-group" width={18} className="text-primary" />
                    Amostra de Assinantes B2C Sincronizados com o ERP
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Assinante B2C</th>
                        <th className="p-3">CPF</th>
                        <th className="p-3">Plano Banda Larga</th>
                        <th className="p-3">Sinal Fibra</th>
                        <th className="p-3">Latência</th>
                        <th className="p-3">Último Acesso Portal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subscribersList.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3 font-bold text-slate-800">{sub.name}</td>
                          <td className="p-3 font-mono text-slate-500">{sub.cpf}</td>
                          <td className="p-3 font-semibold text-slate-700">{sub.plan}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              sub.statusConnection === 'ONLINE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              sub.statusConnection === 'OSCILANDO' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              {sub.statusConnection}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">{sub.latency}</td>
                          <td className="p-3 text-slate-500">{sub.lastAccess}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* TAB 7: CHAMADOS & SLA */}
            <TabsContent value="tickets" className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Icon icon="tabler:headset" width={18} className="text-primary" />
                    Chamados de Suporte Registrados pelo Provedor
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Assunto / Motivo</th>
                        <th className="p-3">Prioridade</th>
                        <th className="p-3">Status SLA</th>
                        <th className="p-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supportTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-3 font-mono font-bold text-primary">{t.id}</td>
                          <td className="p-3 font-bold text-slate-800">{t.subject}</td>
                          <td className="p-3 font-semibold text-slate-700">{t.priority}</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{t.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
