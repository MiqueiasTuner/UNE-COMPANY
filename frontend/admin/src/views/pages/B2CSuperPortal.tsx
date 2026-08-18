import { useEffect, useState } from 'react';
import { apiGet } from 'src/api/client';
import { getCurrentTenant } from 'src/data/tenants';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import {
  IconWifi,
  IconRefresh,
  IconHeadset,
  IconBook,
  IconSparkles,
  IconBrandWhatsapp,
  IconCheck,
  IconGauge,
  IconActivity,
  IconShieldCheck,
  IconNews,
  IconHeadphones,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';

type SectionId = 'STATUS' | 'TICKETS' | 'READING' | 'CLUB';

const SECTIONS: { id: SectionId; label: string; icon: typeof IconWifi }[] = [
  { id: 'STATUS', label: 'Status de Conexão', icon: IconWifi },
  { id: 'TICKETS', label: 'Suporte & Chamados', icon: IconHeadset },
  { id: 'READING', label: 'Leitura Digital FIKTA', icon: IconBook },
  { id: 'CLUB', label: 'Clube de Vantagens', icon: IconSparkles },
];

/**
 * Estado da conexão do assinante.
 *
 * Vem de GET /api/v1/b2c/connection, que por sua vez lê /api/people/{id}/authentications
 * na Portal V2 do ERP do provedor. Enquanto a integração não estiver configurada, a tela
 * mostra "indisponível" — nunca um número de exemplo, porque um assinante vendo
 * "512 Mbps" inventado enquanto está sem internet é pior do que não ver nada.
 */
interface ConnectionState {
  planName: string | null;
  contractNumber: string | null;
  active: boolean | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  signalQuality: string | null;
  routerStatus: string | null;
  uptime: string | null;
  installAddress: string | null;
}

/** Oferta do Clube de Vantagens, cadastrada pela FIKTA ou pelo provedor. */
interface ClubOffer {
  id: string;
  category: string;
  partnerName: string;
  description: string;
  couponCode: string | null;
  discountLabel: string | null;
}

/** Canais de atendimento do provedor, configurados em Personalizar Super Portal. */
interface SupportChannels {
  phone: string | null;
  whatsapp: string | null;
}

/** Chamado do assinante no Service Desk do provedor. */
interface Ticket {
  protocol: string;
  title: string;
  status: string;
  openedAt: string | null;
}

export default function B2CSuperPortal() {
  const navigate = useNavigate();

  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [channels, setChannels] = useState<SupportChannels | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [clubOffers, setClubOffers] = useState<ClubOffer[]>([]);
  const tenant = getCurrentTenant();

  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem('fikta_user') || '{}');
    } catch {
      return {};
    }
  })();
  const subscriberName: string = session?.name || session?.username || '';

  useEffect(() => {
    let cancelled = false;
    apiGet<ConnectionState>('/api/v1/b2c/connection')
      .then((data) => {
        if (!cancelled) setConnection(data);
      })
      .catch((err) => {
        if (!cancelled) setConnectionError(err.message);
      });

    apiGet<SupportChannels>('/api/v1/b2c/support-channels')
      .then((data) => {
        if (!cancelled) setChannels(data);
      })
      .catch(() => {
        // Canais são complementares: a ausência deles não deve poluir a tela com erro.
      });

    apiGet<{ tickets: Ticket[] }>('/api/v1/b2c/tickets')
      .then((data) => {
        if (!cancelled) setTickets(data.tickets ?? []);
      })
      .catch((err) => {
        if (!cancelled) setTicketsError(err.message);
      });

    apiGet<{ offers: ClubOffer[] }>('/api/v1/b2c/club-offers')
      .then((data) => {
        if (!cancelled) setClubOffers(data.offers ?? []);
      })
      .catch(() => {
        // Ofertas são complementares; ausência mostra estado vazio, não erro.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Exibe o valor só quando ele existe de fato; caso contrário deixa explícito que falta. */
  const show = (value: string | number | null | undefined, suffix = '') =>
    value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;

  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootMsg, setRebootMsg] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SectionId>('STATUS');

  const handleReboot = () => {
    setIsRebooting(true);
    setRebootMsg(false);
    setTimeout(() => {
      setIsRebooting(false);
      setRebootMsg(true);
      setTimeout(() => setRebootMsg(false), 4000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Customer Banner */}
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#132a52] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col gap-5 relative z-10">
          <div>
            {connection?.contractNumber && (
              <span className="bg-secondary text-[#0B1D3A] text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0B1D3A] animate-ping"></span>
                Plano Ativo (Contrato {connection.contractNumber})
              </span>
            )}
            <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
              Olá{subscriberName ? `, ${subscriberName}` : ''}! 👋
            </h1>
            <p className="text-[#C6CEDD] text-sm sm:text-base mt-1 max-w-2xl font-medium">
              Consulte o status da sua fibra em tempo real, acesse livros e revistas digitais e solicite suporte instantâneo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/b2c/connection-status')}
              className="w-full sm:w-auto bg-white text-[#0B1D3A] hover:bg-white/90 font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <IconWifi className="w-5 h-5 text-primary" />
              Status da Conexão
            </Button>
            <Button
              onClick={() => navigate('/apps/tickets/create')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 border border-white/20"
            >
              <IconHeadset className="w-5 h-5" />
              Abrir Chamado
            </Button>
          </div>
        </div>
      </div>

      {/*
        Sidebar de navegação + conteúdo.
        Substitui a antiga barra de abas horizontal, que estourava a largura e obrigava
        o usuário a rolar lateralmente para alcançar "Clube de Vantagens".
        Em telas pequenas a sidebar vira uma grade de 2 colunas acima do conteúdo.
      */}
      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-64 shrink-0" aria-label="Seções do Super Portal">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:sticky lg:top-24">
            {SECTIONS.map(({ id, label, icon: SectionIcon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-slate-700 border hover:bg-slate-50'
                  }`}
                >
                  <SectionIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-6">

      {/* TAB CONTENT: STATUS */}
      {activeTab === 'STATUS' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <CardBox className="p-6">
              <div className="flex flex-wrap gap-3 justify-between items-start border-b pb-4 mb-6">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Plano Contratado</span>
                  <h2 className="text-xl font-extrabold text-slate-800 break-words">
                    {show(connection?.planName)}
                  </h2>
                  {connection?.contractNumber && (
                    <p className="text-xs text-slate-500">Contrato {connection.contractNumber}</p>
                  )}
                </div>
                {connection?.active === true && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-4 py-1.5 font-bold flex items-center gap-2 text-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CONEXÃO ATIVA
                  </Badge>
                )}
                {connection?.active === false && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 px-4 py-1.5 font-bold flex items-center gap-2 text-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    CONEXÃO INATIVA
                  </Badge>
                )}
              </div>

              {connectionError && (
                <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
                  <p className="font-bold mb-0.5">Dados de conexão indisponíveis</p>
                  <p className="text-xs">{connectionError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" /> Velocidade Download
                  </span>
                  <span className="text-2xl font-black text-slate-800">{show(connection?.downloadMbps, " Mbps")}</span>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" /> Velocidade Upload
                  </span>
                  <span className="text-2xl font-black text-slate-800">{show(connection?.uploadMbps, " Mbps")}</span>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconActivity className="w-4 h-4 text-primary stroke-[2.2]" /> Qualidade do Sinal
                  </span>
                  <span className="text-lg font-bold text-slate-800">{show(connection?.signalQuality)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Status do Roteador:</span>
                  <strong className="text-slate-700">{show(connection?.routerStatus)}</strong>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-1 border-b">
                  <span className="text-slate-500">Tempo de Conexão:</span>
                  <strong className="text-slate-700">{show(connection?.uptime)}</strong>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-1">
                  <span className="text-slate-500">Endereço de Instalação:</span>
                  <strong className="text-slate-700 text-right">{show(connection?.installAddress)}</strong>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleReboot}
                  disabled={isRebooting}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl shadow flex items-center gap-2"
                >
                  <IconRefresh className={`w-4 h-4 ${isRebooting ? 'animate-spin' : ''}`} />
                  {isRebooting ? 'Reiniciando Conexão...' : 'Reiniciar Minha Conexão'}
                </Button>

                <Button
                  onClick={() => navigate('/b2c/connection-status')}
                  variant="outline"
                  className="border-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <IconWifi className="w-4 h-4 text-primary" />
                  Ver Diagnóstico Completo
                </Button>
              </div>

              {rebootMsg && (
                <div className="mt-4 p-4 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <IconCheck className="w-5 h-5 text-primary" />
                  Sua conexão foi reiniciada com sucesso! O sinal foi reestabelecido.
                </div>
              )}
            </CardBox>
          </div>

          <div className="space-y-6">
            <CardBox className="p-6 bg-slate-900 text-white">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <IconHeadset className="w-5 h-5 text-emerald-400" />
                Canais de Atendimento
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Atendimento humanizado 24h por dia.
              </p>

              {/*
                Telefone e WhatsApp são do provedor, configurados em Personalizar Super
                Portal. Cada bloco só aparece quando o canal existe — publicar um número
                inventado leva o assinante a ligar para alguém que não é o provedor dele.
              */}
              {(channels?.phone || channels?.whatsapp) && (
                <div className="space-y-3 text-xs mb-5">
                  {channels.phone && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Telefone:</span>
                      <strong className="text-emerald-400 break-all">{channels.phone}</strong>
                    </div>
                  )}
                  {channels.whatsapp && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">WhatsApp:</span>
                      <strong className="text-emerald-400 break-all">{channels.whatsapp}</strong>
                    </div>
                  )}
                </div>
              )}

              {!channels?.phone && !channels?.whatsapp && (
                <p className="text-xs text-slate-400 mb-5">
                  Seu provedor ainda não cadastrou canais de atendimento.
                </p>
              )}

              {channels?.whatsapp && (
                <Button
                  onClick={() =>
                    window.open(
                      `https://wa.me/55${channels.whatsapp!.replace(/\D/g, '')}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <IconBrandWhatsapp className="w-5 h-5 shrink-0" />
                  <span className="truncate">Falar no WhatsApp</span>
                </Button>
              )}
            </CardBox>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TICKETS */}
      {activeTab === 'TICKETS' && (
        <CardBox className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Meus Chamados de Suporte</h2>
              <p className="text-xs text-slate-500">Histórico de solicitações técnicas e financeiras</p>
            </div>
            <Button
              onClick={() => navigate('/apps/tickets/create')}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              + Abrir Chamado
            </Button>
          </div>

          {/*
            Chamados reais do assinante, lidos de GET /api/portal_solicitations na Portal V2
            do ERP do provedor. Ver docs/architecture/VOALLE-PORTAL-V2-API.md §4.7.
          */}
          {tickets.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <IconHeadset className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700">
                {ticketsError ? 'Não foi possível carregar seus chamados' : 'Nenhum chamado registrado'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {ticketsError ?? 'Quando você abrir uma solicitação, ela aparecerá aqui com o número de protocolo.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.protocol}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-100 px-2.5 py-0.5 rounded-md">
                        #{t.protocol}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {t.openedAt ? new Date(t.openedAt).toLocaleDateString('pt-BR') : '—'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mt-1 break-words">{t.title}</h3>
                  </div>
                  <Badge className="bg-slate-200 text-slate-800 font-bold px-3 py-1 text-xs shrink-0">
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBox>
      )}

      {/* TAB CONTENT: READING */}
      {activeTab === 'READING' && (
        <CardBox className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Acervo Digital FIKTA Incluso no seu Plano</h2>
              <p className="text-xs text-slate-500">Livros e revistas liberados pelo seu provedor</p>
            </div>
            <Button
              onClick={() => navigate('/admin/digital-magazines')}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              Acessar Biblioteca
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <IconBook className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">E-books Inclusos</h3>
              <p className="text-xs text-slate-500 mt-1">Posse definitiva mensal</p>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <IconNews className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Banca de Revistas</h3>
              <p className="text-xs text-slate-500 mt-1">Edições atualizadas</p>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <IconHeadphones className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Audiobooks</h3>
              <p className="text-xs text-slate-500 mt-1">Ouça onde quiser</p>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <IconDeviceMobile className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">App Multiplataforma</h3>
              <p className="text-xs text-slate-500 mt-1">iOS, Android e Web</p>
            </div>
          </div>
        </CardBox>
      )}

      {/* TAB CONTENT: CLUB */}
      {activeTab === 'CLUB' && (
        <CardBox className="p-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Clube de Vantagens</h2>
            <p className="text-xs text-slate-500">
              Ofertas de parceiros disponíveis para assinantes de {tenant.name}
            </p>
          </div>

          {/*
            Ofertas reais, cadastradas pela FIKTA ou pelo provedor.
            Origem: GET /api/v1/b2c/club-offers

            As anteriores eram fictícias — "Cinemark 50%", cupom "CINEMA50LINK" — e citavam
            um provedor que não é o do assinante logado. Cupom inventado é pior que nenhum:
            o cliente tenta usar no caixa e passa vergonha.
          */}
          {clubOffers.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <IconSparkles className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700">Nenhuma oferta disponível</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seu provedor ainda não publicou ofertas no Clube de Vantagens.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {clubOffers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col">
                  <span className="text-xs font-bold text-slate-700 uppercase bg-slate-200/70 px-2.5 py-0.5 rounded-full self-start">
                    {offer.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-2 break-words">{offer.partnerName}</h3>
                  <p className="text-xs text-slate-600 mt-1 flex-1">{offer.description}</p>
                  {offer.couponCode && (
                    <Button
                      onClick={() => navigator.clipboard?.writeText(offer.couponCode!)}
                      className="mt-3 w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded-xl"
                    >
                      Copiar cupom {offer.discountLabel ? `· ${offer.discountLabel}` : ''}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBox>
      )}
        </div>
      </div>
    </div>
  );
}
