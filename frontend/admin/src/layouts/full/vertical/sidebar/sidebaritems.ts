export interface ChildItem {
  id?: number | string;
  name?: string;
  title?: string;
  icon?: string;
  children?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  title?: string;
  icon?: string;
  id?: number | string;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

import { uniqueId } from 'lodash';

const masterSidebar: MenuItem[] = [
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard Global',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
      },
    ],
  },
  {
    heading: 'Gestão de Provedores',
    children: [
      {
        name: 'Provedores B2B',
        icon: 'solar:server-path-linear',
        id: uniqueId(),
        url: '/admin/providers',
      },
    ],
  },
  {
    heading: 'Catálogo',
    children: [
      {
        name: 'Catálogo Global',
        icon: 'solar:bookmark-double-linear',
        id: uniqueId(),
        url: '/admin/global-catalog',
      },
    ],
  },
  {
    heading: 'Equipe & Segurança',
    children: [
      {
        name: 'Colaboradores FIKTA',
        icon: 'solar:shield-user-linear',
        id: uniqueId(),
        url: '/admin/employees',
      },
    ],
  },
  {
    heading: 'Configurações',
    children: [
      {
        name: 'Configurações Globais',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/admin/global-settings',
      },
    ],
  },
];

const providerSidebar: MenuItem[] = [
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard ISP',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
      },
    ],
  },
  {
    heading: 'Relatórios',
    children: [
      {
        name: 'Consumo do Provedor',
        icon: 'solar:chart-square-linear',
        id: uniqueId(),
        url: '/admin/consumption',
      },
    ],
  },
  {
    heading: 'Gestão de Usuários',
    children: [
      {
        name: 'Subscrições',
        icon: 'solar:users-group-two-rounded-linear',
        id: uniqueId(),
        url: '/admin/subscriptions',
      },
      {
        name: 'Colaboradores',
        icon: 'solar:shield-user-linear',
        id: uniqueId(),
        url: '/admin/employees',
      },
      {
        name: 'Mapeamento de Planos',
        icon: 'solar:sitemap-linear',
        id: uniqueId(),
        url: '/admin/plan-mapping',
      },
    ],
  },
  {
    heading: 'Comunicação',
    children: [
      {
        name: 'Banners',
        icon: 'solar:gallery-linear',
        id: uniqueId(),
        url: '/admin/banners',
      },
      {
        name: 'Templates E-mails',
        icon: 'solar:letter-linear',
        id: uniqueId(),
        url: '/admin/email-templates',
      },
    ],
  },
  {
    heading: 'Descontos & Revistas',
    children: [
      {
        name: 'Lojas Parceiras',
        icon: 'solar:shop-linear',
        id: uniqueId(),
        url: '/admin/partner-stores',
      },
      {
        name: 'Revistas Digitais',
        icon: 'solar:book-2-linear',
        id: uniqueId(),
        url: '/admin/digital-magazines',
      },
    ],
  },
  {
    heading: 'Super Portal B2C',
    children: [
      {
        name: 'Super Portal (Visão B2C)',
        icon: 'solar:display-linear',
        id: uniqueId(),
        url: '/b2c/super-portal',
      },
      {
        name: 'Status de Conexão',
        icon: 'solar:wifi-router-linear',
        id: uniqueId(),
        url: '/b2c/connection-status',
      },
      {
        name: 'Personalizar Super Portal',
        icon: 'solar:tuning-square-2-linear',
        id: uniqueId(),
        url: '/admin/portal-customization',
      },
    ],
  },
  {
    heading: 'Suporte & Chamados',
    children: [
      {
        name: 'Abrir Chamado',
        icon: 'solar:chat-round-call-linear',
        id: uniqueId(),
        url: '/apps/tickets/create',
      },
      {
        name: 'Meus Chamados',
        icon: 'solar:letter-opened-linear',
        id: uniqueId(),
        url: '/apps/tickets',
      },
    ],
  },
  {
    heading: 'Configurações',
    children: [
      {
        name: 'Integrações ERP',
        icon: 'solar:settings-bold-linear',
        id: uniqueId(),
        url: '/admin/integrations',
      },
    ],
  },
];

const customerSidebar: MenuItem[] = [
  {
    heading: 'Super Portal B2C',
    children: [
      {
        name: 'Central do Assinante',
        icon: 'solar:display-linear',
        id: uniqueId(),
        url: '/b2c/super-portal',
      },
      {
        name: 'Status da Conexão',
        icon: 'solar:wifi-router-linear',
        id: uniqueId(),
        url: '/b2c/connection-status',
      },
    ],
  },
  {
    heading: 'Minha Leitura',
    children: [
      {
        name: 'Biblioteca Digital',
        icon: 'solar:bookmark-double-linear',
        id: uniqueId(),
        url: '/',
      },
      {
        name: 'Revistas Digitais',
        icon: 'solar:book-2-linear',
        id: uniqueId(),
        url: '/admin/digital-magazines',
      },
    ],
  },
  {
    heading: 'Suporte',
    children: [
      {
        name: 'Abrir Chamado',
        icon: 'solar:chat-round-call-linear',
        id: uniqueId(),
        url: '/apps/tickets/create',
      },
      {
        name: 'Meus Chamados',
        icon: 'solar:letter-opened-linear',
        id: uniqueId(),
        url: '/apps/tickets',
      },
    ],
  },
  {
    heading: 'Cadastro',
    children: [
      {
        name: 'Meu Perfil',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/user-profile',
      },
    ],
  },
];

export const getSidebarContent = (role: string): MenuItem[] => {
  if (role === 'UNE_ADMIN') {
    return masterSidebar;
  }
  if (role === 'CUSTOMER') {
    return customerSidebar;
  }
  return providerSidebar;
};

export default providerSidebar;
