import { useState } from 'react';
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

export default function B2CSuperPortal() {
  const navigate = useNavigate();

  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootMsg, setRebootMsg] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'STATUS' | 'TICKETS' | 'READING' | 'CLUB'>('STATUS');

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
            <span className="bg-secondary text-[#0B1D3A] text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-[#0B1D3A] animate-ping"></span>
              Plano Ativo (Contrato •••482)
            </span>
            <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
              Olá, Carlos Eduardo! 👋
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

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STATUS')}
          className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'STATUS'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-slate-700 border hover:bg-slate-50'
          }`}
        >
          <IconWifi className="w-4 h-4" />
          Status de Conexão
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'TICKETS'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-slate-700 border hover:bg-slate-50'
          }`}
        >
          <IconHeadset className="w-4 h-4" />
          Suporte & Chamados
        </button>

        <button
          onClick={() => setActiveTab('READING')}
          className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'READING'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-slate-700 border hover:bg-slate-50'
          }`}
        >
          <IconBook className="w-4 h-4" />
          Leitura Digital FIKTA
        </button>

        <button
          onClick={() => setActiveTab('CLUB')}
          className={`whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'CLUB'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-slate-700 border hover:bg-slate-50'
          }`}
        >
          <IconSparkles className="w-4 h-4" />
          Clube de Vantagens
        </button>
      </div>

      {/* TAB CONTENT: STATUS */}
      {activeTab === 'STATUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardBox className="p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Plano Contratado</span>
                  <h2 className="text-xl font-extrabold text-slate-800">Fibra Ultra 500 Mega Turbo</h2>
                  <p className="text-xs text-slate-500">Contrato •••482 • Conexão Segura & Protegida</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-4 py-1.5 font-bold flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CONEXÃO ATIVA
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" /> Velocidade Download
                  </span>
                  <span className="text-2xl font-black text-slate-800">512.4 Mbps</span>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" /> Velocidade Upload
                  </span>
                  <span className="text-2xl font-black text-slate-800">256.1 Mbps</span>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <IconActivity className="w-4 h-4 text-primary stroke-[2.2]" /> Qualidade do Sinal
                  </span>
                  <span className="text-lg font-bold text-slate-800">Excelente (Sinal 100%)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Status do Roteador:</span>
                  <strong className="text-slate-700">Wi-Fi 6 (Conectado)</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Tempo de Conexão:</span>
                  <strong className="text-slate-700">14 dias, 08 horas e 22 min</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Segurança da Rede:</span>
                  <strong className="text-primary font-bold flex items-center gap-1">
                    <IconShieldCheck className="w-4 h-4" /> Conexão Criptografada
                  </strong>
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

              <div className="space-y-3 text-xs mb-5">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between">
                  <span className="text-slate-400">Telefone 0800:</span>
                  <strong className="text-emerald-400">0800 591 2000</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between">
                  <span className="text-slate-400">WhatsApp:</span>
                  <strong className="text-emerald-400">(11) 98888-4000</strong>
                </div>
              </div>

              <Button
                onClick={() => window.open('https://wa.me/5511988884000', '_blank')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <IconBrandWhatsapp className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
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

          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">#INC-84920</span>
                  <span className="text-xs font-semibold text-slate-500">10/08/2026</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Solicitação de Ajuste de DNS e Troca de Senha Wi-Fi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Atendente: Suporte Técnico LinkProvedor</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
                RESOLVIDO
              </Badge>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-100 px-2.5 py-0.5 rounded-md">#INC-77102</span>
                  <span className="text-xs font-semibold text-slate-500">01/08/2026</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Verificação de Sinal da Conexão</h3>
                <p className="text-xs text-slate-500 mt-0.5">Atendente: Equipe de Atendimento</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
                RESOLVIDO
              </Badge>
            </div>
          </div>
        </CardBox>
      )}

      {/* TAB CONTENT: READING */}
      {activeTab === 'READING' && (
        <CardBox className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Acervo Digital FIKTA Incluso no seu Plano</h2>
              <p className="text-xs text-slate-500">+12.000 livros digitais e revistas mensais renomadas</p>
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
            <h2 className="text-xl font-bold text-slate-800">Clube de Vantagens & Descontos</h2>
            <p className="text-xs text-slate-500">Descontos exclusivos em parceiros nacionais para clientes do LinkProvedor</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <span className="text-xs font-bold text-amber-700 uppercase bg-amber-200/60 px-2.5 py-0.5 rounded-full">Cinema</span>
              <h3 className="text-base font-bold text-slate-800 mt-2">Cinemark & UCI</h3>
              <p className="text-xs text-slate-600 mt-1">50% de desconto em ingressos inteira para assinantes.</p>
              <Button onClick={() => alert('Cupom copiado: CINEMA50LINK')} className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl">
                Pegar Cupom 50% OFF
              </Button>
            </div>

            <div className="p-4 rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <span className="text-xs font-bold text-blue-700 uppercase bg-blue-200/60 px-2.5 py-0.5 rounded-full">E-Commerce</span>
              <h3 className="text-base font-bold text-slate-800 mt-2">Magalu & Fast Shop</h3>
              <p className="text-xs text-slate-600 mt-1">Até 15% de desconto extra na compra de eletrônicos.</p>
              <Button onClick={() => alert('Cupom copiado: DESCONTO15NET')} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl">
                Pegar Cupom 15% OFF
              </Button>
            </div>

            <div className="p-4 rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 uppercase bg-emerald-200/60 px-2.5 py-0.5 rounded-full">Farmácias</span>
              <h3 className="text-base font-bold text-slate-800 mt-2">Drogasil & Raia</h3>
              <p className="text-xs text-slate-600 mt-1">Até 30% de desconto em medicamentos e perfumaria.</p>
              <Button onClick={() => alert('Cupom copiado: SAUDE30LINK')} className="mt-3 w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded-xl">
                Pegar Cupom 30% OFF
              </Button>
            </div>
          </div>
        </CardBox>
      )}
    </div>
  );
}
