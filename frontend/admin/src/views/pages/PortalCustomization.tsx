import { useState } from 'react';
import CardBox from 'src/components/shared/CardBox';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import {
  IconSettings,
  IconPalette,
  IconEye,
  IconCheck,
  IconDeviceMobile,
  IconWifi,
  IconHeadset,
  IconBook,
  IconBrandWhatsapp,
  IconRefresh,
  IconSparkles,
  IconDeviceDesktop,
} from '@tabler/icons-react';

const BCrumb = [
  { to: '/', title: 'Início' },
  { title: 'Parametrização do Super Portal B2C' },
];

export default function PortalCustomization() {
  // Feature Toggles State
  const [enableConnectionStatus, setEnableConnectionStatus] = useState<boolean>(true);
  const [enableRemoteReboot, setEnableRemoteReboot] = useState<boolean>(true);
  const [enableTickets, setEnableTickets] = useState<boolean>(true);
  const [enableDigitalReading, setEnableDigitalReading] = useState<boolean>(true);
  const [enableBenefitsClub, setEnableBenefitsClub] = useState<boolean>(true);
  const [enableWhatsappFloat, setEnableWhatsappFloat] = useState<boolean>(true);

  // Branding Customization State
  const [ispName, setIspName] = useState<string>('LinkProvedor Telecom');
  const [brandColor, setBrandColor] = useState<string>('#51A8B1');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('Seja bem-vindo à Central do Assinante Super Portal!');
  const [supportPhone, setSupportPhone] = useState<string>('0800 591 2000');
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>('(11) 98888-4000');
  const [logoUrl, setLogoUrl] = useState<string>('');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <BreadcrumbComp title="Parametrização & Personalização do Super Portal B2C" items={BCrumb} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
              White-Label & Custom Experiência B2C
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">Personalização do Super Portal ISP</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Configure as funcionalidades ativas, cores da marca e canais de suporte para os seus clientes finais. Crie uma experiência sob medida com a identidade visual do seu provedor.
            </p>
          </div>

          <Button
            onClick={handleSaveSettings}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <IconCheck className="w-5 h-5" />
            Salvar Parametrização
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <IconCheck className="w-5 h-5 text-primary" />
          Parametrização do Super Portal B2C atualizada com sucesso! Todas as alterações já estão visíveis para os seus clientes.
        </div>
      )}

      {/* Main Grid: Settings Form vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parametrization Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Feature Toggles Card */}
          <CardBox className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <IconSettings className="w-5 h-5 text-indigo-600" />
              Módulos e Recursos Ativos
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Habilite ou desabilite os serviços disponíveis no portal do seu cliente final.
            </p>

            <div className="space-y-4">
              {/* Toggle 1: Status de Conexão */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconWifi className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Consulta de Status de Conexão por Contrato</span>
                    <span className="text-xs text-slate-500">Permite ao cliente verificar velocidade, latência e diagnóstico da fibra em tempo real</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableConnectionStatus}
                  onChange={(e) => setEnableConnectionStatus(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Toggle 2: Reinício Remoto ONU */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconRefresh className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Comando de Reinício Remoto de ONU/Sinal</span>
                    <span className="text-xs text-slate-500">Permite ao cliente reiniciar o sinal de fibra de forma prática e remota</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRemoteReboot}
                  onChange={(e) => setEnableRemoteReboot(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Toggle 3: Abertura de Chamados */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconHeadset className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Sistema de Abertura & Consulta de Chamados</span>
                    <span className="text-xs text-slate-500">Abertura de chamados com diagnóstico e histórico automático da linha</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableTickets}
                  onChange={(e) => setEnableTickets(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Toggle 4: Leitura Digital */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconBook className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Biblioteca Digital & Banca de Revistas (FIKTA)</span>
                    <span className="text-xs text-slate-500">Exibe acervo digital de e-books e revistas exclusivas vinculadas ao plano</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableDigitalReading}
                  onChange={(e) => setEnableDigitalReading(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Toggle 5: Clube de Vantagens */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconSparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Clube de Vantagens & Parcerias Comerciais</span>
                    <span className="text-xs text-slate-500">Cupons de desconto em grandes marcas e cinema para os seus assinantes</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableBenefitsClub}
                  onChange={(e) => setEnableBenefitsClub(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Toggle 6: Botão WhatsApp */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <IconBrandWhatsapp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Botão Flutuante de Atendimento WhatsApp</span>
                    <span className="text-xs text-slate-500">Exibe ícone flutuante do WhatsApp para contato direto no canto da tela</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableWhatsappFloat}
                  onChange={(e) => setEnableWhatsappFloat(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </CardBox>

          {/* Identity & Branding Card */}
          <CardBox className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <IconPalette className="w-5 h-5 text-purple-600" />
              Identidade Visual & Marca do Provedor
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Personalize o visual e as informações institucionais do seu Super Portal.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Nome Comercial do Provedor (ISP)</Label>
                <Input
                  value={ispName}
                  onChange={(e) => setIspName(e.target.value)}
                  placeholder="Ex: LinkProvedor Telecom"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1 block">Cor Primária da Marca</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-1"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="font-mono text-sm uppercase"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1 block">Telefone 0800 Suporte</Label>
                  <Input
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="Ex: 0800 591 2000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">WhatsApp de Atendimento</Label>
                <Input
                  value={supportWhatsapp}
                  onChange={(e) => setSupportWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98888-4000"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Mensagem de Boas-Vindas B2C</Label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </CardBox>
        </div>

        {/* Right Column: Interactive Smartphone / Portal Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <CardBox className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <IconEye className="w-4 h-4 text-primary" />
                Preview em Tempo Real do Super Portal B2C
              </h2>
              <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs">
                Smartphone View
              </Badge>
            </div>

            {/* Smartphone Outer Shell */}
            <div className="mx-auto max-w-[320px] bg-slate-900 rounded-[38px] p-4 shadow-2xl border-4 border-slate-800 relative">
              {/* Camera Notch */}
              <div className="w-28 h-4 bg-slate-900 mx-auto rounded-b-xl absolute top-4 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center">
                <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
              </div>

              {/* Smartphone Display Screen */}
              <div className="bg-slate-50 rounded-[28px] overflow-hidden text-slate-800 pt-8 pb-4 min-h-[580px] flex flex-col justify-between relative shadow-inner">
                {/* Simulated Header with ISP Color */}
                <div
                  style={{ backgroundColor: brandColor }}
                  className="p-4 text-white shadow-md transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm uppercase tracking-wide truncate max-w-[180px]">
                      {ispName || 'Provedor ISP'}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">B2C Portal</span>
                  </div>
                  <p className="text-[11px] opacity-90 mt-1 line-clamp-1">
                    {welcomeMessage}
                  </p>
                </div>

                {/* Simulated Scrollable Portal Content */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[440px]">
                  {/* Connection Status Widget (If Enabled) */}
                  {enableConnectionStatus ? (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Status da Banda Larga</span>
                        <span className="text-[10px] font-bold text-primary bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ONLINE
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">Plano Fibra 500 Mega</div>
                      <div className="text-[11px] text-slate-500">Sinal Óptico: -18.4 dBm</div>

                      {enableRemoteReboot && (
                        <div className="mt-2 pt-2 border-t flex justify-end">
                          <button
                            style={{ color: brandColor }}
                            className="text-[10px] font-bold flex items-center gap-1 hover:underline"
                          >
                            <IconRefresh className="w-3 h-3" /> Reiniciar Sinal
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-100 rounded-xl text-center text-[10px] text-slate-400 italic">
                      [Módulo Status de Conexão Desativado]
                    </div>
                  )}

                  {/* Tickets Widget (If Enabled) */}
                  {enableTickets && (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                          <IconHeadset className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Suporte Técnico</div>
                          <div className="text-[10px] text-slate-500">Abrir chamado 24h</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/50">
                        Abrir
                      </span>
                    </div>
                  )}

                  {/* Digital Reading Widget (If Enabled) */}
                  {enableDigitalReading && (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                          <IconBook className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Biblioteca Digital FIKTA</div>
                          <div className="text-[10px] text-slate-500">+12.000 livros & revistas</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-md h-12 flex items-center justify-center text-[9px] text-emerald-900 font-bold text-center p-1">
                          E-book 1
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-md h-12 flex items-center justify-center text-[9px] text-emerald-900 font-bold text-center p-1">
                          Revista Tech
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-md h-12 flex items-center justify-center text-[9px] text-emerald-900 font-bold text-center p-1">
                          Audiobook
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefits Club Widget (If Enabled) */}
                  {enableBenefitsClub && (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                          <IconSparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Clube de Vantagens</div>
                          <div className="text-[10px] text-slate-500">Descontos exclusivos</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/50">
                        Ver Cupons
                      </span>
                    </div>
                  )}

                  {/* Support Contacts Info */}
                  <div className="p-3 bg-slate-100/70 rounded-xl text-[10px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-700 uppercase">Canais de Atendimento</div>
                    <div>📞 0800: {supportPhone}</div>
                    <div>💬 WhatsApp: {supportWhatsapp}</div>
                  </div>
                </div>

                {/* Simulated Floating WhatsApp Button */}
                {enableWhatsappFloat && (
                  <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-white animate-bounce cursor-pointer">
                    <IconBrandWhatsapp className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
}
