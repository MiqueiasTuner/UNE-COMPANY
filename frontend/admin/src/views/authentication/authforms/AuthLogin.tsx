import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';

type Role = 'UNE_ADMIN' | 'PROVIDER_ADMIN' | 'CUSTOMER';

interface DemoAccount {
  /** Rótulo exibido no bloco de credenciais de teste. */
  label: string;
  /** Classe Tailwind do marcador colorido. */
  accent: string;
  /** Usuário e senha "canônicos" — os que aparecem na tela. */
  username: string;
  password: string;
  /** Formas alternativas de digitar o mesmo login (e-mails, apelidos legados). */
  aliases?: string[];
  /** Senhas alternativas aceitas. */
  altPasswords?: string[];
  role: Role;
  tenantId: string;
  tenantName: string;
  /**
   * CPF/CNPJ do assinante. É a chave usada nas consultas ao ERP Voalle
   * (people/txid, getopentitlesbytxid) — ver docs/architecture/VOALLE-API-REFERENCE.md
   */
  document?: string;
}

const demoAccounts: DemoAccount[] = [
  {
    label: 'FIKTA Master (Global Admin)',
    accent: 'bg-primary text-primary',
    username: 'master',
    password: 'master',
    aliases: ['master@fikta.com.br'],
    altPasswords: ['fikta@123'],
    role: 'UNE_ADMIN',
    tenantId: 'fikta',
    tenantName: 'FIKTA (Master)',
  },
  {
    label: 'TechNet (Provedor ISP)',
    accent: 'bg-secondary text-secondary',
    username: 'technet',
    password: 'technet',
    aliases: ['test@technet.com.br', 'admin', 'admin@fikta.com.br'],
    altPasswords: ['admin', 'fikta@123'],
    role: 'PROVIDER_ADMIN',
    tenantId: 'technet',
    tenantName: 'TechNet Telecom',
  },
  {
    label: 'Cliente Final TechNet (Leitor B2C)',
    accent: 'bg-emerald-500 text-emerald-500',
    username: 'cliente',
    password: 'cliente',
    aliases: ['cliente@technet.com.br', 'user'],
    altPasswords: ['cliente123'],
    role: 'CUSTOMER',
    tenantId: 'technet',
    tenantName: 'TechNet Telecom',
    document: '11122233396',
  },
  {
    label: 'UNE TELECOM (Provedor ISP)',
    accent: 'bg-[#0B5FFF] text-[#0B5FFF]',
    username: 'une',
    password: 'une',
    aliases: ['une@unetelecom.com.br', 'unetelecom'],
    altPasswords: ['une@123'],
    role: 'PROVIDER_ADMIN',
    tenantId: 'une',
    tenantName: 'UNE TELECOM',
  },
  {
    label: 'Cliente Final UNE (Leitor B2C)',
    accent: 'bg-[#FF8A00] text-[#FF8A00]',
    username: 'uneclient',
    password: 'uneclient',
    aliases: ['cliente@unetelecom.com.br', 'unecliente'],
    altPasswords: ['unecliente'],
    role: 'CUSTOMER',
    tenantId: 'une',
    tenantName: 'UNE TELECOM',
    document: '52998224725',
  },
];

/** Casa o que foi digitado contra a tabela de contas de demonstração. */
function matchAccount(username: string, password: string): DemoAccount | undefined {
  const user = username.trim().toLowerCase();
  return demoAccounts.find((acc) => {
    const users = [acc.username, ...(acc.aliases ?? [])].map((u) => u.toLowerCase());
    const passwords = [acc.password, ...(acc.altPasswords ?? [])];
    return users.includes(user) && passwords.includes(password);
  });
}

const AuthLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const account = matchAccount(username, password);

    if (!account) {
      setError('Credenciais inválidas! Utilize uma das contas listadas abaixo.');
      return;
    }

    localStorage.setItem(
      'fikta_user',
      JSON.stringify({
        username: account.username,
        role: account.role,
        tenantId: account.tenantId,
        tenantName: account.tenantName,
        document: account.document,
        loginTime: new Date().toISOString(),
      })
    );
    navigate('/');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="username">Usuário</Label>
          </div>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="master, technet, cliente, une ou uneclient"
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd">Senha</Label>
          </div>
          <Input
            id="userpwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" className="checkbox" />
            <Label htmlFor="accept" className="opacity-90 font-normal cursor-pointer text-sm">
              Lembrar deste dispositivo
            </Label>
          </div>
          <Link to={'/auth/maintenance'} className="text-primary text-sm font-medium">
            Esqueceu a senha?
          </Link>
        </div>
        <Button type="submit" className="w-full">
          Acessar Painel
        </Button>
      </form>

      {/* Test credentials helper block */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border space-y-4">
        {demoAccounts.map((acc, i) => {
          const [dotColor, textColor] = acc.accent.split(' ');
          return (
            <div key={acc.username} className={i > 0 ? 'border-t border-border pt-3' : undefined}>
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textColor}`}
              >
                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                {i + 1}. {acc.label}
              </p>
              <div className="text-xs text-muted-foreground space-y-1 pl-3.5">
                <p>
                  <span className="font-semibold text-foreground">Usuário:</span> {acc.username}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Senha:</span> {acc.password}
                </p>
                {acc.document && (
                  <p>
                    <span className="font-semibold text-foreground">CPF (ERP):</span> {acc.document}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AuthLogin;
