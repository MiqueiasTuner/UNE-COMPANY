import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface Banner {
  id: string;
  title: string;
  imageLink: string;
  clickUrl: string;
  status: boolean;
  startDate: string;
  endDate: string;
  clicks: number;
  // Detail expansion attributes
  impressions: number;
  targetSegment: string;
  utmSource: string;
  utmCampaign: string;
  imageUrl: string;
}

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/providers/{id}/banners
const initialBanners: Banner[] = [];

const Banners = () => {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [expandedBannerId, setExpandedBannerId] = useState<string | null>(null);
  
  // Create Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetSegment, setTargetSegment] = useState('Todos os Assinantes');
  const [utmCampaign, setUtmCampaign] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editClickUrl, setEditClickUrl] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTargetSegment, setEditTargetSegment] = useState('');
  const [editUtmCampaign, setEditUtmCampaign] = useState('');
  const [editStatus, setEditStatus] = useState(true);
  const [editClicks, setEditClicks] = useState(0);

  const toggleStatus = (id: string) => {
    setBanners(banners.map(banner => {
      if (banner.id === id) {
        return { ...banner, status: !banner.status };
      }
      return banner;
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clickUrl) return;

    const newBanner: Banner = {
      id: Date.now().toString(),
      title,
      imageLink: 'Banner Personalizado',
      clickUrl,
      status: true,
      startDate: startDate || new Date().toISOString().substring(0, 10),
      endDate: endDate || '2026-12-31',
      clicks: 0,
      impressions: 0,
      targetSegment,
      utmSource: 'unebook-custom',
      utmCampaign: utmCampaign || 'custom-campaign',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    };

    setBanners([...banners, newBanner]);
    setTitle('');
    setClickUrl('');
    setStartDate('');
    setEndDate('');
    setTargetSegment('Todos os Assinantes');
    setUtmCampaign('');
    setIsModalOpen(false);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setEditTitle(banner.title);
    setEditClickUrl(banner.clickUrl);
    setEditStartDate(banner.startDate);
    setEditEndDate(banner.endDate);
    setEditTargetSegment(banner.targetSegment);
    setEditUtmCampaign(banner.utmCampaign);
    setEditStatus(banner.status);
    setEditClicks(banner.clicks);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setBanners(banners.map(b => {
      if (b.id === editingBanner.id) {
        return {
          ...b,
          title: editTitle,
          clickUrl: editClickUrl,
          startDate: editStartDate,
          endDate: editEndDate,
          targetSegment: editTargetSegment,
          utmCampaign: editUtmCampaign,
          status: editStatus,
          clicks: editClicks,
          impressions: editClicks * 21 // Update simulated impressions
        };
      }
      return b;
    }));

    setIsEditModalOpen(false);
    setEditingBanner(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover este banner?')) {
      setBanners(banners.filter(banner => banner.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Banners Promocionais</h3>
          <p className="text-sm text-muted-foreground">Gerencie os banners exibidos no carrossel do portal de e-books de seus assinantes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
        >
          <Icon icon="tabler:plus" width={18} />
          Novo Banner
        </button>
      </div>

      <CardBox>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex gap-3 text-primary">
          <Icon icon="tabler:info-circle" width={24} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Dica de Conversão:</span> Banners que promovem grandes lançamentos do catálogo (como best-sellers do mês ou audiobooks recomendados) aumentam a taxa de engajamento do assinante em até 30%, reduzindo o churn de telecom.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground w-12"></th>
                <th className="p-4 font-semibold text-muted-foreground">Título do Banner</th>
                <th className="p-4 font-semibold text-muted-foreground">Identificador Imagem</th>
                <th className="p-4 font-semibold text-muted-foreground">Link / Rota</th>
                <th className="p-4 font-semibold text-muted-foreground">Período de Exibição</th>
                <th className="p-4 font-semibold text-muted-foreground">Cliques</th>
                <th className="p-4 font-semibold text-muted-foreground">Status</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => {
                const isExpanded = expandedBannerId === banner.id;
                const ctr = banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : '0.00';

                return (
                  <>
                    <tr 
                      key={banner.id} 
                      className={`border-b border-border hover:bg-muted/5 transition-all cursor-pointer ${isExpanded ? 'bg-muted/5' : ''}`}
                      onClick={() => setExpandedBannerId(isExpanded ? null : banner.id)}
                    >
                      <td className="p-4 text-center">
                        <Icon 
                          icon={isExpanded ? 'tabler:chevron-down' : 'tabler:chevron-right'} 
                          width={16} 
                          className="text-muted-foreground"
                        />
                      </td>
                      <td className="p-4 font-bold text-foreground">{banner.title}</td>
                      <td className="p-4">
                        <div className="h-10 w-24 bg-muted border border-border flex items-center justify-center rounded text-xs font-semibold text-muted-foreground font-mono">
                          {banner.imageLink}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{banner.clickUrl}</td>
                      <td className="p-4 text-foreground font-mono text-xs">
                        {banner.startDate} até {banner.endDate}
                      </td>
                      <td className="p-4 font-mono font-semibold text-foreground">{banner.clicks} clicks</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${
                          banner.status ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${banner.status ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          {banner.status ? 'Visível' : 'Pausado'}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(banner)}
                          className="text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded"
                          title="Editar Banner"
                        >
                          <Icon icon="tabler:edit" width={18} />
                        </button>
                        <button
                          onClick={() => toggleStatus(banner.id)}
                          className="text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted/10 rounded"
                          title={banner.status ? 'Ocultar Banner' : 'Publicar Banner'}
                        >
                          <Icon icon={banner.status ? 'tabler:player-pause' : 'tabler:player-play'} width={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-red-500 hover:text-red-600 transition-all p-1.5 hover:bg-muted/10 rounded"
                          title="Excluir Banner"
                        >
                          <Icon icon="tabler:trash" width={18} />
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDABLE ROW CONTENT */}
                    {isExpanded && (
                      <tr className="bg-muted/10 dark:bg-black/10 border-b border-border">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-sm">
                            
                            {/* Left: Preview Artwork */}
                            <div className="md:col-span-5 space-y-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Preview do Banner</span>
                              <div className="relative border border-border rounded-lg overflow-hidden h-32 w-full shadow-sm bg-muted/40">
                                <img 
                                  src={banner.imageUrl} 
                                  alt={banner.title} 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/35 flex items-end p-3">
                                  <span className="text-white text-xs font-bold truncate max-w-full drop-shadow-md">{banner.title}</span>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Performance details */}
                            <div className="md:col-span-4 space-y-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block text-left">Métricas de Campanha</span>
                              <div className="bg-white dark:bg-dark p-3 rounded-lg border border-border text-xs space-y-1.5">
                                <div className="flex justify-between"><span className="text-muted-foreground">Impressões Globais:</span> <span className="font-mono font-semibold text-foreground">{banner.impressions}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Cliques Registrados:</span> <span className="font-mono font-semibold text-foreground">{banner.clicks}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Click-Through-Rate (CTR):</span> <span className="font-mono font-bold text-primary">{ctr}%</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Segmento de Clientes:</span> <span className="font-semibold text-foreground">{banner.targetSegment}</span></div>
                              </div>
                            </div>

                            {/* Right: UTM parameters details */}
                            <div className="md:col-span-3 space-y-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block text-left">Parâmetros de Rastreamento (UTM)</span>
                              <div className="bg-white dark:bg-dark p-3 rounded-lg border border-border text-xs space-y-1.5 font-mono">
                                <div><span className="text-muted-foreground">utm_source:</span> <span className="text-foreground">{banner.utmSource}</span></div>
                                <div><span className="text-muted-foreground">utm_campaign:</span> <span className="text-foreground">{banner.utmCampaign}</span></div>
                                <div><span className="text-muted-foreground">utm_medium:</span> <span className="text-foreground">app-carousel</span></div>
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

      {/* Modal Novo Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            <h4 className="text-lg font-bold text-foreground mb-4">Adicionar Banner Promocional</h4>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Título da Campanha *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Coleção Suspense Psicológico"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Link de Clique / Rota *</label>
                <input
                  type="text"
                  required
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  placeholder="Ex: /catalog/genre-suspense"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Segmento Alvo</label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="Todos os Assinantes">Todos os Assinantes</option>
                    <option value="Assinantes Biblioteca Diamante">Somente Premium/Diamante</option>
                    <option value="Leads e Não Assinantes">Não Assinantes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">UTM Campaign</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="Ex: promo-blackfriday"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Início Exibição</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Término Exibição</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
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
                  Salvar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative">
            <h4 className="text-lg font-bold text-foreground mb-4">Editar Banner: {editingBanner.title}</h4>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Título da Campanha *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Link de Rota *</label>
                <input
                  type="text"
                  required
                  value={editClickUrl}
                  onChange={(e) => setEditClickUrl(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Segmento Alvo</label>
                  <select
                    value={editTargetSegment}
                    onChange={(e) => setEditTargetSegment(e.target.value)}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="Todos os Assinantes">Todos os Assinantes</option>
                    <option value="Assinantes Biblioteca Diamante">Somente Premium/Diamante</option>
                    <option value="Leads e Não Assinantes">Não Assinantes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">UTM Campaign</label>
                  <input
                    type="text"
                    value={editUtmCampaign}
                    onChange={(e) => setEditUtmCampaign(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Início Exibição</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Término Exibição</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Contagem de Cliques</label>
                  <input
                    type="number"
                    min="0"
                    value={editClicks}
                    onChange={(e) => setEditClicks(Number(e.target.value))}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status de Exibição</label>
                  <select
                    value={editStatus ? 'true' : 'false'}
                    onChange={(e) => setEditStatus(e.target.value === 'true')}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="true">Visível / Ativo</option>
                    <option value="false">Pausado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBanner(null);
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

export default Banners;
