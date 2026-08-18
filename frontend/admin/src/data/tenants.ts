// Registro dos provedores (tenants B2B) que já são clientes da FIKTA.
// Centraliza o white-label para que Logo, FullLogo e B2CPortalLayout não precisem
// de um `if (tenantId === 'x')` cada vez que um provedor novo entra na plataforma.
//
// O bloco `erp` espelha o que é configurado em ERPIntegrations e persistido
// (criptografado) em IntegrationCredential no backend. Aqui ficam apenas dados
// não-secretos — client_secret e syndata nunca chegam ao frontend.
// Ver docs/architecture/VOALLE-API-REFERENCE.md
export interface TenantBrand {
  id: string;
  /** Nome completo, usado em cabeçalhos e no seletor de tenant. */
  name: string;
  /** Wordmark do logo, quebrado em duas partes coloridas. */
  wordmark: { lead: string; tail: string };
  initials: string;
  /** Cores da marca do provedor (white label). */
  colors: { primary: string; secondary: string };
  erp: {
    vendor: 'VOALLE' | 'IXC' | 'SGP' | 'HUBSOFT' | 'WEBHOOK';
    /** Host base — as portas 45700 (auth) e 45715 (API) são anexadas pelo backend. */
    endpointUrl: string;
    /** Usuário integrador do ERP. Não é segredo; o secret fica só no backend. */
    clientId: string;
  } | null;
}

export const tenants: TenantBrand[] = [
  {
    id: 'fikta',
    name: 'FIKTA (Master)',
    wordmark: { lead: 'FIK', tail: 'TA' },
    initials: 'FK',
    colors: { primary: '#635BFF', secondary: '#00C2A8' },
    erp: null, // A FIKTA é a plataforma, não tem ERP próprio
  },
  {
    id: 'technet',
    name: 'TechNet Telecom',
    wordmark: { lead: 'TECH', tail: 'NET' },
    initials: 'TN',
    colors: { primary: '#F86D72', secondary: '#51A8B1' },
    erp: {
      vendor: 'VOALLE',
      endpointUrl: 'https://erp.provedortechnet.com.br',
      clientId: '', // preenchido pelo backend; segredo nunca chega ao frontend
    },
  },
  {
    id: 'une',
    name: 'UNE TELECOM',
    wordmark: { lead: 'UNE', tail: 'TELECOM' },
    initials: 'UN',
    colors: { primary: '#0B5FFF', secondary: '#FF8A00' },
    erp: {
      vendor: 'VOALLE',
      endpointUrl: 'https://erp.unetelecom.com.br',
      clientId: '', // preenchido pelo backend; segredo nunca chega ao frontend
    },
  },
];

const FALLBACK = tenants[0];

/** Resolve um tenant pelo id salvo na sessão. Cai no branding FIKTA se desconhecido. */
export function getTenant(tenantId?: string | null): TenantBrand {
  if (!tenantId) return FALLBACK;
  return tenants.find((t) => t.id === tenantId) ?? FALLBACK;
}

/** Lê o tenant da sessão corrente gravada em localStorage pelo AuthLogin. */
export function getCurrentTenant(): TenantBrand {
  try {
    const raw = localStorage.getItem('fikta_user');
    if (!raw) return FALLBACK;
    return getTenant(JSON.parse(raw)?.tenantId);
  } catch {
    return FALLBACK;
  }
}
