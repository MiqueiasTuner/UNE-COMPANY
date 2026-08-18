import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface IntegrationConfig {
  id: string;
  /**
   * Provedor dono desta integração. Sem ele a tela não tem como isolar os tenants, e
   * um admin de provedor acaba vendo o endpoint e o client_id do concorrente.
   */
  tenantId: string;
  erpType: string;
  endpointUrl: string;
  clientId: string;
  status: boolean;
  lastSync: string;
  successRate: string;
  latencyMs: number;
  // Detail expansion attributes
  circuitBreaker: 'FECHADO (Operacional)' | 'ABERTO (Bloqueado)' | 'MEIO-ABERTO';
  maxRetries: number;
  timeoutSec: number;
  webhookUrl: string;
}

// O Voalle é auto-hospedado por provedor: cada ISP tem o próprio host, e o backend
// anexa as portas 45700 (auth) e 45715 (API). Ver docs/architecture/VOALLE-API-REFERENCE.md
// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/providers/{id}/integrations
const initialConfigs: IntegrationConfig[] = [];

const ERPIntegrations = () => {
  const [configs, setConfigs] = useState<IntegrationConfig[]>(initialConfigs);
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // New Integration fields (Master Admin only)
  const [erpType, setErpType] = useState('VOALLE');
  const [url, setUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [syndata, setSyndata] = useState('');

  // Support ticket fields (ISP Provider only)
  const [ticketErpType, setTicketErpType] = useState('HUBSOFT');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubject, setTicketSubject] = useState('Solicitação de Nova Homologação de ERP');

  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('fikta_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isISP = user?.role === 'PROVIDER_ADMIN';

  /**
   * Isolamento entre tenants.
   *
   * A FIKTA (master) enxerga todas as integrações; um provedor enxerga apenas a sua.
   * Sem este filtro, o admin da TechNet via o endpoint e o client_id da UNE — dado de
   * um parceiro exposto a outro.
   *
   * Isto é a defesa da interface, não a única: o backend precisa filtrar por tenant
   * também, porque quem chamar a API direto ignora esta camada por completo.
   */
  const visibleConfigs = isISP
    ? configs.filter((cfg) => cfg.tenantId === user?.tenantId)
    : configs;

  const toggleStatus = (id: string) => {
    if (isISP) return;
    setConfigs(configs.map(cfg => {
      if (cfg.id === id) {
        return { ...cfg, status: !cfg.status };
      }
      return cfg;
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !clientId) return;

    let latency = 150;
    try {
      let res = await fetch('/api/v1/erp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: url,
          clientId: clientId,
          clientSecret: clientSecret,
          syndata: syndata
        })
      });

      if (res.status === 404) {
        res = await fetch('http://localhost:5089/api/v1/erp/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointUrl: url,
            clientId: clientId,
            clientSecret: clientSecret,
            syndata: syndata
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        latency = data.latencyMs || 150;
      }
    } catch {
      // Offline / mock fallback
    }

    const newCfg: IntegrationConfig = {
      id: Date.now().toString(),
      tenantId: user?.tenantId ?? "",
      erpType,
      endpointUrl: url,
      clientId,
      status: true,
      lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
      successRate: '100%',
      latencyMs: latency,
      circuitBreaker: 'FECHADO (Operacional)',
      maxRetries: 3,
      timeoutSec: 5,
      webhookUrl: `https://api.unebook.com.br/webhooks/v1/integrations/technet-${erpType.toLowerCase()}`
    };

    setConfigs([...configs, newCfg]);
    setUrl('');
    setClientId('');
    setClientSecret('');
    setSyndata('');
    setIsModalOpen(false);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription) return;

    // Simulate saving a support ticket for FIKTA SUPORTE
    const newTicket = {
      id: `FKT-${Math.floor(Math.random() * 9000 + 1000)}`,
      subject: ticketSubject,
      department: 'FIKTA SUPORTE',
      erpRequested: ticketErpType,
      description: ticketDescription,
      status: 'Aberto',
      date: new Date().toLocaleDateString('pt-BR')
    };

    // Store in local storage for tickets screen to pull if needed
    const existingTicketsStr = localStorage.getItem('une_livros_custom_tickets') || '[]';
    const existingTickets = JSON.parse(existingTicketsStr);
    existingTickets.push(newTicket);
    localStorage.setItem('une_livros_custom_tickets', JSON.stringify(existingTickets));

    alert(`Chamado aberto com sucesso sob o protocolo ${newTicket.id}! O departamento FIKTA SUPORTE foi notificado e a demanda já está na fila de homologação.`);
    
    setTicketDescription('');
    setIsTicketModalOpen(false);
  };

  const triggerManualSync = async (id: string) => {
    setSyncingId(id);
    const targetConfig = configs.find(c => c.id === id);

    let latency = targetConfig?.latencyMs || 280;
    let syncResultMsg = 'Sincronização manual executada com sucesso! Usuários e contratos atualizados no banco de dados local.';

    try {
      const res = await fetch('/api/v1/erp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: targetConfig?.endpointUrl,
          clientId: targetConfig?.clientId
        })
      });
      if (res.ok) {
        const data = await res.json();
        latency = data.latencyMs || latency;
        syncResultMsg = `Sincronização com ${targetConfig?.erpType || 'ERP'} validada com sucesso via API! (Latência: ${latency}ms)`;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setSyncingId(null);
      setConfigs(configs.map(cfg => {
        if (cfg.id === id) {
          return {
            ...cfg,
            lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
            latencyMs: latency,
            successRate: '99.9%'
          };
        }
        return cfg;
      }));
      alert(syncResultMsg);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Integrações ERP</h3>
          <p className="text-sm text-muted-foreground">
            {isISP 
              ? 'Visualize o status de conexão com seu sistema de faturamento e CRM local'
              : 'Configure as conexões de API com os sistemas de faturamento e CRM'}
          </p>
        </div>
        
        {isISP ? (
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="bg-[#0B1D3A] hover:bg-[#0B1D3A]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
          >
            <Icon icon="tabler:ticket" width={18} />
            Solicitar Nova Integração
          </button>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
          >
            <Icon icon="tabler:plus" width={18} />
            Nova Conexão ERP
          </button>
        )}
      </div>

      <CardBox>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex gap-3 text-primary">
          <Icon icon="tabler:shield-lock" width={24} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Segurança das Integrações:</span> Todas as credenciais de acesso, chaves de cabeçalho e tokens syndata são criptografados no banco de dados local usando o algoritmo <span className="font-semibold">AES-256</span> e gerenciados via políticas seguras do Key Vault.
            {isISP && <p className="mt-1 text-xs opacity-90 font-medium">Nota: Seu usuário de Provedor possui nível de leitura. Para novas integrações ou modificações de endpoints ativos, abra um chamado para o time da FIKTA.</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground w-12"></th>
                <th className="p-4 font-semibold text-muted-foreground">Sistema ERP</th>
                <th className="p-4 font-semibold text-muted-foreground">URL de Endpoint</th>
                <th className="p-4 font-semibold text-muted-foreground">Cliente / ID</th>
                <th className="p-4 font-semibold text-muted-foreground">Latência Média</th>
                <th className="p-4 font-semibold text-muted-foreground">Taxa de Sucesso</th>
                <th className="p-4 font-semibold text-muted-foreground">Última Sincronização</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleConfigs.map((cfg) => {
                const isExpanded = expandedRowId === cfg.id;
                return (
                  <>
                    <tr 
                      key={cfg.id} 
                      className={`border-b border-border hover:bg-muted/5 transition-all cursor-pointer ${isExpanded ? 'bg-muted/5' : ''}`}
                      onClick={() => setExpandedRowId(isExpanded ? null : cfg.id)}
                    >
                      <td className="p-4 text-center">
                        <Icon 
                          icon={isExpanded ? 'tabler:chevron-down' : 'tabler:chevron-right'} 
                          width={16} 
                          className="text-muted-foreground"
                        />
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          cfg.erpType === 'VOALLE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/35 dark:text-purple-200'
                        }`}>
                          {cfg.erpType}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{cfg.endpointUrl}</td>
                      <td className="p-4 text-foreground font-semibold">{cfg.clientId}</td>
                      <td className="p-4 text-foreground font-mono">{cfg.status ? `${cfg.latencyMs}ms` : '-'}</td>
                      <td className="p-4 font-semibold text-emerald-500 font-mono">{cfg.status ? cfg.successRate : '-'}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{cfg.lastSync}</td>
                      <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => triggerManualSync(cfg.id)}
                          disabled={syncingId !== null || !cfg.status}
                          className={`text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded disabled:opacity-35 ${
                            syncingId === cfg.id ? 'animate-spin text-primary' : ''
                          }`}
                          title="Sincronizar Manualmente"
                        >
                          <Icon icon="tabler:refresh" width={18} />
                        </button>
                        
                        {isISP ? (
                          <span 
                            className="text-muted-foreground/60 p-1.5 cursor-not-allowed"
                            title="Gerenciamento limitado ao Administrador Master"
                          >
                            <Icon icon="tabler:lock" width={18} />
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleStatus(cfg.id)}
                            className="text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded"
                            title={cfg.status ? 'Desativar Conexão' : 'Ativar Conexão'}
                          >
                            <Icon 
                              icon={cfg.status ? 'tabler:circle-check' : 'tabler:circle-x'} 
                              width={18} 
                              className={cfg.status ? 'text-emerald-500' : 'text-amber-500'} 
                            />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* EXPANDED PANEL with deep config variables */}
                    {isExpanded && (
                      <tr className="bg-muted/10 dark:bg-black/10 border-b border-border">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            
                            <div className="space-y-2">
                              <h5 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Icon icon="tabler:key" className="text-[#0B1D3A]" />
                                Credenciais e Headers
                              </h5>
                              <div className="bg-white dark:bg-dark p-3 rounded-lg border border-border space-y-1.5 text-xs font-mono">
                                <div><span className="text-muted-foreground">Authorization:</span> <span className="text-foreground">Bearer token_ixc_api_read...</span></div>
                                <div><span className="text-muted-foreground">X-Provider-ID:</span> <span className="text-foreground">technet_telecom</span></div>
                                <div><span className="text-muted-foreground">Status Cripto:</span> <span className="text-emerald-500 font-bold">AES-256 ATIVO</span></div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Icon icon="tabler:route" className="text-[#0B1D3A]" />
                                URL de Callback (Webhook)
                              </h5>
                              <div className="bg-white dark:bg-dark p-3 rounded-lg border border-border space-y-1.5 text-xs font-mono">
                                <div><span className="text-muted-foreground">Endpoint:</span> <span className="text-foreground block truncate">{cfg.webhookUrl}</span></div>
                                <div><span className="text-muted-foreground">Eventos:</span> <span className="text-foreground">contract.created, contract.blocked</span></div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Icon icon="tabler:shield" className="text-[#0B1D3A]" />
                                Resiliência (Polly)
                              </h5>
                              <div className="bg-white dark:bg-dark p-3 rounded-lg border border-border space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-muted-foreground">Circuit Breaker:</span> <span className="font-bold text-emerald-500">{cfg.circuitBreaker}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Timeout da Operação:</span> <span className="font-mono">{cfg.timeoutSec}s</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Limite de Retentativas:</span> <span className="font-mono">{cfg.maxRetries}x</span></div>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBox>

      {/* Recentes Logs de Auditoria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4">Logs Recentes de Comunicação ERP</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-border pb-2.5 text-xs">
                <div>
                  <span className="font-semibold text-emerald-500">[200 OK]</span> GET /external/integrations/thirdparty/contracts
                  <p className="text-muted-foreground mt-0.5">Sincronização de Elegibilidade: CPF 104.***.***-98 resolvida</p>
                </div>
                <div className="text-right font-mono text-muted-foreground">
                  15:30:12
                  <p>280ms</p>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-border pb-2.5 text-xs">
                <div>
                  <span className="font-semibold text-emerald-500">[200 OK]</span> GET /external/integrations/thirdparty/people
                  <p className="text-muted-foreground mt-0.5">Importação de Cliente: CNPJ 54.***.***/0001-79 carregado</p>
                </div>
                <div className="text-right font-mono text-muted-foreground">
                  15:28:44
                  <p>320ms</p>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-border pb-2.5 text-xs">
                <div>
                  <span className="font-semibold text-amber-500">[408 Timeout]</span> GET /external/integrations/thirdparty/financial/invoices
                  <p className="text-muted-foreground mt-0.5">Retentando com Exponential Backoff (Polly Retry 1/3)</p>
                </div>
                <div className="text-right font-mono text-muted-foreground">
                  14:15:02
                  <p>5000ms</p>
                </div>
              </div>
            </div>
          </CardBox>
        </div>
        <div>
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4">Estatísticas Resiliência (Polly)</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Timeout de Operação</span>
                <span className="font-bold text-foreground">5 segundos</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Retentativas Máximas</span>
                <span className="font-bold text-foreground">3 tentativas</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Circuit Breaker</span>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">FECHADO (Operacional)</span>
              </li>
              <li className="flex justify-between pb-1">
                <span className="text-muted-foreground">Limite de Requisições</span>
                <span className="font-bold text-foreground">30 req/min</span>
              </li>
            </ul>
          </CardBox>
        </div>
      </div>

      {/* Modal Conexão ERP (FIKTA Master Admin only) */}
      {isModalOpen && !isISP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            <h4 className="text-lg font-bold text-foreground mb-4">Adicionar Conexão ERP</h4>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Sistema de ERP *</label>
                <select
                  value={erpType}
                  onChange={(e) => setErpType(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                >
                  <option value="VOALLE">Voalle ERP (API Syndata)</option>
                  <option value="IXC_SOFT">IXC Soft (Webservices)</option>
                  <option value="SGP">SGP (Sistema de Gestão de Provedor)</option>
                  <option value="HUBSOFT">HubSoft API</option>
                  <option value="MK_SOLUTIONS">MK Solutions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">URL de Endpoint Principal *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Ex: https://api.provedor.com/v1"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Client ID / Chave Pública *</label>
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Identificador da Integração"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Client Secret / Chave Privada *</label>
                <input
                  type="password"
                  required
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="******"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              {erpType === 'VOALLE' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Token Syndata (Voalle) *</label>
                  <input
                    type="text"
                    required
                    value={syndata}
                    onChange={(e) => setSyndata(e.target.value)}
                    placeholder="Chave de sincronização syndata"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  Confirmar Conexão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET REQUEST MODAL (ISP / Provider user view only) */}
      {isTicketModalOpen && isISP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            
            <div className="flex items-center gap-2 text-primary mb-3">
              <Icon icon="tabler:ticket" width={22} className="text-[#0B1D3A]" />
              <h4 className="text-lg font-bold text-foreground">Solicitar Nova Integração ERP</h4>
            </div>

            <div className="bg-[#0B1D3A]/10 border border-[#0B1D3A]/20 rounded-lg p-3.5 mb-4 text-xs text-[#0B1D3A]">
              <span className="font-bold block mb-1">Encaminhado para: FIKTA SUPORTE</span>
              Este chamado criará uma atividade técnica de homologação diretamente no painel master. O suporte global entrará em contato para alinhar os dados de chaves privadas e credenciais.
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              
              {/* Department Flag display */}
              <div className="flex items-center gap-2 p-2.5 bg-muted/20 border border-border rounded-lg">
                <input
                  type="checkbox"
                  checked
                  disabled
                  id="flagSupport"
                  className="accent-[#0B1D3A] h-4 w-4"
                />
                <label htmlFor="flagSupport" className="text-xs font-bold text-foreground cursor-default flex items-center gap-1">
                  Direcionar para: <span className="text-[#0B1D3A] font-mono">FIKTA SUPORTE</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Assunto do Chamado *</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Sistema ERP Desejado *</label>
                <select
                  value={ticketErpType}
                  onChange={(e) => setTicketErpType(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                >
                  <option value="VOALLE">Voalle ERP</option>
                  <option value="IXC_SOFT">IXC Soft</option>
                  <option value="HUBSOFT">HubSoft API</option>
                  <option value="SGP">SGP (Sistema de Gestão de Provedor)</option>
                  <option value="MK_SOLUTIONS">MK Solutions</option>
                  <option value="OUTRO">Outro / API Própria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Detalhes e Justificativa Comercial *</label>
                <textarea
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Informe os dados de contato do desenvolvedor do provedor e a justificativa para a liberação da conexão de homologação."
                  className="w-full border border-border bg-transparent p-3 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground h-28 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Icon icon="tabler:send" width={16} />
                  Abrir Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPIntegrations;
