//Apps Links Type & Data
interface appsLinkType {
  href: string;
  title: string;
  subtext: string;
  avatar: string;
}

const appsLink: appsLinkType[] = [
  {
    href: '/apps/chats',
    title: 'Atendimento & Suporte',
    subtext: 'Novas mensagens recebidas',
    avatar: 'src/assets/images/svgs/icon-dd-chat.svg',
  },
  {
    href: '/apps/ecommerce/shop',
    title: 'Catálogo de Planos',
    subtext: 'Novos acervos disponíveis',
    avatar: 'src/assets/images/svgs/icon-dd-cart.svg',
  },
  {
    href: '/apps/notes',
    title: 'Bloco de Notas',
    subtext: 'Tarefas e lembretes diários',
    avatar: 'src/assets/images/svgs/icon-dd-invoice.svg',
  },
  {
    href: '/apps/calendar',
    title: 'Agenda & Eventos',
    subtext: 'Datas e compromissos',
    avatar: 'src/assets/images/svgs/icon-dd-date.svg',
  },
  {
    href: '/apps/contacts',
    title: 'Lista de Contatos',
    subtext: 'Contatos e parceiros',
    avatar: 'src/assets/images/svgs/icon-dd-mobile.svg',
  },
  {
    href: '/apps/tickets',
    title: 'Central de Chamados',
    subtext: 'Abertura e histórico de suporte',
    avatar: 'src/assets/images/svgs/icon-dd-lifebuoy.svg',
  },
  {
    href: '/apps/email',
    title: 'Caixa de Entrada',
    subtext: 'Emails e notificações',
    avatar: 'src/assets/images/svgs/icon-dd-message-box.svg',
  },
  {
    href: '/apps/blog/post',
    title: 'Notícias & Artigos',
    subtext: 'Novos conteúdos publicados',
    avatar: 'src/assets/images/svgs/icon-dd-application.svg',
  },
];

interface LinkType {
  href: string;
  title: string;
}

const pageLinks: LinkType[] = [
  {
    href: '/theme-pages/pricing',
    title: 'Planos & Preços',
  },
  {
    href: '/auth/auth1/login',
    title: 'Autenticação',
  },
  {
    href: '/auth/auth1/register',
    title: 'Cadastre-se',
  },
  {
    href: '/404',
    title: 'Página de Erro 404',
  },
  {
    href: '/apps/kanban',
    title: 'Quadro Kanban',
  },
  {
    href: '/apps/user-profile/profile',
    title: 'Perfil do Usuário',
  },
  {
    href: '/apps/blog/post',
    title: 'Design do Blog',
  },
  {
    href: '/apps/ecommerce/checkout',
    title: 'Carrinho de Leitura',
  },
];

//   Search Data
interface SearchType {
  href: string;
  title: string;
}

const SearchLinks: SearchType[] = [
  {
    title: 'Métricas & Análises',
    href: '/dashboards/analytics',
  },
  {
    title: 'Planos B2B',
    href: '/dashboards/eCommerce',
  },
  {
    title: 'Gestão CRM',
    href: '/dashboards/crm',
  },
  {
    title: 'Contatos',
    href: '/dashboards/eCommerce',
  },
  {
    title: 'Publicações',
    href: '/dashboards/posts',
  },
  {
    title: 'Detalhes',
    href: '/dashboards/details',
  },
];

//   Message Data
interface MessageType {
  title: string;
  avatar: string;
  subtitle: string;
}

import avatar1 from 'src/assets/images/profile/user-2.jpg';
import avatar2 from 'src/assets/images/profile/user-3.jpg';
import avatar3 from 'src/assets/images/profile/user-4.jpg';
import avatar4 from 'src/assets/images/profile/user-5.jpg';
import avatar5 from 'src/assets/images/profile/user-6.jpg';

const MessagesLink: MessageType[] = [
  {
    avatar: avatar1,
    title: 'Roman entrou na equipe!',
    subtitle: 'Parabenize o novo integrante',
  },
  {
    avatar: avatar2,
    title: 'Nova mensagem',
    subtitle: 'Salma te enviou uma mensagem',
  },
  {
    avatar: avatar3,
    title: 'Pagamento recebido',
    subtitle: 'Confira os detalhes da conta',
  },
  {
    avatar: avatar4,
    title: 'Tarefas concluídas',
    subtitle: 'Atribua novas atividades',
  },
  {
    avatar: avatar5,
    title: 'Comprovante enviado',
    subtitle: 'Confirmação de recebimento',
  },
];

//   Notification Data
interface NotificationType {
  title: string;
  icon: string;
  subtitle: string;
  bgcolor: string;
  color: string;
  time: string;
}

const Notification: NotificationType[] = [
  {
    icon: 'solar:widget-3-line-duotone',
    bgcolor: 'bg-lighterror dark:bg-lighterror',
    color: 'text-error',
    title: 'Solicitação de Viabilidade',
    subtitle: 'O provedor TechNet solicitou homologação para Voalle.',
    time: 'Há 5 min',
  },
  {
    icon: 'solar:calendar-line-duotone',
    bgcolor: 'bg-lightprimary dark:bg-lightprimary',
    color: 'text-primary',
    title: 'Integração Concluída',
    subtitle: 'Homologação do ERP IXC concluída com sucesso.',
    time: 'Há 1 hora',
  },
  {
    icon: 'solar:settings-line-duotone',
    bgcolor: 'bg-lightsecondary dark:bg-lightsecondary',
    color: 'text-secondary',
    title: 'Novo Chamado Aberto',
    subtitle: 'WebFibra reportou falha na sincronia de planos.',
    time: 'Há 3 horas',
  },
  {
    icon: 'solar:widget-4-line-duotone',
    bgcolor: 'bg-lightwarning dark:bg-lightwarning ',
    color: 'text-warning',
    title: 'Contrato Próximo do Fim',
    subtitle: 'A licença da TelecomSul expira em 15 dias.',
    time: 'Ontem',
  },
];

//  Profile Data
interface ProfileType {
  title: string;
  img: string;
  subtitle: string;
  url: string;
  icon: string
}

import acccountIcon from 'src/assets/images/svgs/icon-account.svg';
import inboxIcon from 'src/assets/images/svgs/icon-inbox.svg';
import taskIcon from 'src/assets/images/svgs/icon-tasks.svg';

const profileDD: ProfileType[] = [
  {
    img: acccountIcon,
    title: 'Meu Perfil',
    subtitle: 'Configurações da Conta',
    icon: "tabler:user",
    url: '/user-profile',
  },
  {
    img: inboxIcon,
    title: 'Minhas Anotações',
    subtitle: 'Anotações Diárias',
    icon: "tabler:mail",
    url: '/apps/Notes',
  },
  {
    img: taskIcon,
    title: 'Meus Artigos',
    subtitle: 'Artigos, insights e novidades',
    icon: "tabler:list-check",
    url: '/apps/blog/post',
  },
];

export { appsLink, pageLinks, SearchLinks, MessagesLink, Notification, profileDD };
