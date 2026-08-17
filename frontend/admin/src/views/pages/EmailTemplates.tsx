import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  lastUpdated: string;
  status: 'active' | 'draft';
}

const initialTemplates: EmailTemplate[] = [
  { id: '1', name: 'Boas-vindas ao App de Leitura', subject: 'Seu acesso à biblioteca digital está disponível!', category: 'Onboarding', lastUpdated: '10/08/2026', status: 'active' },
  { id: '2', name: 'Ativação de Assinatura', subject: 'Sua assinatura FIKTA foi ativada com sucesso.', category: 'Transacional', lastUpdated: '09/08/2026', status: 'active' },
  { id: '3', name: 'Lembrete de Renovação Mensal', subject: 'Seu plano de leitura renova em breve.', category: 'Renovação', lastUpdated: '02/08/2026', status: 'draft' },
  { id: '4', name: 'Novidades do Mês - Revista & Livros', subject: 'Confira os novos títulos adicionados para você!', category: 'Marketing', lastUpdated: '28/07/2026', status: 'active' },
];

type DomainStatus = 'unverified' | 'checking' | 'verified' | 'failed';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [smtpServer, setSmtpServer] = useState('smtp.provedor.com.br');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('comunicacao@meuprovedor.net.br');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••');
  const [senderName, setSenderName] = useState('Meu Provedor - Biblioteca Digital');
  const [customDomain, setCustomDomain] = useState('meuprovedor.net.br');

  // Domain (SPF/DKIM) verification workflow
  const [domainStatus, setDomainStatus] = useState<DomainStatus>('unverified');
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  // Test send workflow
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testSendState, setTestSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const dnsRecords = [
    { id: 'spf', type: 'TXT', host: customDomain || 'seudominio.com.br', value: 'v=spf1 include:spf.fikta.com.br ~all' },
    { id: 'dkim', type: 'CNAME', host: `fikta._domainkey.${customDomain || 'seudominio.com.br'}`, value: 'fikta._domainkey.fikta.com.br' },
    { id: 'return-path', type: 'CNAME', host: `bounce.${customDomain || 'seudominio.com.br'}`, value: 'bounce.fikta.com.br' },
  ];

  const handleVerifyDomain = () => {
    if (!customDomain.trim()) return;
    setDomainStatus('checking');
    setTimeout(() => {
      // Mock check: treat it as verified once the provider has actually saved a domain.
      setDomainStatus('verified');
    }, 1600);
  };

  const handleCopyRecord = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedRecord(id);
    setTimeout(() => setCopiedRecord((prev) => (prev === id ? null : prev)), 1500);
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    setTestSendState('sending');
    setTimeout(() => {
      setTestSendState(domainStatus === 'verified' ? 'sent' : 'error');
    }, 1200);
  };

  // Modal stats for custom request
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  
  // Modal stats for editor
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');

  const handleRequestTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Solicitação de template "${requestTitle}" enviada com sucesso para a equipe de suporte FIKTA!`);
    setIsRequestModalOpen(false);
    setRequestTitle('');
    setRequestDescription('');
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configurações de SMTP e domínio próprio salvas com sucesso!');
  };

  const openEditModal = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditHtml(`<html>
  <body style="font-family: sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0B1D3A;">${tpl.name}</h2>
      <p>Olá, [Nome do Cliente]!</p>
      <p>Este é o conteúdo customizado para o template da categoria <strong>${tpl.category}</strong>.</p>
      <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0B1D3A; font-style: italic;">
        Aproveite milhares de livros e revistas disponíveis na plataforma FIKTA!
      </p>
      <br/>
      <a href="#" style="background-color: #0B1D3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Acessar Minha Biblioteca
      </a>
    </div>
  </body>
</html>`);
    setIsEditModalOpen(true);
  };

  const handleSaveTemplateEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, subject: editSubject, lastUpdated: new Date().toLocaleDateString('pt-BR') } : t));
    alert(`Alterações no template "${editingTemplate.name}" salvas com sucesso!`);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Gestão de E-mails</h3>
          <p className="text-sm text-muted-foreground">Configure SMTP e gerencie templates de notificação com domínio próprio</p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
        >
          <Icon icon="tabler:mail-fast" width={18} />
          Solicitar Novo Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Domain and SMTP Config Column */}
        <div className="lg:col-span-1 space-y-6">
          <CardBox>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Icon icon="tabler:server-cog" className="text-primary" width={20} />
                Servidor SMTP & Domínio
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Defina as credenciais para enviar e-mails aos seus clientes finais a partir do seu próprio domínio.
            </p>

            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Domínio Remetente</label>
                <input
                  type="text"
                  required
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value);
                    setDomainStatus('unverified');
                  }}
                  placeholder="Ex: seuprovedor.com.br"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome do Remetente</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ex: Suporte Provedor"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Servidor SMTP</label>
                <input
                  type="text"
                  required
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Usuário SMTP</label>
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Porta</label>
                  <input
                    type="text"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Senha SMTP</label>
                <input
                  type="password"
                  required
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="pt-2">
                {domainStatus === 'verified' ? (
                  <div className="bg-emerald-500/10 text-emerald-500 text-xs p-3 rounded-lg border border-emerald-500/20 mb-3 flex items-start gap-2">
                    <Icon icon="tabler:shield-check" className="mt-0.5 shrink-0" width={16} />
                    <div>
                      <span className="font-bold">DKIM & SPF Verificados:</span> Seus e-mails estão protegidos contra SPAM e usam assinatura digital ativa.
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 text-amber-600 text-xs p-3 rounded-lg border border-amber-500/20 mb-3 flex items-start gap-2">
                    <Icon icon="tabler:alert-triangle" className="mt-0.5 shrink-0" width={16} />
                    <div>
                      <span className="font-bold">Domínio ainda não verificado.</span> Adicione os registros DNS abaixo para autenticar seus envios.
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                Salvar Configurações
              </button>
            </form>
          </CardBox>

          {/* DNS / Domain verification workflow */}
          <CardBox>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Icon icon="tabler:certificate" className="text-primary" width={20} />
                Verificação de Domínio
              </h4>
              {domainStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Icon icon="tabler:circle-check-filled" width={12} />
                  Verificado
                </span>
              )}
              {domainStatus === 'checking' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Icon icon="tabler:loader-2" width={12} className="animate-spin" />
                  Verificando
                </span>
              )}
              {domainStatus === 'unverified' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Adicione estes registros no DNS de <strong className="text-foreground">{customDomain || 'seudominio.com.br'}</strong> para autenticar SPF e DKIM.
            </p>

            <div className="space-y-2">
              {dnsRecords.map((rec) => (
                <div key={rec.id} className="border border-border rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-[10px] bg-muted/30 text-foreground px-1.5 py-0.5 rounded">{rec.type}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRecord(rec.id, rec.value)}
                      className="text-muted-foreground hover:text-primary transition-all flex items-center gap-1 text-[10px] font-semibold"
                    >
                      <Icon icon={copiedRecord === rec.id ? 'tabler:check' : 'tabler:copy'} width={12} />
                      {copiedRecord === rec.id ? 'Copiado' : 'Copiar valor'}
                    </button>
                  </div>
                  <p className="font-mono text-muted-foreground truncate" title={rec.host}>Host: {rec.host}</p>
                  <p className="font-mono text-muted-foreground truncate" title={rec.value}>Valor: {rec.value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyDomain}
              disabled={domainStatus === 'checking'}
              className="w-full mt-4 border border-primary text-primary hover:bg-primary/5 disabled:opacity-50 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Icon icon={domainStatus === 'checking' ? 'tabler:loader-2' : 'tabler:refresh'} width={16} className={domainStatus === 'checking' ? 'animate-spin' : ''} />
              {domainStatus === 'checking' ? 'Verificando registros...' : 'Verificar Domínio'}
            </button>
          </CardBox>

          {/* Test send */}
          <CardBox>
            <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon icon="tabler:send" className="text-primary" width={20} />
              Testar Envio
            </h4>
            <form onSubmit={handleSendTestEmail} className="space-y-3">
              <input
                type="email"
                required
                value={testEmailAddress}
                onChange={(e) => { setTestEmailAddress(e.target.value); setTestSendState('idle'); }}
                placeholder="seuemail@exemplo.com.br"
                className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
              />
              <button
                type="submit"
                disabled={testSendState === 'sending'}
                className="w-full bg-foreground/5 hover:bg-foreground/10 text-foreground disabled:opacity-50 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Icon icon={testSendState === 'sending' ? 'tabler:loader-2' : 'tabler:mail-forward'} width={16} className={testSendState === 'sending' ? 'animate-spin' : ''} />
                {testSendState === 'sending' ? 'Enviando...' : 'Enviar E-mail de Teste'}
              </button>
              {testSendState === 'sent' && (
                <p className="text-xs text-emerald-500 flex items-center gap-1.5"><Icon icon="tabler:circle-check" width={14} /> E-mail de teste enviado com sucesso via {customDomain}.</p>
              )}
              {testSendState === 'error' && (
                <p className="text-xs text-red-500 flex items-center gap-1.5"><Icon icon="tabler:circle-x" width={14} /> Verifique o domínio antes de testar o envio.</p>
              )}
            </form>
          </CardBox>
        </div>

        {/* Templates List Column */}
        <div className="lg:col-span-2 space-y-6">
          <CardBox>
            <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon icon="tabler:template" className="text-primary" width={20} />
              Modelos de E-mail Personalizáveis
            </h4>
            <p className="text-xs text-muted-foreground mb-6">
              Edite o assunto e conteúdo dos e-mails disparados automaticamente para seus assinantes.
            </p>

            <div className="space-y-4">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-4 border border-border rounded-xl hover:border-primary/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{tpl.name}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold uppercase">{tpl.category}</span>
                      {tpl.status === 'active' ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Ativo" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Rascunho" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">Assunto: {tpl.subject}</p>
                    <p className="text-[10px] text-muted-foreground">Atualizado em: {tpl.lastUpdated}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="border border-border text-foreground hover:bg-muted/10 p-2 rounded-lg text-xs flex items-center gap-1.5 font-medium transition-all"
                    >
                      <Icon icon="tabler:edit" width={14} />
                      Editar HTML
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardBox>
        </div>
      </div>

      {/* Request custom template modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-2">Solicitar Template Customizado</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Precisa de um layout especial ou design exclusivo? Peça para a equipe da <strong>FIKTA</strong> criar para você.
            </p>
            <form onSubmit={handleRequestTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Título ou Finalidade *</label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="Ex: Campanha de Black Friday"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Instruções e Conteúdo desejado *</label>
                <textarea
                  required
                  rows={4}
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Descreva as cores, textos, banners ou links que devem constar no e-mail..."
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit HTML and details modal */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-5xl p-6 rounded-xl shadow-lg relative animate-fade-in max-h-[90vh] flex flex-col">
            <h4 className="text-lg font-bold text-foreground mb-1">Editar Template: {editingTemplate.name}</h4>
            <p className="text-xs text-muted-foreground mb-4">Utilize marcadores como [Nome do Cliente] para tags dinâmicas.</p>
            
            <form onSubmit={handleSaveTemplateEdits} className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* Side-by-Side Editor and Live Preview */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[350px] overflow-hidden">
                
                {/* HTML Editor */}
                <div className="flex flex-col h-full overflow-hidden">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Código HTML do Template</label>
                  <textarea
                    required
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    className="flex-1 w-full border border-border bg-transparent p-3 rounded-lg text-xs font-mono focus:outline-none focus:border-primary text-foreground resize-none overflow-y-auto"
                  />
                </div>

                {/* HTML Visual Live Preview */}
                <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-white">
                  <div className="bg-muted/30 p-2 border-b border-border flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase shrink-0">
                    <span>Visualização em Tempo Real</span>
                    <Icon icon="tabler:eye" className="text-primary" width={14} />
                  </div>
                  <iframe
                    srcDoc={editHtml}
                    title="Live Preview"
                    className="w-full flex-1 border-0 bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
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

export default EmailTemplates;
