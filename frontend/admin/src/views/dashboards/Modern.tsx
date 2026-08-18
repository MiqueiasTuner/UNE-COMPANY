import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';
import CardBox from 'src/components/shared/CardBox';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { getCurrentTenant } from 'src/data/tenants';
import { apiGet } from 'src/api/client';
import { useAutoRefresh } from 'src/hooks/useAutoRefresh';

/** Resposta de GET /api/v1/platform/stats — tudo agregado no banco. */
/** Provedor como devolvido por GET /api/v1/providers. */
interface DashboardProvider {
  id: string;
  name: string;
  status: string;
  subscriberCount: number;
  hasErpIntegration: boolean;
  createdAt: string | null;
}

interface PlatformStats {
  providers: { total: number; active: number };
  subscribers: { total: number; active: number; delinquent: number; overdueAmount: number };
  catalog: { books: number; magazines: number };
  erpHealth: { callsLast24h: number; failuresLast24h: number; successRate: number | null };
}

interface UserSession {
  username: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  progress: number;
  chapters: { title: string; content: string }[];
}

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/catalog/books
const mockBooks: Book[] = [];

const ModernDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('fikta_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1D3A] to-[#132a52] rounded-2xl p-7 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <svg
          className="pointer-events-none absolute -right-10 -bottom-16 h-64 w-64 opacity-[0.06]"
          viewBox="0 0 180 230"
          fill="none"
        >
          <path fill="#FFFFFF" d="M40 60 L40 10 L100 38 Z" />
          <path fill="#FFFFFF" d="M40 60 H78 V190 L59 210 L40 190 Z" />
          <path fill="#FFFFFF" d="M78 100 H140 L128 130 H78 Z" />
        </svg>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
            <svg width="10" height="13" viewBox="0 0 180 230" fill="none">
              <path fill="#FFC629" d="M40 60 L40 10 L100 38 Z" />
              <path fill="#FFFFFF" d="M40 60 H78 V190 L59 210 L40 190 Z" />
              <path fill="#FFFFFF" d="M78 100 H140 L128 130 H78 Z" />
            </svg>
            FIKTA · Editora Digital
          </span>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Icon icon={
              user.role === 'UNE_ADMIN' ? 'tabler:shield' :
              user.role === 'CUSTOMER' ? 'tabler:library' : 'tabler:network'
            } width={26} />
            {user.role === 'UNE_ADMIN' ? 'Painel FIKTA Master' :
             user.role === 'CUSTOMER' ? `Minha Biblioteca — ${user.tenantName}` :
             `Painel do Provedor — ${user.tenantName}`}
          </h2>
          <p className="text-white/70 text-sm mt-1.5 max-w-md">
            {user.role === 'UNE_ADMIN'
              ? 'Ambiente de administração global. Gerencie parceiros ISPs e controle o catálogo do ecossistema.'
              : user.role === 'CUSTOMER'
              ? 'Bem-vindo à sua área de leitura. Escolha um dos títulos fornecidos por seu provedor e aproveite!'
              : 'Acompanhe a entrega de mídias, logs de acessos e engajamento dos seus assinantes localmente.'}
          </p>
        </div>
        {user.role !== 'CUSTOMER' && (
          <button
            onClick={() => navigate(user.role === 'UNE_ADMIN' ? '/admin/providers' : '/admin/subscriptions')}
            className="relative shrink-0 bg-[#FFC629] text-[#0B1D3A] hover:bg-[#ffd35c] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            {user.role === 'UNE_ADMIN' ? 'Gerenciar Provedores' : 'Ver Subscrições'}
            <Icon icon="tabler:arrow-right" width={16} />
          </button>
        )}
      </div>

      {user.role === 'UNE_ADMIN' ? (
        <MasterDashboardView navigate={navigate} />
      ) : user.role === 'CUSTOMER' ? (
        <CustomerDashboardView user={user} />
      ) : (
        <ProviderDashboardView navigate={navigate} />
      )}
    </div>
  );
};

// ==================== CUSTOMER WORKFLOW (B2C Final Client) ====================
const CustomerDashboardView = ({ user }: { user: UserSession }) => {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  
  // Reader State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [isDyslexic, setIsDyslexic] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const startReading = (book: Book) => {
    setSelectedBook(book);
    setCurrentChapter(0);
    setReadProgress(book.progress);
  };

  const handleNextChapter = () => {
    if (!selectedBook) return;
    if (currentChapter < selectedBook.chapters.length - 1) {
      const nextIndex = currentChapter + 1;
      setCurrentChapter(nextIndex);
      const newProgress = Math.round(((nextIndex + 1) / selectedBook.chapters.length) * 100);
      setReadProgress(newProgress);
      updateBookProgress(selectedBook.id, newProgress);
    }
  };

  const handlePrevChapter = () => {
    if (!selectedBook) return;
    if (currentChapter > 0) {
      const prevIndex = currentChapter - 1;
      setCurrentChapter(prevIndex);
      const newProgress = Math.round(((prevIndex + 1) / selectedBook.chapters.length) * 100);
      setReadProgress(newProgress);
      updateBookProgress(selectedBook.id, newProgress);
    }
  };

  const updateBookProgress = (bookId: string, progress: number) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, progress } : b));
  };

  const currentBookInProgress = books.find(b => b.progress > 0 && b.progress < 100);

  return (
    <div className="space-y-6">
      
      {/* Continuing Reading Section */}
      {currentBookInProgress && (
        <CardBox className="border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none hidden md:block" />
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img 
              src={currentBookInProgress.coverUrl} 
              alt={currentBookInProgress.title} 
              className="h-28 w-20 object-cover rounded-lg shadow-md border border-border"
            />
            <div className="space-y-2 flex-1 text-center md:text-left">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Continue Lendo
              </span>
              <h4 className="text-xl font-bold text-foreground mt-1">{currentBookInProgress.title}</h4>
              <p className="text-xs text-muted-foreground">Por {currentBookInProgress.author} • {currentBookInProgress.category}</p>
              
              <div className="w-full md:w-64">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso da Leitura</span>
                  <span className="font-bold text-primary">{currentBookInProgress.progress}%</span>
                </div>
                <div className="w-full bg-muted-foreground/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${currentBookInProgress.progress}%` }} />
                </div>
              </div>
            </div>
            
            <button
              onClick={() => startReading(currentBookInProgress)}
              className="bg-primary text-white hover:bg-primary/95 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Icon icon="tabler:book-open" width={18} />
              Retomar Leitura
            </button>
          </div>
        </CardBox>
      )}

      {/* Available Book Catalog */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-foreground">Biblioteca Digital - Acervo de Livros</h4>
          <span className="text-xs text-muted-foreground">Disponibilizado via SVA {user.tenantName}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map(book => (
            <CardBox key={book.id} className="p-4 border border-border flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="space-y-3">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted/20">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover" 
                  />
                  {book.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1.5 text-[10px] text-white flex items-center justify-between">
                      <span>Lido</span>
                      <span className="font-bold text-primary">{book.progress}%</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold uppercase">
                    {book.category}
                  </span>
                  <h5 className="font-bold text-foreground text-sm mt-1.5 line-clamp-1" title={book.title}>
                    {book.title}
                  </h5>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                {book.progress > 0 ? (
                  <button
                    onClick={() => startReading(book)}
                    className="w-full border border-primary text-primary hover:bg-primary/5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icon icon="tabler:rotate" width={14} />
                    Continuar Lendo
                  </button>
                ) : (
                  <button
                    onClick={() => startReading(book)}
                    className="w-full bg-primary text-white hover:bg-primary/95 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icon icon="tabler:book-open" width={14} />
                    Iniciar Leitura
                  </button>
                )}
              </div>
            </CardBox>
          ))}
        </div>
      </div>

      {/* Reader Modal overlay */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50 transition-all ${
            readerTheme === 'dark' ? 'bg-[#18181b] text-zinc-100 border-zinc-800' :
            readerTheme === 'sepia' ? 'bg-[#f4ebd0] text-[#4f3824] border-[#e4d7b7]' :
            'bg-white text-gray-800'
          }`}>
            
            {/* Header controls */}
            <div className="p-4 border-b border-border/20 flex justify-between items-center shrink-0 bg-black/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-all"
                  title="Voltar para Biblioteca"
                >
                  <Icon icon="tabler:arrow-left" width={20} />
                </button>
                <div>
                  <h4 className="font-bold text-sm truncate max-w-[200px] sm:max-w-sm">{selectedBook.title}</h4>
                  <p className="text-[10px] opacity-75">Por {selectedBook.author}</p>
                </div>
              </div>

              {/* Adjustments row */}
              <div className="flex items-center gap-2 sm:gap-4">
                
                {/* Font decrease */}
                <button
                  onClick={() => setReaderFontSize(prev => Math.max(12, prev - 2))}
                  className="p-2 hover:bg-black/10 rounded-lg transition-all text-xs font-bold"
                  title="Diminuir Fonte"
                >
                  A-
                </button>

                {/* Font size indicator */}
                <span className="text-xs font-mono">{readerFontSize}px</span>

                {/* Font increase */}
                <button
                  onClick={() => setReaderFontSize(prev => Math.min(26, prev + 2))}
                  className="p-2 hover:bg-black/10 rounded-lg transition-all text-xs font-bold"
                  title="Aumentar Fonte"
                >
                  A+
                </button>

                {/* Dyslexic font toggle */}
                <button
                  onClick={() => setIsDyslexic(!isDyslexic)}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                    isDyslexic ? 'bg-primary/20 border-primary text-primary' : 'border-transparent hover:bg-black/10'
                  }`}
                  title="Fonte Acessível para Dislexia"
                >
                  Fonte Acessível
                </button>

                {/* Theme picker */}
                <div className="flex items-center gap-1 bg-black/10 p-1 rounded-lg border border-border/10">
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      readerTheme === 'light' ? 'bg-white text-gray-800 shadow' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    Claro
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      readerTheme === 'sepia' ? 'bg-[#e4d7b7] text-[#4f3824] shadow' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    Sépia
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      readerTheme === 'dark' ? 'bg-zinc-800 text-zinc-100 shadow' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    Escuro
                  </button>
                </div>
              </div>
            </div>

            {/* Content area: Table of contents + text spread */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Sidebar: Table of contents */}
              <div className="w-64 border-e border-border/10 p-4 overflow-y-auto hidden md:block bg-black/5 shrink-0">
                <h5 className="font-extrabold text-xs uppercase tracking-wider mb-4 opacity-75">Capítulos</h5>
                <div className="space-y-1">
                  {selectedBook.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentChapter(idx);
                        const newProgress = Math.round(((idx + 1) / selectedBook.chapters.length) * 100);
                        setReadProgress(newProgress);
                        updateBookProgress(selectedBook.id, newProgress);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition-all ${
                        currentChapter === idx 
                          ? 'bg-primary/20 text-primary border-s-4 border-primary font-bold shadow-xs' 
                          : 'hover:bg-black/5 opacity-80'
                      }`}
                    >
                      {ch.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spread container */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-10">
                
                {/* Text Content */}
                <div className="max-w-2xl mx-auto space-y-6 w-full my-auto">
                  <h2 className="text-xl font-bold text-center border-b border-border/10 pb-4">
                    {selectedBook.chapters[currentChapter]?.title || 'Capítulo'}
                  </h2>

                  <p 
                    style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.8 }}
                    className={`leading-relaxed text-justify indent-8 tracking-wide ${
                      isDyslexic ? 'font-mono' : 'font-serif'
                    }`}
                  >
                    {selectedBook.chapters[currentChapter]?.content}
                  </p>
                </div>

                {/* Footer progress & page buttons inside the modal */}
                <div className="mt-8 pt-4 border-t border-border/10 flex items-center justify-between shrink-0">
                  <button
                    disabled={currentChapter === 0}
                    onClick={handlePrevChapter}
                    className="border border-border/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-black/10 disabled:opacity-30 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Icon icon="tabler:chevron-left" width={16} />
                    Capítulo Anterior
                  </button>

                  <div className="text-xs font-medium opacity-75 text-center">
                    Capítulo {currentChapter + 1} de {selectedBook.chapters.length} ({readProgress}% lido)
                  </div>

                  <button
                    disabled={currentChapter === selectedBook.chapters.length - 1}
                    onClick={handleNextChapter}
                    className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    Próximo Capítulo
                    <Icon icon="tabler:chevron-right" width={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom progress bar */}
            <div className="h-1 bg-muted-foreground/10 shrink-0">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${readProgress}%` }} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// ==================== PROVIDER WORKFLOW (TechNet) ====================
const ProviderDashboardView = ({ navigate }: { navigate: any }) => {
  // Valores reais vêm da API — não preencher com exemplos.
  // Origem: GET /api/v1/providers/{id}/stats
  const stats = [
    { title: 'Total de Mídia', value: '—', icon: 'tabler:books', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Mídias Entregues', value: '—', icon: 'tabler:package', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Revistas Entregues', value: '—', icon: 'tabler:book-2', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Logins Únicos', value: '—', icon: 'tabler:user-check', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Utilizações', value: '—', icon: 'tabler:pointer', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Promocodes', value: '—', icon: 'tabler:discount-2', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
    { title: 'Total Economizado', value: '—', icon: 'tabler:coin', color: 'bg-emerald-100/80 border border-emerald-200/60 text-emerald-800' },
  ];

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      stacked: false,
    },
    colors: ['#5d87ff', '#0B1D3A'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#7C8FAC' },
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
    },
    xaxis: {
      // Últimos 7 dias contados a partir de hoje — o eixo é real mesmo antes de haver
      // dados nas séries, então o gráfico vazio ainda diz de qual período se trata.
      categories: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#7C8FAC' } },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        style: { colors: '#7C8FAC' },
        formatter: (val) => Math.round(val).toString(),
      },
    },
    tooltip: { theme: 'dark' },
  };

  // Séries reais vêm da API — não preencher com exemplos.
  // Origem: GET /api/v1/providers/{id}/engagement?days=7
  const chartSeries = [
    { name: 'Novos Usuários', data: [] as number[] },
    { name: 'Utilizações', data: [] as number[] },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stats.map((stat, i) => (
          <CardBox key={i} className="p-4 flex flex-col justify-between h-28 border border-border">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</span>
            <div className="flex justify-between items-center mt-2">
              <h4 className="text-lg font-black text-foreground">{stat.value}</h4>
              <span className={`p-2 rounded-lg ${stat.color}`}>
                <Icon icon={stat.icon} width={20} />
              </span>
            </div>
          </CardBox>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CardBox className="h-full border border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h5 className="text-base font-bold text-foreground">Usuários x Utilizações</h5>
                <p className="text-xs text-muted-foreground">Volume de engajamento diário e novos cadastros</p>
              </div>
              <span className="text-xs font-semibold text-[#0B1D3A] bg-[#0B1D3A]/10 px-2 py-0.5 rounded">
                Últimos 7 dias
              </span>
            </div>
            <div className="h-[300px]">
              <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
            </div>
          </CardBox>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <CardBox className="border border-border">
            <h5 className="text-base font-bold text-foreground mb-4">Informações do Contrato</h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Provedor</span>
                <span className="font-semibold text-foreground">{getCurrentTenant().name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Integração ERP</span>
                <span className="font-mono text-xs font-bold text-primary">Voalle ERP (Ativo)</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">SLA de Sincronia</span>
                <span className="font-semibold text-foreground">Tempo Real (Webhooks)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limites de Acesso</span>
                <span className="font-semibold text-emerald-500">Ilimitado (B2B SVA)</span>
              </div>
            </div>
          </CardBox>

          <CardBox className="border border-border">
            <h5 className="text-base font-bold text-foreground mb-4">Atalhos Administrativos</h5>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/plan-mapping')}
                className="p-3 border border-border rounded-lg hover:border-primary text-center text-xs font-bold text-foreground flex flex-col items-center gap-1.5 transition-all"
              >
                <Icon icon="tabler:sitemap" width={20} className="text-primary" />
                Mapear Planos
              </button>
              <button
                onClick={() => navigate('/admin/digital-magazines')}
                className="p-3 border border-border rounded-lg hover:border-primary text-center text-xs font-bold text-foreground flex flex-col items-center gap-1.5 transition-all"
              >
                <Icon icon="tabler:book" width={20} className="text-primary" />
                Acessar Revistas
              </button>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

// ==================== MASTER WORKFLOW (FIKTA Master) ====================
const MasterDashboardView = ({ navigate }: { navigate: any }) => {
  // Números globais agregados no banco por GET /api/v1/platform/stats.
  // Enquanto a resposta não chega, os cards mostram "—" em vez de zero: zero é uma
  // afirmação ("não há provedores"), e ainda não sabemos se é verdade.
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [providers, setProviders] = useState<DashboardProvider[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    apiGet<PlatformStats>('/api/v1/platform/stats')
      .then((d) => {
        setStats(d);
        setStatsError(null);
        setRefreshedAt(new Date());
      })
      .catch((e) => setStatsError(e.message));

    apiGet<{ providers: DashboardProvider[] }>('/api/v1/providers')
      .then((d) => setProviders(d.providers ?? []))
      .catch((e) => setStatsError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Mantém o painel vivo sem depender de F5: recarrega a cada 30s e ao voltar o foco.
  useAutoRefresh(load, 30_000);

  /**
   * Fatias do gráfico de assinantes por ISP.
   *
   * Rótulos e valores saem da MESMA lista, na mesma ordem — antes as legendas tinham sido
   * esvaziadas mas a série continuava com números fixos, então o gráfico desenhava fatias
   * anônimas com dados que não correspondiam a provedor nenhum.
   *
   * Provedores sem assinante ficam de fora: uma fatia de valor zero não é desenhável e só
   * polui a legenda.
   */
  const chartProviders = providers.filter((p) => p.subscriberCount > 0);
  const donutLabels = chartProviders.map((p) => p.name);
  const donutSeries = chartProviders.map((p) => p.subscriberCount);

  const num = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toLocaleString('pt-BR');

  const masterStats = [
    { title: 'Provedores Parceiros', value: num(stats?.providers.total), icon: 'tabler:network', color: 'bg-primary/10 text-primary' },
    { title: 'Assinantes Globais', value: num(stats?.subscribers.total), icon: 'tabler:users', color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Livros no Catálogo', value: num(stats?.catalog.books), icon: 'tabler:database', color: 'bg-indigo-500/10 text-indigo-500' },
    {
      title: 'Inadimplência em Aberto',
      value:
        stats?.subscribers.overdueAmount === undefined || stats?.subscribers.overdueAmount === null
          ? '—'
          : stats.subscribers.overdueAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: 'tabler:coin',
      color: 'bg-[#0B1D3A]/10 text-[#0B1D3A]',
    },
  ];

  const donutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: ['#0B1D3A', '#5d87ff', '#13deb9', '#f6b51e', '#ef4444'],
    labels: donutLabels,
    legend: { position: 'bottom', labels: { colors: '#7C8FAC' } },
    tooltip: { theme: 'dark' },
    stroke: { show: false },
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {masterStats.map((stat, i) => (
          <CardBox key={i} className="p-4 flex items-center justify-between border border-border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">{stat.title}</p>
              <h4 className="text-2xl font-black text-foreground mt-1">{stat.value}</h4>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <Icon icon={stat.icon} width={24} />
            </div>
          </CardBox>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CardBox className="border border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h5 className="text-base font-bold text-foreground">Provedores Recentes</h5>
                <p className="text-xs text-muted-foreground">Últimos parceiros onboardados e status de licença</p>
              </div>
              <button
                onClick={() => navigate('/admin/providers')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {/* Parceiros vindos de GET /api/v1/providers, os mais recentes primeiro. */}
              {providers.length === 0 && (
                <div className="py-8 text-center space-y-1.5">
                  <Icon icon="tabler:building-broadcast-tower" width={32} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-foreground">Nenhum provedor cadastrado</p>
                  <button
                    onClick={() => navigate('/admin/providers')}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Cadastrar o primeiro parceiro
                  </button>
                </div>
              )}
              {[...providers]
                .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                .slice(0, 5)
                .map((isp) => (
                <div
                  key={isp.id}
                  onClick={() => navigate(`/admin/providers/${isp.id}`)}
                  className="flex justify-between items-center gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0 cursor-pointer hover:opacity-80 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-[#0B1D3A]/10 text-[#0B1D3A] flex items-center justify-center font-bold">
                      {isp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-bold text-sm text-foreground truncate">{isp.name}</h6>
                      <p className="text-xs text-muted-foreground">
                        {isp.hasErpIntegration ? 'ERP integrado' : 'Sem integração'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{isp.subscriberCount} assinantes</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isp.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                    }`}>
                      {isp.status === 'ACTIVE' ? 'Ativo' : isp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBox>
        </div>

        <div className="lg:col-span-4">
          <CardBox className="h-full border border-border">
            <h5 className="text-base font-bold text-foreground mb-4">Assinantes por ISP</h5>
            <div className="h-[280px] flex items-center justify-center">
              {/*
                Um donut sem fatias renderiza um quadrado em branco, que o operador lê como
                falha de carregamento. Com nenhum provedor tendo assinantes, dizer isso em
                texto é mais informativo do que desenhar um gráfico vazio.
              */}
              {donutSeries.length === 0 ? (
                <div className="text-center space-y-1.5 px-4">
                  <Icon icon="tabler:chart-donut" width={34} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-foreground">Sem assinantes ainda</p>
                  <p className="text-xs text-muted-foreground">
                    {providers.length === 0
                      ? 'Cadastre um provedor para começar.'
                      : 'Os provedores cadastrados ainda não têm assinantes importados.'}
                  </p>
                </div>
              ) : (
                <Chart options={donutOptions} series={donutSeries} type="donut" width="100%" />
              )}
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;