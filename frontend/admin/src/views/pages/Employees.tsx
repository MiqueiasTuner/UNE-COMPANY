import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface Employee {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  ativo: boolean;
  criadoEm: string;
  ultimaAtividade: string;
  appMovel: 'Android' | 'iOS' | 'Não instalado';
  appDesktop: 'Windows' | 'macOS' | 'Não instalado';
  avatarUrl: string;
}

const initialEmployees: Employee[] = [
  { 
    id: '175', 
    nome: 'Nicolas Camargo', 
    email: 'nicolas.camargo@technet.com.br', 
    cargo: 'Administrador', 
    departamento: 'TechNet', 
    ativo: true, 
    criadoEm: '10/01/2025',
    ultimaAtividade: '8/10/2025, 9:51',
    appMovel: 'Não instalado',
    appDesktop: 'Não instalado',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '153', 
    nome: 'Daniel Cha', 
    email: 'daniel.cha@technet.com.br', 
    cargo: 'Gerente Comercial', 
    departamento: 'Departamento de Entrega e Logística', 
    ativo: true, 
    criadoEm: '15/02/2025',
    ultimaAtividade: '17/11/2023, 18:49',
    appMovel: 'Não instalado',
    appDesktop: 'Não instalado',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '129', 
    nome: 'Stacy Smith', 
    email: 'stacy.smith@technet.com.br', 
    cargo: 'Administrador', 
    departamento: 'TechNet Partners', 
    ativo: true, 
    criadoEm: '20/02/2025',
    ultimaAtividade: '12/9/2025, 19:43',
    appMovel: 'Não instalado',
    appDesktop: 'Não instalado',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '101', 
    nome: 'Ana Laura Lima', 
    email: 'ana.lima@technet.com.br', 
    cargo: 'CEO', 
    departamento: 'TechNet Partners', 
    ativo: true, 
    criadoEm: '01/03/2025',
    ultimaAtividade: '27/11/2025, 21:34',
    appMovel: 'Android',
    appDesktop: 'Windows',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '79', 
    nome: 'Adriana Sánchez', 
    email: 'adriana.sanchez@technet.com.br', 
    cargo: 'Especialista em Atendimento', 
    departamento: 'TechNet', 
    ativo: true, 
    criadoEm: '11/04/2025',
    ultimaAtividade: '27/11/2025, 21:28',
    appMovel: 'iOS',
    appDesktop: 'macOS',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '75', 
    nome: 'Débora Carvalho Soverosa', 
    email: 'debora.carvalho@technet.com.br', 
    cargo: 'Suporte Técnico', 
    departamento: 'Departamento de Manutenção', 
    ativo: false, 
    criadoEm: '22/05/2025',
    ultimaAtividade: '2/9/2025, 19:39',
    appMovel: 'Não instalado',
    appDesktop: 'Não instalado',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
  },
];

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCargo, setNewCargo] = useState('Suporte N1');
  const [newDept, setNewDept] = useState('TechNet');
  const [newMovel, setNewMovel] = useState<Employee['appMovel']>('Não instalado');
  const [newDesktop, setNewDesktop] = useState<Employee['appDesktop']>('Não instalado');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editMovel, setEditMovel] = useState<Employee['appMovel']>('Não instalado');
  const [editDesktop, setEditDesktop] = useState<Employee['appDesktop']>('Não instalado');
  const [editAtivo, setEditAtivo] = useState(true);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAtivo = (id: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, ativo: !emp.ativo };
      }
      return emp;
    }));
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newEmp: Employee = {
      id: Math.floor(Math.random() * 200 + 10).toString(),
      nome: newName,
      email: newEmail,
      cargo: newCargo,
      departamento: newDept,
      ativo: true,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      ultimaAtividade: 'Agora mesmo',
      appMovel: newMovel,
      appDesktop: newDesktop,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&q=80&w=150`
    };

    setEmployees([newEmp, ...employees]);
    setNewName('');
    setNewEmail('');
    setIsModalOpen(false);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.nome);
    setEditEmail(emp.email);
    setEditCargo(emp.cargo);
    setEditDept(emp.departamento);
    setEditMovel(emp.appMovel);
    setEditDesktop(emp.appDesktop);
    setEditAtivo(emp.ativo);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setEmployees(employees.map(emp => {
      if (emp.id === editingEmployee.id) {
        return {
          ...emp,
          nome: editName,
          email: editEmail,
          cargo: editCargo,
          departamento: editDept,
          appMovel: editMovel,
          appDesktop: editDesktop,
          ativo: editAtivo
        };
      }
      return emp;
    }));

    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza de que deseja remover este colaborador?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Procurar Colaborador</h3>
          <p className="text-sm text-muted-foreground">Monitore o acesso dos colaboradores e o uso de aplicativos de suporte</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0B1D3A] hover:bg-[#0B1D3A]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
        >
          <Icon icon="tabler:user-plus" width={18} />
          Convidar Colaborador
        </button>
      </div>

      <CardBox>
        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Icon icon="tabler:search" width={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Pesquisa de colaboradores..."
              className="pl-10 pr-4 py-2.5 w-full border border-border bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:border-[#0B1D3A]"
            />
          </div>
        </div>

        {/* Employees Table (styled like Bitrix24 screenshot) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground w-16">ID</th>
                <th className="p-4 font-semibold text-muted-foreground">Colaborador</th>
                <th className="p-4 font-semibold text-muted-foreground">Departamento</th>
                <th className="p-4 font-semibold text-muted-foreground">Data da Última Atividade</th>
                <th className="p-4 font-semibold text-muted-foreground">Aplicativo Móvel</th>
                <th className="p-4 font-semibold text-muted-foreground">Aplicativo Desktop</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/5 transition-all">
                    <td className="p-4 font-mono font-bold text-muted-foreground/80">{emp.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatarUrl} 
                          alt={emp.nome} 
                          className="h-10 w-10 rounded-full object-cover border border-border shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-foreground hover:text-[#0B1D3A] cursor-pointer transition-all flex items-center gap-1.5">
                            {emp.nome}
                            {!emp.ativo && (
                              <span className="text-[10px] font-semibold text-red-500 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                                Suspenso
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="font-semibold text-[#0B1D3A]">{emp.cargo}</span>
                            <span>•</span>
                            <span className="truncate">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground font-semibold block">{emp.departamento}</span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-xs">{emp.ultimaAtividade}</td>
                    <td className="p-4">
                      {emp.appMovel === 'Não instalado' ? (
                        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                          Não instalado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-[#0B1D3A]/10 px-2.5 py-0.5 rounded-full">
                          <Icon icon={emp.appMovel === 'Android' ? 'tabler:brand-android' : 'tabler:brand-apple'} width={14} />
                          {emp.appMovel}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {emp.appDesktop === 'Não instalado' ? (
                        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                          Não instalado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-full">
                          <Icon icon={emp.appDesktop === 'Windows' ? 'tabler:brand-windows' : 'tabler:brand-apple'} width={14} />
                          {emp.appDesktop}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end items-center gap-1 pt-6">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="text-muted-foreground hover:text-[#0B1D3A] transition-all p-1.5 hover:bg-muted/10 rounded"
                        title="Editar Cadastro"
                      >
                        <Icon icon="tabler:edit" width={18} />
                      </button>
                      <button
                        onClick={() => toggleAtivo(emp.id)}
                        className="text-muted-foreground hover:text-[#0B1D3A] transition-all p-1.5 hover:bg-muted/10 rounded"
                        title={emp.ativo ? 'Suspender Colaborador' : 'Reativar Colaborador'}
                      >
                        <Icon icon={emp.ativo ? 'tabler:toggle-right' : 'tabler:toggle-left'} width={22} className={emp.ativo ? 'text-[#0B1D3A]' : ''} />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-muted-foreground hover:text-red-500 transition-all p-1.5 hover:bg-muted/10 rounded"
                        title="Remover Colaborador"
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

      {/* Invite Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Convidar Colaborador</h4>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Ana Laura Lima"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Corporativo *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: ana@technet.com.br"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    placeholder="Ex: Diretor Financeiro"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Departamento</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Ex: Departamento de Entrega"
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">App Móvel</label>
                  <select
                    value={newMovel}
                    onChange={(e) => setNewMovel(e.target.value as Employee['appMovel'])}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  >
                    <option value="Não instalado">Não instalado</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">App Desktop</label>
                  <select
                    value={newDesktop}
                    onChange={(e) => setNewDesktop(e.target.value as Employee['appDesktop'])}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  >
                    <option value="Não instalado">Não instalado</option>
                    <option value="Windows">Windows</option>
                    <option value="macOS">macOS</option>
                  </select>
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
                  className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collaborator Modal */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Editar Cadastro: {editingEmployee.nome}</h4>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Corporativo *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={editCargo}
                    onChange={(e) => setEditCargo(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Departamento</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">App Móvel</label>
                  <select
                    value={editMovel}
                    onChange={(e) => setEditMovel(e.target.value as Employee['appMovel'])}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  >
                    <option value="Não instalado">Não instalado</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">App Desktop</label>
                  <select
                    value={editDesktop}
                    onChange={(e) => setEditDesktop(e.target.value as Employee['appDesktop'])}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                  >
                    <option value="Não instalado">Não instalado</option>
                    <option value="Windows">Windows</option>
                    <option value="macOS">macOS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status do Colaborador</label>
                <select
                  value={editAtivo ? 'true' : 'false'}
                  onChange={(e) => setEditAtivo(e.target.value === 'true')}
                  className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] text-foreground"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Suspenso / Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
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

export default Employees;
