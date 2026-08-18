import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { catalogMappings, type CatalogMapping } from 'src/data/catalogMappings';

type PlanMap = CatalogMapping;

const PlanMapping = () => {
  // Mapeamento é por provedor: o mesmo código de serviço significa coisas diferentes
  // em ERPs distintos, então o vínculo nasce sempre dentro do tenant corrente.
  const currentProviderId: string = (() => {
    try {
      return JSON.parse(localStorage.getItem('fikta_user') || '{}')?.tenantId ?? '';
    } catch {
      return '';
    }
  })();

  const [mappings, setMappings] = useState<PlanMap[]>(catalogMappings);

  // Create Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [erpId, setErpId] = useState('');
  const [erpName, setErpName] = useState('');
  const [product, setProduct] = useState('Biblioteca Gold');
  const [bookCount, setBookCount] = useState(100);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<PlanMap | null>(null);
  const [editErpId, setEditErpId] = useState('');
  const [editErpName, setEditErpName] = useState('');
  const [editProduct, setEditProduct] = useState('Biblioteca Gold');
  const [editBookCount, setEditBookCount] = useState(100);
  const [editStatus, setEditStatus] = useState(true);

  const toggleStatus = (id: string) => {
    setMappings(mappings.map(map => {
      if (map.id === id) {
        return { ...map, status: !map.status };
      }
      return map;
    }));
  };

  const handleCreateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!erpId || !erpName) return;

    const newMap: PlanMap = {
      id: Date.now().toString(),
      providerId: currentProviderId,
      externalCode: erpId,
      planErpName: erpName,
      productLinked: product,
      status: true
    };

    setMappings([...mappings, newMap]);
    setErpId('');
    setErpName('');
    setIsModalOpen(false);
  };

  const openEditModal = (map: PlanMap) => {
    setEditingMapping(map);
    setEditErpId(map.externalCode);
    setEditErpName(map.planErpName);
    setEditProduct(map.productLinked);
    setEditStatus(map.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapping) return;

    setMappings(mappings.map(map => {
      if (map.id === editingMapping.id) {
        return {
          ...map,
              externalCode: editErpId,
          planErpName: editErpName,
          productLinked: editProduct,
          status: editStatus
        };
      }
      return map;
    }));

    setIsEditModalOpen(false);
    setEditingMapping(null);
  };

  const handleDeleteMapping = (id: string) => {
    if (confirm('Deseja realmente excluir este mapeamento?')) {
      setMappings(mappings.filter(map => map.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Mapeamento de Planos</h3>
          <p className="text-sm text-muted-foreground">Vincule os planos do seu ERP às assinaturas da FIKTA</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
        >
          <Icon icon="tabler:plus" width={18} />
          Novo Mapeamento
        </button>
      </div>

      <CardBox>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex gap-3 text-primary">
          <Icon icon="tabler:info-circle" width={24} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Como funciona:</span> Quando o seu ERP (ex: Voalle, IXC Soft, HubSoft) notificar o onboarding de um contrato, a plataforma usará este mapeamento para conceder automaticamente o acesso correto de E-books ou Banca de Revistas ao CPF/CNPJ do assinante.
          </div>
        </div>

        {/* Plan Mapping Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground">ID Plano ERP</th>
                <th className="p-4 font-semibold text-muted-foreground">Nome do Plano no ERP</th>
                <th className="p-4 font-semibold text-muted-foreground">Produto FIKTA Vinculado</th>
                <th className="p-4 font-semibold text-muted-foreground">Sincronização</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum mapeamento de plano criado.
                  </td>
                </tr>
              ) : (
                mappings.map((map) => (
                  <tr key={map.id} className="border-b border-border hover:bg-muted/5 transition-all">
                    <td className="p-4 font-mono font-medium text-foreground">{map.externalCode}</td>
                    <td className="p-4 font-medium text-foreground">{map.planErpName}</td>
                    <td className="p-4">
                      <span className="bg-lightprimary text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
                        {map.productLinked}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${
                        map.status ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${map.status ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {map.status ? 'Ativo / Sincronizando' : 'Pausado'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2 items-center">
                      <button
                        onClick={() => openEditModal(map)}
                        className="text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded"
                        title="Editar Mapeamento"
                      >
                        <Icon icon="tabler:edit" width={18} />
                      </button>
                      <button
                        onClick={() => toggleStatus(map.id)}
                        className="text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded"
                        title={map.status ? 'Pausar Integração' : 'Ativar Integração'}
                      >
                        <Icon icon={map.status ? 'tabler:player-pause' : 'tabler:player-play'} width={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteMapping(map.id)}
                        className="text-red-500 hover:text-red-600 transition-all p-1.5 hover:bg-muted/10 rounded"
                        title="Excluir Mapeamento"
                      >
                        <Icon icon="tabler:trash" width={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBox>

      {/* New Mapping Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Criar Mapeamento de Plano</h4>
            <form onSubmit={handleCreateMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ID do Plano no ERP *</label>
                <input
                  type="text"
                  required
                  value={erpId}
                  onChange={(e) => setErpId(e.target.value)}
                  placeholder="Ex: 154"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome do Plano no ERP *</label>
                <input
                  type="text"
                  required
                  value={erpName}
                  onChange={(e) => setErpName(e.target.value)}
                  placeholder="Ex: Plano 300MB Fibra + FIKTA Gold"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Produto FIKTA Vinculado</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Banca Standard">Banca Standard (Revistas Clássicas)</option>
                  <option value="Banca Premium">Banca Premium (Lançamentos de Revistas)</option>
                  <option value="Biblioteca Gold">Biblioteca Gold (Livros e Audiobooks)</option>
                  <option value="Biblioteca Diamante">Biblioteca Diamante (Catálogo Completo + Banca)</option>
                </select>
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
                  Salvar Mapeamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mapping Modal */}
      {isEditModalOpen && editingMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Editar Mapeamento de Plano</h4>
            <form onSubmit={handleUpdateMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ID do Plano no ERP *</label>
                <input
                  type="text"
                  required
                  value={editErpId}
                  onChange={(e) => setEditErpId(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome do Plano no ERP *</label>
                <input
                  type="text"
                  required
                  value={editErpName}
                  onChange={(e) => setEditErpName(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Produto FIKTA Vinculado</label>
                <select
                  value={editProduct}
                  onChange={(e) => setEditProduct(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Banca Standard">Banca Standard (Revistas Clássicas)</option>
                  <option value="Banca Premium">Banca Premium (Lançamentos de Revistas)</option>
                  <option value="Biblioteca Gold">Biblioteca Gold (Livros e Audiobooks)</option>
                  <option value="Biblioteca Diamante">Biblioteca Diamante (Catálogo Completo + Banca)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status da Integração</label>
                <select
                  value={editStatus ? 'true' : 'false'}
                  onChange={(e) => setEditStatus(e.target.value === 'true')}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="true">Ativo / Sincronizando</option>
                  <option value="false">Pausado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingMapping(null);
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

export default PlanMapping;
