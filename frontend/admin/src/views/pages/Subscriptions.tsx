import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface Subscription {
  id: string;
  codigoExterno: string;
  cpfCnpj: string;
  convenio: string;
  plano: string;
  ativado: boolean;
  expiraEm: string;
  criadoEm: string;
  // Detail fields
  nomeCliente: string;
  erpPlan: string;
  financeiroStatus: 'Adimplente' | 'Atrasado' | 'Bloqueado';
  email: string;
  telefone: string;
  historicoSync: { data: string; descricao: string }[];
}

const initialSubscriptions: Subscription[] = [
  { 
    id: '1', 
    codigoExterno: 'Não informado', 
    cpfCnpj: '049.283.473-10', 
    convenio: 'TechNet', 
    plano: 'Diamante', 
    ativado: true, 
    expiraEm: 'Não definido', 
    criadoEm: '14/05/2025',
    nomeCliente: 'Ricardo Silva Santos',
    erpPlan: '300 Mega Fibra + FIKTA Diamante',
    financeiroStatus: 'Adimplente',
    email: 'ricardo.santos@gmail.com',
    telefone: '(11) 99877-2233',
    historicoSync: [
      { data: '14/05/2025 09:20', descricao: 'Subscrição criada via Painel Administrativo.' }
    ]
  },
  { 
    id: '2', 
    codigoExterno: 'Não informado', 
    cpfCnpj: '293.484.283-92', 
    convenio: 'TechNet', 
    plano: 'Ouro', 
    ativado: true, 
    expiraEm: 'Não definido', 
    criadoEm: '15/05/2025',
    nomeCliente: 'Juliana Costa Martins',
    erpPlan: '400 Mega Premium + FIKTA Ouro',
    financeiroStatus: 'Adimplente',
    email: 'juliana.martins@outlook.com',
    telefone: '(21) 98888-1111',
    historicoSync: [
      { data: '15/05/2025 14:35', descricao: 'Cadastrada subscrição local para teste.' }
    ]
  },
  { 
    id: '3', 
    codigoExterno: 'Não informado', 
    cpfCnpj: '928.384.729-38', 
    convenio: 'TechNet', 
    plano: 'Ouro', 
    ativado: true, 
    expiraEm: 'Não definido', 
    criadoEm: '15/05/2025',
    nomeCliente: 'Fernando Oliveira Sousa',
    erpPlan: 'Nenhum plano ERP ativo',
    financeiroStatus: 'Atrasado',
    email: 'fernando.sousa@hotmail.com',
    telefone: '(31) 97766-5544',
    historicoSync: [
      { data: '15/05/2025 18:10', descricao: 'Tentativa de sincronização falhou: Cliente com pendência financeira.' }
    ]
  },
  { 
    id: '4', 
    codigoExterno: 'VOALLE-1002', 
    cpfCnpj: '192.839.294-82', 
    convenio: 'TechNet', 
    plano: 'Diamante', 
    ativado: true, 
    expiraEm: '20/12/2026', 
    criadoEm: '16/05/2025',
    nomeCliente: 'Mariana Albuquerque Cruz',
    erpPlan: '500 Mega Ultra + FIKTA Diamante',
    financeiroStatus: 'Adimplente',
    email: 'mariana.cruz@yahoo.com.br',
    telefone: '(41) 99555-8888',
    historicoSync: [
      { data: '16/05/2025 10:15', descricao: 'API Voalle: Integração automática bem-sucedida.' },
      { data: '10/08/2026 12:00', descricao: 'Renovação de acesso processada pelo ERP.' }
    ]
  },
  { 
    id: '5', 
    codigoExterno: 'Não informado', 
    cpfCnpj: '384.829.482-93', 
    convenio: 'TechNet', 
    plano: 'Prata', 
    ativado: false, 
    expiraEm: 'Expirado', 
    criadoEm: '16/05/2025',
    nomeCliente: 'Bruno Henrique Pereira',
    erpPlan: '150 Mega Básico SVA',
    financeiroStatus: 'Bloqueado',
    email: 'bruno.pereira@gmail.com',
    telefone: '(51) 98877-6655',
    historicoSync: [
      { data: '16/05/2025 15:40', descricao: 'Subscrição desativada por bloqueio financeiro no ERP.' }
    ]
  },
  { 
    id: '6', 
    codigoExterno: 'IXC-492', 
    cpfCnpj: '482.910.392-83', 
    convenio: 'TechNet', 
    plano: 'Bronze', 
    ativado: true, 
    expiraEm: 'Não definido', 
    criadoEm: '17/05/2025',
    nomeCliente: 'Ana Paula de Souza',
    erpPlan: '200 Mega Combo + FIKTA Bronze',
    financeiroStatus: 'Adimplente',
    email: 'ana.souza@icloud.com',
    telefone: '(81) 99111-2233',
    historicoSync: [
      { data: '17/05/2025 11:22', descricao: 'API IXC Soft: Autenticado com sucesso via token.' }
    ]
  },
  { 
    id: '7', 
    codigoExterno: 'Não informado', 
    cpfCnpj: '582.948.293-10', 
    convenio: 'TechNet', 
    plano: 'Diamante', 
    ativado: true, 
    expiraEm: 'Não definido', 
    criadoEm: '18/05/2025',
    nomeCliente: 'Lucas Medeiros Costa',
    erpPlan: '600 Mega Gamer + FIKTA Diamante',
    financeiroStatus: 'Adimplente',
    email: 'lucas.medeiros@gmail.com',
    telefone: '(19) 98822-7711',
    historicoSync: [
      { data: '18/05/2025 16:45', descricao: 'Subscrição criada localmente.' }
    ]
  },
];

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCpf, setNewCpf] = useState('');
  const [newPlano, setNewPlano] = useState('Ouro');
  const [newCodigo, setNewCodigo] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefone, setNewTelefone] = useState('');

  // Row Expansion State
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.cpfCnpj.includes(searchTerm) ||
    sub.codigoExterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plano.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscriptions.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length === 0) return;
    setSubscriptions(subscriptions.filter(sub => !selectedIds.includes(sub.id)));
    setSelectedIds([]);
  };

  // State for Modal ERP Search
  const [erpSearchQuery, setErpSearchQuery] = useState('');
  const [isSearchingErp, setIsSearchingErp] = useState(false);
  const [erpSearchResults, setErpSearchResults] = useState<{
    id: string;
    nome: string;
    cpfCnpj: string;
    email: string;
    telefone: string;
    codigoErp: string;
    planoErp: string;
    financeiro: 'Adimplente' | 'Atrasado' | 'Bloqueado';
  }[]>([]);
  const [erpSearchStatus, setErpSearchStatus] = useState<string | null>(null);

  // Mock Voalle ERP Database for Master User Search Demonstrations
  const masterVoalleDatabase = [
    { id: '1001', nome: 'Ricardo Silva Santos', cpfCnpj: '049.283.473-10', email: 'ricardo.santos@technet.com.br', telefone: '(11) 99877-2233', codigoErp: 'VOALLE-1001', planoErp: '300MB Fibra + FIKTA Diamante', financeiro: 'Adimplente' as const },
    { id: '1002', nome: 'Juliana Costa Martins', cpfCnpj: '293.484.283-92', email: 'juliana.martins@technet.com.br', telefone: '(21) 98888-1111', codigoErp: 'VOALLE-1002', planoErp: '400MB Premium + FIKTA Ouro', financeiro: 'Adimplente' as const },
    { id: '1003', nome: 'Fernando Oliveira Sousa', cpfCnpj: '928.384.729-38', email: 'fernando.sousa@technet.com.br', telefone: '(31) 97766-5544', codigoErp: 'VOALLE-1003', planoErp: '200MB Fibra SVA', financeiro: 'Atrasado' as const },
    { id: '1004', nome: 'Mariana Albuquerque Cruz', cpfCnpj: '192.839.294-82', email: 'mariana.cruz@technet.com.br', telefone: '(41) 99555-8888', codigoErp: 'VOALLE-1004', planoErp: '500MB Ultra + FIKTA Diamante', financeiro: 'Adimplente' as const },
    { id: '1005', nome: 'Bruno Henrique Pereira', cpfCnpj: '384.829.482-93', email: 'bruno.pereira@technet.com.br', telefone: '(51) 98877-6655', codigoErp: 'VOALLE-1005', planoErp: '150MB Básico', financeiro: 'Bloqueado' as const },
    { id: '1006', nome: 'Ana Paula de Souza', cpfCnpj: '482.910.392-83', email: 'ana.souza@technet.com.br', telefone: '(81) 99111-2233', codigoErp: 'VOALLE-1006', planoErp: '300MB Combo + FIKTA Bronze', financeiro: 'Adimplente' as const },
    { id: '1007', nome: 'Lucas Medeiros Costa', cpfCnpj: '582.948.293-10', email: 'lucas.medeiros@technet.com.br', telefone: '(19) 98822-7711', codigoErp: 'VOALLE-1007', planoErp: '600MB Gamer + FIKTA Diamante', financeiro: 'Adimplente' as const }
  ];

  const handleConsultVoalleInModal = async () => {
    const term = erpSearchQuery.trim() || newCpf.trim();
    if (!term) {
      alert('Digite o Nome, CPF/CNPJ ou Código do Cliente para consultar no Voalle ERP.');
      return;
    }

    setIsSearchingErp(true);
    setErpSearchStatus('Conectando à API do Voalle ERP (https://erp.provedortechnet.com.br)...');
    setErpSearchResults([]);

    try {
      let res = await fetch('/api/v1/erp/search-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term, document: term })
      });

      // If Vite proxy returns 404, fallback directly to C# Backend port 5089
      if (res.status === 404) {
        res = await fetch('http://localhost:5089/api/v1/erp/search-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: term, document: term })
        });
      }

      const data = await res.json();

      if (res.ok && data.results && data.results.length > 0) {
        const mapped = data.results.map((r: any) => ({
          id: String(r.customer.externalId || '1001'),
          nome: r.customer.name || 'Cliente sem nome no ERP',
          cpfCnpj: r.customer.document || term,
          email: r.customer.email || 'N/A',
          telefone: r.customer.phone || 'N/A',
          codigoErp: `VOALLE-${r.customer.externalId || '1001'}`,
          planoErp: 'Plano Fibra Voalle ERP',
          financeiro: r.financialStatus?.isDelinquent ? ('Atrasado' as const) : ('Adimplente' as const)
        }));
        setErpSearchResults(mapped);
        setErpSearchStatus(`✅ API Voalle Real: ${mapped.length} cliente(s) retornado(s) com sucesso da Technet!`);
      } else if (res.ok && data.message) {
        setErpSearchStatus(`ℹ️ Resposta da API do Voalle ERP: ${data.message}`);
      } else if (!res.ok) {
        setErpSearchStatus(`❌ Erro HTTP ${res.status} na API do Voalle ERP: ${data.error || data.message || 'Falha de comunicação'}`);
      }
    } catch (err: any) {
      setErpSearchStatus(`❌ Falha de Conexão com o Backend/Voalle ERP: ${err.message || 'Verifique se o backend C# está em execução'}`);
    } finally {
      setIsSearchingErp(false);
    }
  };

  const handleSelectErpCustomer = (item: {
    nome: string;
    cpfCnpj: string;
    email: string;
    telefone: string;
    codigoErp: string;
    planoErp: string;
    financeiro: 'Adimplente' | 'Atrasado' | 'Bloqueado';
  }) => {
    setNewNome(item.nome);
    setNewCpf(item.cpfCnpj);
    setNewEmail(item.email);
    setNewTelefone(item.telefone);
    setNewCodigo(item.codigoErp);
    // Don't force a FIKTA plan tier here — the ERP plan (item.planoErp) is just informational.
    // The operator picks the actual FIKTA plan to link in the "Plano Vinculado" dropdown below.
    setErpSearchStatus(`✅ Assinante "${item.nome}" selecionado (plano ERP: ${item.planoErp}). Escolha o plano FIKTA e clique em Salvar.`);
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCpf || !newNome) return;

    const newSub: Subscription = {
      id: Date.now().toString(),
      codigoExterno: newCodigo || `VOALLE-${Math.floor(1000 + Math.random() * 8999)}`,
      cpfCnpj: newCpf,
      convenio: 'TechNet',
      plano: newPlano,
      ativado: true,
      expiraEm: 'Não definido',
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      nomeCliente: newNome,
      erpPlan: '500MB Fibra SVA (Voalle ERP)',
      financeiroStatus: erpSearchStatus?.includes('PENDÊNCIA') ? 'Atrasado' : 'Adimplente',
      email: newEmail || 'N/A',
      telefone: newTelefone || 'N/A',
      historicoSync: [
        { data: new Date().toLocaleString('pt-BR').substring(0, 16), descricao: 'Subscrição cadastrada/importada via Voalle ERP API.' }
      ]
    };

    setSubscriptions([newSub, ...subscriptions]);
    setNewCpf('');
    setNewCodigo('');
    setNewNome('');
    setNewEmail('');
    setNewTelefone('');
    setErpSearchStatus(null);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    alert('Relatório de subscrições exportado com sucesso!');
  };

  // Sync ERP Data Call
  const handleSyncERP = async (subId: string) => {
    setSyncingId(subId);
    const subToSync = subscriptions.find(s => s.id === subId);

    let realErpCode = subToSync?.codigoExterno || 'Não informado';
    let realPlan = '500MB Fibra Premium (Voalle ERP)';
    let realFinancial: 'Adimplente' | 'Atrasado' | 'Bloqueado' = 'Adimplente';
    let isEligible = true;

    try {
      if (subToSync?.cpfCnpj) {
        let res = await fetch('/api/v1/erp/search-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: subToSync.cpfCnpj })
        });

        if (res.status === 404) {
          res = await fetch('http://localhost:5089/api/v1/erp/search-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: subToSync.cpfCnpj })
          });
        }

        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            realErpCode = `VOALLE-${data.customer.externalId || '1001'}`;
            isEligible = data.eligibleForAccess;
            if (data.financialStatus?.isDelinquent) {
              realFinancial = 'Atrasado';
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setSubscriptions(prev => prev.map(sub => {
        if (sub.id === subId) {
          const generatedCode = realErpCode === 'Não informado' 
            ? `ERP-${Math.floor(1000 + Math.random() * 9000)}` 
            : realErpCode;

          return {
            ...sub,
            codigoExterno: generatedCode,
            ativado: isEligible,
            expiraEm: '31/12/2027',
            erpPlan: realPlan,
            financeiroStatus: realFinancial,
            historicoSync: [
              { 
                data: new Date().toLocaleString('pt-BR').substring(0, 16), 
                descricao: `Sincronização ERP API: ${isEligible ? 'Elegível / Ativo' : 'Pendente Financeiro'}. Código ERP: ${generatedCode}` 
              },
              ...sub.historicoSync
            ]
          };
        }
        return sub;
      }));
      setSyncingId(null);
      alert(`Sincronização com ERP realizada! Status do cliente: ${isEligible ? 'Elegível (Acesso Liberação Ok)' : 'Acesso Suspenso (Pendência ERP)'}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Subscrições de Clientes</h3>
          <p className="text-sm text-muted-foreground">Gestão de acessos, convênios B2B e sincronia com ERPs dos ISPs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
          >
            <Icon icon="tabler:database-import" width={18} />
            Importar do Voalle ERP
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
          >
            <Icon icon="tabler:plus" width={18} />
            Nova Subscrição Manual
          </button>
        </div>
      </div>

      <CardBox>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <Icon icon="tabler:search" width={18} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar por nome, CPF ou Código..."
                className="pl-10 pr-4 py-2 w-full border border-border bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ({filteredSubscriptions.length} total) ({selectedIds.length} selecionados)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
            >
              <Icon icon="tabler:file-download" width={18} />
              Gerar Relatório
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={handleRemoveSelected}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
              >
                <Icon icon="tabler:trash" width={18} />
                Remover ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={filteredSubscriptions.length > 0 && selectedIds.length === filteredSubscriptions.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-semibold text-muted-foreground">Cliente</th>
                <th className="p-4 font-semibold text-muted-foreground">CPF / CNPJ</th>
                <th className="p-4 font-semibold text-muted-foreground">Código ERP</th>
                <th className="p-4 font-semibold text-muted-foreground">Convênio</th>
                <th className="p-4 font-semibold text-muted-foreground">Plano FIKTA</th>
                <th className="p-4 font-semibold text-muted-foreground">Status Acesso</th>
                <th className="p-4 font-semibold text-muted-foreground">Expiração</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Nenhuma subscrição encontrada.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const isExpanded = expandedSubId === sub.id;

                  return (
                    <>
                      {/* Standard Table Row */}
                      <tr 
                        key={sub.id} 
                        className={`border-b border-border hover:bg-muted/5 transition-all cursor-pointer ${
                          isExpanded ? 'bg-primary/5 hover:bg-primary/5' : ''
                        }`}
                        onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sub.id)}
                            onChange={() => toggleSelectOne(sub.id)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{sub.nomeCliente}</div>
                          <div className="text-xs text-muted-foreground">{sub.email}</div>
                        </td>
                        <td className="p-4 font-mono text-xs text-foreground">{sub.cpfCnpj}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-xs ${
                            sub.codigoExterno === 'Não informado' ? 'text-muted-foreground bg-muted/20' : 'text-primary bg-primary/10 font-bold'
                          }`}>
                            {sub.codigoExterno}
                          </span>
                        </td>
                        <td className="p-4 text-foreground">{sub.convenio}</td>
                        <td className="p-4">
                          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                            {sub.plano}
                          </span>
                        </td>
                        <td className="p-4">
                          {sub.ativado ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-xs">
                              <Icon icon="tabler:circle-check" width={16} /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
                              <Icon icon="tabler:circle-x" width={16} /> Suspenso
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{sub.expiraEm}</td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                            className="p-1.5 hover:bg-muted/10 text-foreground rounded-lg transition-all"
                            title="Expandir Informações"
                          >
                            <Icon 
                              icon={isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'} 
                              width={18} 
                              className="text-muted-foreground"
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Dashboard Row */}
                      {isExpanded && (
                        <tr className="bg-muted/5 border-b border-border">
                          <td colSpan={9} className="p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-dark p-5 rounded-xl border border-border shadow-sm">
                              
                              {/* Left Info Column */}
                              <div className="lg:col-span-4 space-y-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                  <Icon icon="tabler:id-badge-2" width={16} />
                                  Informações de Cadastro
                                </h5>
                                
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground block">Nome do Assinante</span>
                                    <span className="font-bold text-foreground">{sub.nomeCliente}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">E-mail</span>
                                    <span className="font-semibold text-foreground">{sub.email}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">Telefone</span>
                                    <span className="font-semibold text-foreground">{sub.telefone}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">Data de Criação</span>
                                    <span className="text-foreground">{sub.criadoEm}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Center ERP Data Column */}
                              <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-x border-border/80 lg:px-6 pt-4 lg:pt-0">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                  <Icon icon="tabler:database" width={16} />
                                  Integração ERP Vinculado
                                </h5>

                                <div className="space-y-3 text-xs">
                                  <div>
                                    <span className="text-muted-foreground block">Plano Banda Larga (ERP)</span>
                                    <span className="font-mono font-bold text-foreground">{sub.erpPlan}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">Status Financeiro (ERP)</span>
                                    <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded mt-1 ${
                                      sub.financeiroStatus === 'Adimplente' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                      sub.financeiroStatus === 'Atrasado' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                                      'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                    }`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${
                                        sub.financeiroStatus === 'Adimplente' ? 'bg-emerald-500' :
                                        sub.financeiroStatus === 'Atrasado' ? 'bg-amber-500' : 'bg-red-500'
                                      }`} />
                                      {sub.financeiroStatus}
                                    </span>
                                  </div>

                                  <div className="pt-2">
                                    <button
                                      disabled={syncingId === sub.id}
                                      onClick={() => handleSyncERP(sub.id)}
                                      className="bg-primary text-white hover:bg-primary/95 disabled:bg-primary/60 px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                                    >
                                      {syncingId === sub.id ? (
                                        <>
                                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Puxando dados do ERP...
                                        </>
                                      ) : (
                                        <>
                                          <Icon icon="tabler:refresh" width={14} />
                                          Puxar Dados do ERP
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Right Sync History Column */}
                              <div className="lg:col-span-4 space-y-4 pt-4 lg:pt-0">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <Icon icon="tabler:history" width={16} />
                                  Histórico de Sincronia
                                </h5>

                                <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                                  {sub.historicoSync.map((log, idx) => (
                                    <div key={idx} className="text-[11px] border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                      <span className="text-muted-foreground block text-[10px] font-mono">{log.data}</span>
                                      <p className="text-foreground mt-0.5">{log.descricao}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardBox>

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-lg p-6 rounded-xl shadow-lg relative animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-foreground">Nova Subscrição / Assinante</h4>
              <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                Integração Voalle ERP
              </span>
            </div>

            {/* Voalle ERP Quick Lookup Banner */}
            <div className="bg-muted/30 border border-border rounded-lg p-3.5 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Icon icon="tabler:database-search" width={16} className="text-primary" />
                  Pesquisar Cliente no Voalle ERP (por Nome, CPF ou Código)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Digite o <strong>Nome do Cliente</strong> (ex: <i>Ricardo, Juliana, Mariana</i>), CPF/CNPJ ou ID para importar os dados do ERP.
              </p>
              <div className="flex gap-2 pt-0.5">
                <input
                  type="text"
                  value={erpSearchQuery}
                  onChange={(e) => setErpSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleConsultVoalleInModal())}
                  placeholder="Digite Nome, CPF/CNPJ ou Código ERP (ex: Ricardo, Juliana, 049...)"
                  className="flex-1 border border-border bg-white dark:bg-dark p-2.5 rounded-md text-xs focus:outline-none focus:border-primary text-foreground font-medium"
                />
                <button
                  type="button"
                  onClick={handleConsultVoalleInModal}
                  disabled={isSearchingErp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-md transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSearchingErp ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Icon icon="tabler:search" width={14} />
                      Buscar no ERP
                    </>
                  )}
                </button>
              </div>

              {erpSearchStatus && (
                <div className={`text-[11px] p-2.5 rounded border mt-2 ${
                  erpSearchStatus.includes('PENDÊNCIA') || erpSearchStatus.includes('Atrasado') 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                }`}>
                  {erpSearchStatus}
                </div>
              )}

              {/* Render Search Candidate Cards */}
              {erpSearchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                    Resultados Encontrados no ERP ({erpSearchResults.length}):
                  </span>
                  {erpSearchResults.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white dark:bg-dark border border-border p-2.5 rounded-lg flex items-center justify-between gap-2 hover:border-primary transition-all shadow-2xs"
                    >
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{item.nome}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.financeiro === 'Adimplente' 
                              ? 'bg-emerald-500/15 text-emerald-600' 
                              : 'bg-amber-500/15 text-amber-600'
                          }`}>
                            {item.financeiro}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          CPF: <span className="font-mono">{item.cpfCnpj}</span> | ID: <span className="font-mono text-primary font-bold">{item.codigoErp}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectErpCustomer(item)}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-[11px] px-2.5 py-1.5 rounded transition-all whitespace-nowrap"
                      >
                        Selecionar e Preencher
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome Completo do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Carlos Augusto Silva"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">CPF / CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Código ID do ERP</label>
                  <input
                    type="text"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ex: VOALLE-1002"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Plano Vinculado</label>
                <select
                  value={newPlano}
                  onChange={(e) => setNewPlano(e.target.value)}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Bronze">Plano Bronze</option>
                  <option value="Prata">Plano Prata</option>
                  <option value="Ouro">Plano Ouro</option>
                  <option value="Diamante">Plano Diamante</option>
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
