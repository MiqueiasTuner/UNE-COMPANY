import { useState } from 'react';
import CardBox from 'src/components/shared/CardBox';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import {
  IconWifi,
  IconRefresh,
  IconActivity,
  IconHeadset,
  IconFileText,
  IconCheck,
  IconAlertTriangle,
  IconGauge,
  IconNetwork,
  IconChevronRight,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';

interface ContractData {
  id: string;
  contractDisplay: string;
  planName: string;
  ispName: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  opticalSignal: string;
  uptime: string;
  downloadSpeed: string;
  uploadSpeed: string;
  dataUsage: string;
  dataLimit: string;
  address: string;
  deviceInfo: string;
}

const mockContracts: ContractData[] = [
  {
    id: '1',
    contractDisplay: 'Plano Principal (Contrato •••482)',
    planName: 'Fibra Ultra 500 Mega + FIKTA E-books',
    ispName: 'LinkProvedor Telecom',
    status: 'ONLINE',
    opticalSignal: 'Excelente (Sinal 100%)',
    uptime: '14 dias, 08 horas e 22 min',
    downloadSpeed: '512.4 Mbps',
    uploadSpeed: '256.1 Mbps',
    dataUsage: '482 GB',
    dataLimit: 'Ilimitado',
    address: 'Av. Paulista, 1000 - São Paulo/SP',
    deviceInfo: 'Roteador Wi-Fi 6 (Conectado)',
  },
  {
    id: '2',
    contractDisplay: 'Plano Casa de Praia (Contrato •••821)',
    planName: 'Fibra Gamer 1 Giga + Banca de Revistas',
    ispName: 'NetFibra Telecom',
    status: 'ONLINE',
    opticalSignal: 'Ótimo (Sinal 98%)',
    uptime: '45 dias, 12 horas',
    downloadSpeed: '984.2 Mbps',
    uploadSpeed: '492.0 Mbps',
    dataUsage: '1.2 TB',
    dataLimit: 'Ilimitado',
    address: 'Rua das Flores, 450 - Campinas/SP',
    deviceInfo: 'Roteador Wi-Fi 6 High Speed',
  },
  {
    id: '3',
    contractDisplay: 'Plano Escritório (Contrato •••094)',
    planName: 'Fibra Residencial 300 Mega',
    ispName: 'WebFibra Banda Larga',
    status: 'DEGRADED',
    opticalSignal: 'Atenção (Oscilação Detectada)',
    uptime: '01 dia, 03 horas',
    downloadSpeed: '120.5 Mbps',
    uploadSpeed: '45.0 Mbps',
    dataUsage: '210 GB',
    dataLimit: 'Ilimitado',
    address: 'Rua Afonso Pena, 89 - Belo Horizonte/MG',
    deviceInfo: 'Modem Fibra Standard',
  },
];

const BCrumb = [
  { to: '/', title: 'Início' },
  { title: 'Diagnóstico da Conexão' },
];

export default function ConnectionStatus() {
  const navigate = useNavigate();
  const [selectedContractId, setSelectedContractId] = useState<string>('1');
  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootSuccess, setRebootSuccess] = useState<boolean>(false);
  const [testingLatency, setTestingLatency] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<number | null>(8);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMsg, setTicketMsg] = useState<string>('');

  const currentContract = mockContracts.find((c) => c.id === selectedContractId) || mockContracts[0];

  const handleRebootOnu = () => {
    setIsRebooting(true);
    setRebootSuccess(false);
    setTimeout(() => {
      setIsRebooting(false);
      setRebootSuccess(true);
      setTimeout(() => setRebootSuccess(false), 5000);
    }, 2500);
  };

  const handleTestLatency = () => {
    setTestingLatency(true);
    setTimeout(() => {
      setPingResult(Math.floor(Math.random() * 6) + 5);
      setTestingLatency(false);
    }, 1500);
  };

  const handleOpenTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Chamado de suporte enviado com sucesso! Código do atendimento: #INC-${Math.floor(100000 + Math.random() * 900000)}`);
    setShowTicketModal(false);
    setTicketSubject('');
    setTicketMsg('');
  };

  return (
    <div className="space-y-6">
      <BreadcrumbComp title="Diagnóstico de Conexão do Assinante" items={BCrumb} />

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                Central do Assinante
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-500/40 text-emerald-100 text-xs font-medium px-3 py-1 rounded-full border border-emerald-300/30">
                <IconShieldCheck className="w-4 h-4 text-emerald-300" />
                Conexão Protegida & Criptografada
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">Status da Sua Conexão</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Consulte a qualidade da sua internet, verifique a velocidade em tempo real e realize a reinicialização remota do sinal de forma prática e segura.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowTicketModal(true)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <IconHeadset className="w-5 h-5 text-primary" />
              Solicitar Suporte
            </Button>
          </div>
        </div>
      </div>

      {/* Contract Selection Selector */}
      <CardBox className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1 block">
              Selecione o seu Plano / Endereço:
            </Label>
            <p className="text-xs text-slate-500">
              Alterne entre seus pontos de acesso para consultar a saúde da rede.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[300px]"
            >
              {mockContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractDisplay} - {c.planName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardBox>

      {/* Connection Overview & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <CardBox className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Provedor: {currentContract.ispName}
                </span>
                <h2 className="text-xl font-bold text-slate-800">{currentContract.planName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentContract.contractDisplay}</p>
              </div>

              <div className="flex items-center gap-3">
                {currentContract.status === 'ONLINE' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-4 py-1.5 text-sm font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CONEXÃO ATIVA & ONLINE
                  </Badge>
                ) : currentContract.status === 'DEGRADED' ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 px-4 py-1.5 text-sm font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce"></span>
                    OSCILAÇÃO DETECTADA
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 px-4 py-1.5 text-sm font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    DESCONECTADO
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5 text-xs font-semibold">
                  <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" />
                  Velocidade Download
                </div>
                <span className="text-lg font-bold text-slate-800">{currentContract.downloadSpeed}</span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5 text-xs font-semibold">
                  <IconGauge className="w-4 h-4 text-primary stroke-[2.2]" />
                  Velocidade Upload
                </div>
                <span className="text-lg font-bold text-slate-800">{currentContract.uploadSpeed}</span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5 text-xs font-semibold">
                  <IconActivity className="w-4 h-4 text-primary stroke-[2.2]" />
                  Qualidade do Sinal
                </div>
                <span className={`text-sm font-bold ${currentContract.status === 'DEGRADED' ? 'text-amber-600' : 'text-slate-800'}`}>
                  {currentContract.opticalSignal}
                </span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5 text-xs font-semibold">
                  <IconNetwork className="w-4 h-4 text-primary stroke-[2.2]" />
                  Tempo de Resposta (Ping)
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {pingResult !== null ? `${pingResult} ms` : '...'}
                </span>
              </div>
            </div>

            {/* User Friendly Network Details */}
            <div className="space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Resumo da Sua Assinatura
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Status do Roteador:</span>
                  <strong className="text-slate-700">{currentContract.deviceInfo}</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Tempo de Conexão:</span>
                  <strong className="text-slate-700">{currentContract.uptime}</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Consumo de Dados:</span>
                  <strong className="text-slate-700">{currentContract.dataUsage} ({currentContract.dataLimit})</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Endereço de Instalação:</span>
                  <strong className="text-slate-700 truncate max-w-[200px]" title={currentContract.address}>
                    {currentContract.address}
                  </strong>
                </div>
              </div>
            </div>

            {/* Automated Diagnostic Verification Checklist */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <IconActivity className="w-4 h-4 text-primary" />
                Diagnóstico Automático da Sua Internet
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <IconCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Sincronização de Rede: <strong>Conexão Estável & Segura</strong></span>
                </div>

                <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${currentContract.status === 'DEGRADED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                  {currentContract.status === 'DEGRADED' ? (
                    <IconAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  ) : (
                    <IconCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <span>Recepção de Sinal Fibra: <strong>{currentContract.opticalSignal}</strong></span>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <IconCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Navegação e Sites: <strong>Sem Interferências</strong></span>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <IconCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Protocolos de Segurança: <strong>Ativos & Protegidos</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-4 border-t flex flex-wrap gap-3">
              <Button
                onClick={handleRebootOnu}
                disabled={isRebooting}
                className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-xl shadow flex items-center gap-2"
              >
                <IconRefresh className={`w-4 h-4 ${isRebooting ? 'animate-spin' : ''}`} />
                {isRebooting ? 'Reiniciando Conexão...' : 'Reiniciar Minha Conexão'}
              </Button>

              <Button
                onClick={handleTestLatency}
                disabled={testingLatency}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <IconActivity className="w-4 h-4 text-purple-600" />
                {testingLatency ? 'Testando Conexão...' : 'Testar Velocidade e Ping'}
              </Button>

              <Button
                onClick={() => setShowTicketModal(true)}
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <IconHeadset className="w-4 h-4 text-primary" />
                Relatar Problema Técnico
              </Button>
            </div>

            {rebootSuccess && (
              <div className="mt-4 p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
                <IconCheck className="w-5 h-5 text-primary" />
                Sua conexão foi reiniciada com sucesso! O sinal foi reestabelecido.
              </div>
            )}
          </CardBox>
        </div>

        {/* Right Column: Support & Super Portal B2C Info */}
        <div className="space-y-6">
          {/* Support Ticket Box */}
          <CardBox className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <IconHeadset className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Suporte ao Assinante 24/7</h3>
                <p className="text-xs text-slate-300">Central de Atendimento Humanizada</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Precisa de auxílio técnico ou financeiro? Nossa equipe de atendimento está disponível 24 horas por dia.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs flex justify-between items-center">
                <span className="text-slate-400">Telefone 0800:</span>
                <strong className="text-emerald-400">0800 591 2000</strong>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs flex justify-between items-center">
                <span className="text-slate-400">WhatsApp Suporte:</span>
                <strong className="text-emerald-400">(11) 98888-4000</strong>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs flex justify-between items-center">
                <span className="text-slate-400">Atendimento:</span>
                <strong className="text-emerald-400">24h / 7 dias por semana</strong>
              </div>
            </div>

            <Button
              onClick={() => setShowTicketModal(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <IconHeadset className="w-5 h-5" />
              Falar com Atendente
            </Button>
          </CardBox>

          {/* Quick Invoice & Portal Link Box */}
          <CardBox className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <IconFileText className="w-5 h-5 text-primary" />
              Serviços Rápidos do Assinante
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => alert(`Segunda via da fatura gerada com sucesso! Código de barras: 34191.79001 01043.829104 90123.400018 7 94820000015000`)}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <IconFileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">Baixar 2ª Via da Fatura</span>
                    <p className="text-xs text-slate-500">Vencimento: 15/08/2026</p>
                  </div>
                </div>
                <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
              </button>

              <button
                onClick={() => navigate('/admin/digital-magazines')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                    <IconWifi className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">E-books & Revistas do Plano</span>
                    <p className="text-xs text-slate-500">Acesse +12.000 títulos inclusos</p>
                  </div>
                </div>
                <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
              </button>

              <button
                onClick={() => navigate('/apps/tickets')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                    <IconHeadset className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">Meus Chamados de Suporte</span>
                    <p className="text-xs text-slate-500">Consulte histórico e respostas</p>
                  </div>
                </div>
                <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
              </button>
            </div>
          </CardBox>
        </div>
      </div>

      {/* Ticket Opening Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Abrir Chamado de Suporte</h3>
                <p className="text-xs text-slate-500">{currentContract.contractDisplay} - {currentContract.ispName}</p>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenTicketSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Assunto / Categoria</Label>
                <select
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50"
                >
                  <option value="">Selecione o motivo...</option>
                  <option value="Lentidão na Internet">Lentidão na Internet / Instabilidade</option>
                  <option value="Sem Conexão / Luz Vermelha">Sem Conexão no Roteador</option>
                  <option value="Troca de Senha Wi-Fi">Solicitação de Troca de Senha Wi-Fi</option>
                  <option value="Financeiro / Fatura">Dúvida Financeira ou Fatura</option>
                  <option value="Suporte E-books / FIKTA">Dúvida sobre Leitura Digital / Revistas</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Descrição do Pedido</Label>
                <textarea
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  rows={4}
                  required
                  placeholder="Descreva o que está acontecendo com sua conexão..."
                  className="w-full p-3 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                🔒 <strong>Segurança e Privacidade:</strong> Os dados de integridade da sua linha serão verificados em segundo plano pelo nosso sistema de suporte.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTicketModal(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-5"
                >
                  Enviar Chamado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
