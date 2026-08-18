import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface PartnerStore {
  id: string;
  name: string;
  category: string;
  benefitText: string;
  couponCode: string;
  status: boolean;
  logoColor: string;
  // Detail expansion attributes
  views: number;
  redemptions: number;
  redirectUrl: string;
  terms: string;
}

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/partner-stores
const initialStores: PartnerStore[] = [];

const PartnerStores = () => {
  const [stores, setStores] = useState<PartnerStore[]>(initialStores);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  
  // Create Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Saúde & Farmácia');
  const [benefit, setBenefit] = useState('');
  const [coupon, setCoupon] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [terms, setTerms] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<PartnerStore | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Saúde & Farmácia');
  const [editBenefit, setEditBenefit] = useState('');
  const [editCoupon, setEditCoupon] = useState('');
  const [editRedirectUrl, setEditRedirectUrl] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editStatus, setEditStatus] = useState(true);

  const toggleStatus = (id: string) => {
    setStores(stores.map(store => {
      if (store.id === id) {
        return { ...store, status: !store.status };
      }
      return store;
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !benefit || !coupon) return;

    const newStore: PartnerStore = {
      id: Date.now().toString(),
      name,
      category,
      benefitText: benefit,
      couponCode: coupon.toUpperCase(),
      status: true,
      logoColor: 'bg-primary text-white',
      views: 0,
      redemptions: 0,
      redirectUrl: redirectUrl || 'https://unebook.com.br/clube',
      terms: terms || 'Consulte regras de frete e elegibilidade do cupom no site do parceiro.'
    };

    setStores([...stores, newStore]);
    setName('');
    setBenefit('');
    setCoupon('');
    setRedirectUrl('');
    setTerms('');
    setIsModalOpen(false);
  };

  const openEditModal = (store: PartnerStore) => {
    setEditingStore(store);
    setEditName(store.name);
    setEditCategory(store.category);
    setEditBenefit(store.benefitText);
    setEditCoupon(store.couponCode);
    setEditRedirectUrl(store.redirectUrl);
    setEditTerms(store.terms);
    setEditStatus(store.status);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    setStores(stores.map(store => {
      if (store.id === editingStore.id) {
        return {
          ...store,
          name: editName,
          category: editCategory,
          benefitText: editBenefit,
          couponCode: editCoupon.toUpperCase(),
          redirectUrl: editRedirectUrl,
          terms: editTerms,
          status: editStatus
        };
      }
      return store;
    }));

    setIsEditModalOpen(false);
    setEditingStore(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta loja parceira do clube de vantagens?')) {
      setStores(stores.filter(store => store.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Lojas Parceiras & Convênios</h3>
          <p className="text-sm text-muted-foreground">Gerencie o Clube de Vantagens oferecido aos seus clientes integrados</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
        >
          <Icon icon="tabler:plus" width={18} />
          Nova Parceria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((store) => {
          const isExpanded = expandedStoreId === store.id;
          const convRate = store.views > 0 ? ((store.redemptions / store.views) * 100).toFixed(1) : '0';

          return (
            <CardBox 
              key={store.id} 
              className={`relative overflow-hidden transition-all border ${
                isExpanded ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.01]' : 'border-border hover:border-primary/40'
              }`}
            >
              <div 
                className="cursor-pointer p-5"
                onClick={() => setExpandedStoreId(isExpanded ? null : store.id)}
              >
                <div className="flex gap-4">
                  <div className={`h-16 w-16 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0 ${store.logoColor}`}>
                    {store.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {store.category}
                      </span>
                      
                      {/* Inline Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(store)}
                          className="text-muted-foreground hover:text-primary transition-all p-1 hover:bg-muted/10 rounded"
                          title="Editar Convênio"
                        >
                          <Icon icon="tabler:edit" width={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(store.id)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            store.status ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20' : 'bg-muted border-border text-muted-foreground'
                          }`}
                          title="Alternar Status"
                        >
                          {store.status ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="text-red-500 hover:text-red-600 transition-all p-1 hover:bg-muted/10 rounded"
                          title="Excluir Parceria"
                        >
                          <Icon icon="tabler:trash" width={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold text-foreground truncate flex items-center gap-1.5">
                      {store.name}
                      <Icon 
                        icon={isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'} 
                        width={16} 
                        className="text-muted-foreground opacity-60" 
                      />
                    </h4>
                    <p className="text-xs text-muted-foreground leading-normal">{store.benefitText}</p>
                    
                    <div className="flex items-center gap-2 bg-muted/65 p-2 rounded-lg border border-border mt-3 w-fit">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Cupom:</span>
                      <span className="font-mono text-sm font-bold text-foreground">{store.couponCode}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible details showing metrics and configurations */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-border/60 space-y-4 text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Coupon details metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 p-2.5 rounded-lg border border-border/40">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Visualizações</span>
                        <span className="font-mono text-sm font-bold text-foreground">{store.views}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Resgates</span>
                        <span className="font-mono text-sm font-bold text-foreground">{store.redemptions}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Conversão</span>
                        <span className="font-mono text-sm font-bold text-[#0B1D3A]">{convRate}%</span>
                      </div>
                    </div>

                    {/* Redirection url info */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Link de Redirecionamento</span>
                      <a 
                        href={store.redirectUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-mono text-[11px] text-[#0B1D3A] hover:underline block truncate"
                      >
                        {store.redirectUrl}
                      </a>
                    </div>

                    {/* Rules details */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Termos e Regras de Uso</span>
                      <p className="text-muted-foreground leading-relaxed italic">
                        "{store.terms}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardBox>
          );
        })}
      </div>

      {/* Modal Nova Parceria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            <h4 className="text-lg font-bold text-foreground mb-4">Adicionar Loja Parceira</h4>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome da Loja *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Centauro Esportes"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Categoria de Convênio</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Saúde & Farmácia">Saúde & Farmácia</option>
                  <option value="Entretenimento & Lazer">Entretenimento & Lazer</option>
                  <option value="Esportes & Moda">Esportes & Moda</option>
                  <option value="Eletrodomésticos">Eletrodomésticos</option>
                  <option value="Educação / Cursos">Educação / Cursos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Texto de Benefício / Oferta *</label>
                <input
                  type="text"
                  required
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  placeholder="Ex: 10% de desconto em todo o site"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Código de Cupom Exclusivo *</label>
                <input
                  type="text"
                  required
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Ex: CENTAUROUNE10"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Link URL de Destino</label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="Ex: https://parceiro.com/unebook"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Termos e Condições de Uso</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Ex: Válido apenas para compras no site oficial."
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground h-16 resize-none"
                />
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
                  Confirmar Parceria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            <h4 className="text-lg font-bold text-foreground mb-4">Editar Parceria: {editingStore.name}</h4>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome da Loja *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Categoria de Convênio</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Saúde & Farmácia">Saúde & Farmácia</option>
                  <option value="Entretenimento & Lazer">Entretenimento & Lazer</option>
                  <option value="Esportes & Moda">Esportes & Moda</option>
                  <option value="Eletrodomésticos">Eletrodomésticos</option>
                  <option value="Educação / Cursos">Educação / Cursos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Texto de Benefício / Oferta *</label>
                <input
                  type="text"
                  required
                  value={editBenefit}
                  onChange={(e) => setEditBenefit(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Código de Cupom *</label>
                <input
                  type="text"
                  required
                  value={editCoupon}
                  onChange={(e) => setEditCoupon(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Link URL de Destino</label>
                <input
                  type="url"
                  value={editRedirectUrl}
                  onChange={(e) => setEditRedirectUrl(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Termos e Condições de Uso</label>
                <textarea
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground h-16 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status da Parceria</label>
                <select
                  value={editStatus ? 'true' : 'false'}
                  onChange={(e) => setEditStatus(e.target.value === 'true')}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingStore(null);
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
    </div>
  );
};

export default PartnerStores;
