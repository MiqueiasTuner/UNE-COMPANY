import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { useNavigate } from 'react-router';
import { apiGet, apiPost } from 'src/api/client';
import { useAutoRefresh } from 'src/hooks/useAutoRefresh';
import ProviderDetailDrawer from './providers/ProviderDetailDrawer';

interface B2BProvider {
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

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/providers
const initialProviders: B2BProvider[] = [];

/** Formato devolvido por GET /api/v1/providers. */
interface ApiProvider {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  createdAt: string | null;
  subscriberCount: number;
  hasErpIntegration: boolean;
  moduleCount: number;
}

const STAGES = [
  { id: 'lead', title: '1. Lead / Prospecção', color: 'border-t-blue-500 bg-blue-500/5 text-blue-600', icon: 'tabler:user-search' },
  { id: 'contract', title: '2. Contrato & Assinatura', color: 'border-t-amber-500 bg-amber-500/5 text-amber-600', icon: 'tabler:file-pencil' },
  { id: 'sva_setup', title: '3. Mapeamento & SVA', color: 'border-t-purple-500 bg-purple-500/5 text-purple-600', icon: 'tabler:adjustments-horizontal' },
  { id: 'erp_homologation', title: '4. Homologação ERP', color: 'border-t-cyan-500 bg-cyan-500/5 text-cyan-600', icon: 'tabler:api-app' },
  { id: 'active', title: '5. Produção (Ativo)', color: 'border-t-emerald-500 bg-emerald-500/5 text-emerald-600', icon: 'tabler:rocket' },
] as const;

const B2BProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<B2BProvider[]>(initialProviders);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Create Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [erp, setErp] = useState('Voalle ERP');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [initialStage, setInitialStage] = useState<B2BProvider['stage']>('lead');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<B2BProvider | null>(null);
  const [editName, setEditName] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editErp, setEditErp] = useState('Voalle ERP');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editStage, setEditStage] = useState<B2BProvider['stage']>('lead');
  const [editSubscribers, setEditSubscribers] = useState(0);

  // HTML5 Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Detail Drawer State
  const [detailProvider, setDetailProvider] = useState<B2BProvider | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = (p: B2BProvider) => {
    setDetailProvider(p);
    setIsDetailOpen(true);
  };

  /**
   * Carrega os provedores da API. `subscribers` vem contado no banco, não somado aqui —
   * é o número que a FIKTA usa para cobrar o provedor, então precisa ser o mesmo que
   * um SELECT devolveria.
   */
  const loadProviders = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await apiGet<{ providers: ApiProvider[] }>('/api/v1/providers');
      setProviders(
        (data.providers ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          cnpj: p.cnpj,
          subscribers: p.subscriberCount,
          erp: p.hasErpIntegration ? 'Integrado' : 'Sem integração',
          status: p.status === 'ACTIVE',
          onboardedAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—',
          // O funil de onboarding ainda não é persistido; até existir coluna própria,
          // derivamos o mínimo verificável em vez de inventar um estágio.
          stage: p.status === 'ACTIVE' ? 'active' : 'lead',
          contactEmail: '—',
          contactPhone: '—',
        }))
      );
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Mantém a lista viva sem F5.
  useAutoRefresh(loadProviders, 30_000);

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cnpj) return;

    setApiError(null);
    try {
      await apiPost('/api/v1/providers', {
        name,
        cnpj,
        status: initialStage === 'active' ? 'ACTIVE' : 'SUSPENDED',
      });
      // Relê do servidor: o backend recusa CNPJ duplicado e normaliza o domínio, então
      // o estado autoritativo é o dele, não o que montaríamos aqui.
      await loadProviders();
      setName('');
      setCnpj('');
      setContactEmail('');
      setContactPhone('');
      setInitialStage('lead');
      setIsModalOpen(false);
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const toggleStatus = (id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, status: !p.status } : p));
  };

  const moveStage = (id: string, newStage: B2BProvider['stage']) => {
    setProviders(providers.map(p => {
      if (p.id === id) {
        return {
          ...p,
          stage: newStage,
          status: newStage === 'active' ? true : p.status
        };
      }
      return p;
    }));
  };

  const openEditModal = (p: B2BProvider) => {
    setEditingProvider(p);
    setEditName(p.name);
    setEditCnpj(p.cnpj);
    setEditErp(p.erp);
    setEditContactEmail(p.contactEmail);
    setEditContactPhone(p.contactPhone);
    setEditStage(p.stage);
    setEditSubscribers(p.subscribers);
    setIsEditModalOpen(true);
  };

  const handleUpdateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    setProviders(providers.map(p => {
      if (p.id === editingProvider.id) {
        return {
          ...p,
          name: editName,
          cnpj: editCnpj,
          erp: editErp,
          contactEmail: editContactEmail,
          contactPhone: editContactPhone,
          stage: editStage,
          subscribers: editSubscribers,
          status: editStage === 'active' ? true : p.status
        };
      }
      return p;
    }));
    setIsEditModalOpen(false);
    setEditingProvider(null);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = (colId: string) => {
    if (draggedId) {
      moveStage(draggedId, colId as B2BProvider['stage']);
      setDraggedId(null);
      setDragOverColId(null);
    }
  };

  const totalSubscribers = providers.reduce((sum, p) => sum + p.subscribers, 0);

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 flex items-start gap-2.5">
          <Icon icon="tabler:alert-triangle" width={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">{apiError}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Gestão de Provedores B2B</h3>
          <p className="text-sm text-muted-foreground">Monitore o onboarding e a integração técnica dos parceiros ISPs</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex bg-muted/10 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="tabler:list" width={16} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="tabler:columns" width={16} />
              Kanban Onboarding
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm ml-auto sm:ml-0"
          >
            <Icon icon="tabler:plus" width={18} />
            Cadastrar Contratante
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardBox className="p-4 flex items-center justify-between border border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Provedores Parceiros</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">{providers.length}</h4>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Icon icon="tabler:network" width={24} />
          </div>
        </CardBox>
        <CardBox className="p-4 flex items-center justify-between border border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Em Homologação / Setup</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">
              {providers.filter(p => p.stage !== 'active' && p.stage !== 'lead').length}
            </h4>
          </div>
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-500">
            <Icon icon="tabler:settings-automation" width={24} />
          </div>
        </CardBox>
        <CardBox className="p-4 flex items-center justify-between border border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Assinantes Ativos</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">{totalSubscribers}</h4>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500">
            <Icon icon="tabler:users" width={24} />
          </div>
        </CardBox>
        <CardBox className="p-4 flex items-center justify-between border border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Taxa de Onboarding</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">
              {providers.length ? Math.round((providers.filter(p => p.stage === 'active').length / providers.length) * 100) : 0}%
            </h4>
          </div>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-500">
            <Icon icon="tabler:progress" width={24} />
          </div>
        </CardBox>
      </div>

      {/* Main View Mode Selector Content */}
      {viewMode === 'list' ? (
        <CardBox>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  <th className="p-4 font-semibold text-muted-foreground">Provedor (ISP)</th>
                  <th className="p-4 font-semibold text-muted-foreground">CNPJ</th>
                  <th className="p-4 font-semibold text-muted-foreground">Fase Onboarding</th>
                  <th className="p-4 font-semibold text-muted-foreground">Integração ERP</th>
                  <th className="p-4 font-semibold text-muted-foreground">Assinantes</th>
                  <th className="p-4 font-semibold text-muted-foreground">Status SVA</th>
                  <th className="p-4 font-semibold text-muted-foreground">Data Onboarding</th>
                  <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="border-b border-border hover:bg-muted/5 transition-all cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.contactEmail}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.cnpj}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.stage === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' :
                        p.stage === 'erp_homologation' ? 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600' :
                        p.stage === 'sva_setup' ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600' :
                        p.stage === 'contract' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600' :
                        'bg-blue-100 dark:bg-blue-950/50 text-blue-600'
                      }`}>
                        <Icon icon={
                          p.stage === 'active' ? 'tabler:rocket' :
                          p.stage === 'erp_homologation' ? 'tabler:api-app' :
                          p.stage === 'sva_setup' ? 'tabler:adjustments-horizontal' :
                          p.stage === 'contract' ? 'tabler:file-pencil' : 'tabler:user-search'
                        } width={14} />
                        {STAGES.find(s => s.id === p.stage)?.title.split('. ')[1]}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-lightprimary text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.erp}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground">{p.subscribers}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${
                        p.status ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${p.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {p.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.onboardedAt}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/providers/${p.id}`); }}
                        className="text-muted-foreground hover:text-primary transition-all p-1"
                        title="Editar Contratante"
                      >
                        <Icon icon="tabler:edit" width={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(p.id); }}
                        className="text-muted-foreground hover:text-primary transition-all p-1"
                        title={p.status ? 'Desativar Licença SVA' : 'Ativar Licença SVA'}
                      >
                        <Icon icon={p.status ? 'tabler:circle-dot' : 'tabler:circle'} width={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBox>
      ) : (
        /* Kanban View with HTML5 Drag & Drop */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const stageProviders = providers.filter(p => p.stage === col.id);
            const isOver = dragOverColId === col.id;

            return (
              <div 
                key={col.id} 
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(col.id)}
                className={`min-w-[260px] flex flex-col bg-muted/5 rounded-xl border overflow-hidden transition-all duration-200 ${
                  isOver ? 'border-primary border-2 bg-primary/5 shadow-inner' : 'border-border/80'
                }`}
              >
                {/* Column Title */}
                <div className={`p-3 border-t-4 border-b border-border flex items-center justify-between font-bold text-sm ${col.color}`}>
                  <span className="flex items-center gap-1.5">
                    <Icon icon={col.icon} width={18} />
                    {col.title.split('. ')[1]}
                  </span>
                  <span className="bg-foreground/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">
                    {stageProviders.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[400px]">
                  {stageProviders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 text-center border-2 border-dashed border-border/50 rounded-lg">
                      <Icon icon="tabler:folder-open" width={24} className="opacity-40" />
                      <p className="text-[11px] mt-1">Arraste cards para cá</p>
                    </div>
                  ) : (
                    stageProviders.map((isp) => (
                      <div
                        key={isp.id}
                        draggable
                        onDragStart={() => handleDragStart(isp.id)}
                        onClick={() => openDetail(isp)}
                        className="bg-white dark:bg-dark p-3.5 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/45 transition-all space-y-3 relative group cursor-pointer active:cursor-grabbing"
                      >
                        {/* Provider Detail & Edit Button */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h6 className="font-extrabold text-foreground text-sm line-clamp-1">{isp.name}</h6>
                            <span className="text-[10px] text-muted-foreground font-mono">{isp.cnpj}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/providers/${isp.id}`); }}
                            className="text-muted-foreground hover:text-primary p-1 rounded-md transition-all shrink-0 hover:bg-muted/10"
                            title="Editar Contratante"
                          >
                            <Icon icon="tabler:edit" width={14} />
                          </button>
                        </div>

                        {/* Integration Badge */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Icon icon="tabler:device-laptop" width={14} />
                            {isp.erp}
                          </span>
                          {isp.subscribers > 0 && (
                            <span className="font-bold text-primary flex items-center gap-1">
                              <Icon icon="tabler:users" width={14} />
                              {isp.subscribers}
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg space-y-1">
                          <div className="flex items-center gap-1">
                            <Icon icon="tabler:mail" width={12} />
                            <span className="truncate">{isp.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon icon="tabler:phone" width={12} />
                            <span>{isp.contactPhone}</span>
                          </div>
                        </div>

                        {/* Actions to move stage (Keyboard access and status check) */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/60">
                          <button
                            disabled={col.id === 'lead'}
                            onClick={(e) => {
                              e.stopPropagation();
                              const index = STAGES.findIndex(s => s.id === col.id);
                              if (index > 0) moveStage(isp.id, STAGES[index - 1].id);
                            }}
                            className="p-1 hover:bg-muted/10 text-muted-foreground disabled:opacity-30 rounded transition-all"
                            title="Mover Anterior"
                          >
                            <Icon icon="tabler:chevron-left" width={16} />
                          </button>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isp.status ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                          }`}>
                            {isp.status ? 'Ativo' : 'Inativo'}
                          </span>

                          <button
                            disabled={col.id === 'active'}
                            onClick={(e) => {
                              e.stopPropagation();
                              const index = STAGES.findIndex(s => s.id === col.id);
                              if (index < STAGES.length - 1) moveStage(isp.id, STAGES[index + 1].id);
                            }}
                            className="p-1 hover:bg-muted/10 text-muted-foreground disabled:opacity-30 rounded transition-all text-primary"
                            title="Mover Próximo"
                          >
                            <Icon icon="tabler:chevron-right" width={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Cadastrar Novo Contratante</h4>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome do Provedor *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TechNet Telecom"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">CNPJ *</label>
                <input
                  type="text"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contato@isp.com.br"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Telefone Comercial</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Integração ERP</label>
                  <select
                    value={erp}
                    onChange={(e) => setErp(e.target.value)}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="Voalle ERP">Voalle ERP</option>
                    <option value="IXC Soft">IXC Soft</option>
                    <option value="SGP">SGP</option>
                    <option value="HubSoft">HubSoft</option>
                    <option value="MK Solutions">MK Solutions</option>
                    <option value="Webhooks API">Webhooks API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Etapa Inicial</label>
                  <select
                    value={initialStage}
                    onChange={(e) => setInitialStage(e.target.value as B2BProvider['stage'])}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="lead">1. Lead / Prospecção</option>
                    <option value="contract">2. Contrato & Assinatura</option>
                    <option value="sva_setup">3. Mapeamento & SVA</option>
                    <option value="erp_homologation">4. Homologação ERP</option>
                    <option value="active">5. Produção (Ativo)</option>
                  </select>
                </div>
              </div>

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
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  Criar Contratante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {isEditModalOpen && editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Editar Contratante: {editingProvider.name}</h4>
            <form onSubmit={handleUpdateProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome do Provedor *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">CNPJ *</label>
                <input
                  type="text"
                  required
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Telefone Comercial</label>
                  <input
                    type="text"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Assinantes Ativos</label>
                  <input
                    type="number"
                    value={editSubscribers}
                    onChange={(e) => setEditSubscribers(Number(e.target.value))}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Integração ERP</label>
                  <select
                    value={editErp}
                    onChange={(e) => setEditErp(e.target.value)}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="Voalle ERP">Voalle ERP</option>
                    <option value="IXC Soft">IXC Soft</option>
                    <option value="SGP">SGP</option>
                    <option value="HubSoft">HubSoft</option>
                    <option value="MK Solutions">MK Solutions</option>
                    <option value="Webhooks API">Webhooks API</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Fase Onboarding</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as B2BProvider['stage'])}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="lead">1. Lead / Prospecção</option>
                  <option value="contract">2. Contrato & Assinatura</option>
                  <option value="sva_setup">3. Mapeamento & SVA</option>
                  <option value="erp_homologation">4. Homologação ERP</option>
                  <option value="active">5. Produção (Ativo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProvider(null);
                  }}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360° Management Detail Drawer */}
      <ProviderDetailDrawer
        provider={detailProvider}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={(p) => navigate(`/admin/providers/${p.id}`)}
      />
    </div>
  );
};

export default B2BProviders;
