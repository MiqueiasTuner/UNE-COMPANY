import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

const GlobalSettings = () => {
  const [smtpServer, setSmtpServer] = useState('smtp.fikta.com.br');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('no-reply@fikta.com.br');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [maxOverdue, setMaxOverdue] = useState('2');
  const [activeDrm, setActiveDrm] = useState(true);
  const [catalogSync, setCatalogSync] = useState('24');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configurações globais do sistema salvas com sucesso no banco de dados Master!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Configurações Globais</h3>
        <p className="text-sm text-muted-foreground">Administre as variáveis operacionais e limites do ecossistema FIKTA</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Notifications Config */}
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon icon="tabler:mail" className="text-primary" />
              Notificações de E-mail (Servidor SMTP)
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Servidor SMTP Principal</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Porta SMTP</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Usuário SMTP</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Senha SMTP</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
            </div>
          </CardBox>

          {/* Eligibility Engine Variables */}
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon icon="tabler:engine" className="text-primary" />
              Parâmetros Engine de Elegibilidade
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Período de Graça (Dias Overdue)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 pr-12 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-muted-foreground font-semibold">dias</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Carência financeira antes de cortar o acesso do leitor final.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Máximo de Faturas em Atraso</label>
                <input
                  type="number"
                  value={maxOverdue}
                  onChange={(e) => setMaxOverdue(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Bloqueio automático se o ERP registrar mais que essa quantidade.</p>
              </div>
            </div>
          </CardBox>
        </div>

        {/* Global Security & DRM Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <CardBox>
              <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon icon="tabler:shield" className="text-primary" />
                Segurança DRM e Distribuição de E-books
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <div>
                    <span className="font-semibold text-foreground text-sm">Criptografia de Arquivos EPUB/PDF ativa (DRM)</span>
                    <p className="text-xs text-muted-foreground">Garante URLs assinadas e impede download direto sem chave de sessão.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDrm(!activeDrm)}
                    className={`h-6 w-11 rounded-full transition-colors relative ${activeDrm ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 bg-white h-5 w-5 rounded-full shadow-sm transition-transform ${activeDrm ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-foreground text-sm">Frequência Sincronização Catálogo ISP</span>
                    <p className="text-xs text-muted-foreground">Intervalo em horas para sincronizar whitelists globais dos provedores.</p>
                  </div>
                  <select
                    value={catalogSync}
                    onChange={(e) => setCatalogSync(e.target.value)}
                    className="border border-border bg-white dark:bg-dark p-2 rounded-lg text-sm text-foreground font-semibold"
                  >
                    <option value="6">A cada 6 horas</option>
                    <option value="12">A cada 12 horas</option>
                    <option value="24">A cada 24 horas</option>
                    <option value="48">A cada 48 horas</option>
                  </select>
                </div>
              </div>
            </CardBox>
          </div>
          <div>
            <CardBox className="h-full flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Icon icon="tabler:key" className="text-primary" />
                  Termos Licenciamento
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  As regras de elegibilidade da Anatel sobre Serviços de Valor Adicionado (SVA) exigem termos claros de distribuição desvinculada para benefício fiscal do provedor.
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition-all mt-4"
              >
                Salvar Configurações Globais
              </button>
            </CardBox>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GlobalSettings;
