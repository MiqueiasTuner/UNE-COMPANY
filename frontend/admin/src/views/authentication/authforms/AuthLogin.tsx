import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';

const AuthLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let userSession = null;

    if (
      (username === 'master' || username === 'master@fikta.com.br') &&
      (password === 'master' || password === 'fikta@123')
    ) {
      userSession = {
        username: 'master',
        role: 'UNE_ADMIN',
        tenantId: 'fikta',
        tenantName: 'FIKTA (Master)',
        loginTime: new Date().toISOString()
      };
    } else if (
      (username === 'technet' || username === 'test@technet.com.br' || username === 'admin' || username === 'admin@fikta.com.br') &&
      (password === 'technet' || password === 'admin' || password === 'fikta@123')
    ) {
      userSession = {
        username: 'technet',
        role: 'PROVIDER_ADMIN',
        tenantId: 'technet',
        tenantName: 'TechNet',
        loginTime: new Date().toISOString()
      };
    } else if (
      (username === 'cliente' || username === 'cliente@technet.com.br' || username === 'user') && 
      (password === 'cliente' || password === 'cliente123')
    ) {
      userSession = {
        username: 'cliente',
        role: 'CUSTOMER',
        tenantId: 'technet',
        tenantName: 'TechNet Telecom',
        loginTime: new Date().toISOString()
      };
    }

    if (userSession) {
      localStorage.setItem('fikta_user', JSON.stringify(userSession));
      navigate('/');
    } else {
      setError('Credenciais inválidas! Utilize "master", "technet" ou "cliente" conforme listado abaixo.');
    }
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
            placeholder="master, technet ou cliente"
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
        <div>
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            1. FIKTA Master (Global Admin)
          </p>
          <div className="text-xs text-muted-foreground space-y-1 pl-3.5">
            <p><span className="font-semibold text-foreground">Usuário:</span> master</p>
            <p><span className="font-semibold text-foreground">Senha:</span> master</p>
          </div>
        </div>
        
        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 text-secondary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            2. TechNet (Teste ISP Local)
          </p>
          <div className="text-xs text-muted-foreground space-y-1 pl-3.5">
            <p><span className="font-semibold text-foreground">Usuário:</span> technet</p>
            <p><span className="font-semibold text-foreground">Senha:</span> technet</p>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            3. Cliente Final ISP (Leitor B2C)
          </p>
          <div className="text-xs text-muted-foreground space-y-1 pl-3.5">
            <p><span className="font-semibold text-foreground">Usuário:</span> cliente</p>
            <p><span className="font-semibold text-foreground">Senha:</span> cliente</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthLogin;
