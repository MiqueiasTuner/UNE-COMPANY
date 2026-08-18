import { Icon } from "@iconify/react";
import { useState } from "react";
import BreadcrumbComp from "src/layouts/full/shared/breadcrumb/BreadcrumbComp";
import CardBox from "src/components/shared/CardBox";

interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  role: string;
  time: string;
  content: string;
  type: 'message' | 'event' | 'link';
  likes: number;
  likedByUser: boolean;
  comments: {
    id: string;
    author: string;
    avatar: string;
    content: string;
    time: string;
  }[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

const UserProfile = () => {
  const userStr = localStorage.getItem('fikta_user');
  const sessionUser = userStr ? JSON.parse(userStr) : null;
  const isCustomer = sessionUser?.role === 'CUSTOMER';

  const [activeTab, setActiveTab] = useState<'geral' | 'feed' | 'notas'>('geral');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile States
  const [profile, setProfile] = useState(
    isCustomer
      ? {
          firstName: "Ricardo",
          lastName: "Silva Santos",
          email: "ricardo.santos@technet.com.br",
          phone: "(11) 99877-2233",
          position: "Assinante",
          country: "Brasil",
          city: "São Paulo",
          department: sessionUser?.tenantName || "TechNet",
          avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=250"
        }
      : {
          firstName: "Ana Laura",
          lastName: "Lima",
          email: "ana.lima@technet.com.br",
          phone: "(11) 98888-7777",
          position: "CEO",
          country: "Brasil",
          city: "São Paulo",
          department: "Diretoria Executiva",
          avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250"
        }
  );

  const [tempProfile, setTempProfile] = useState({ ...profile });

  // Feed/Blog States
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: '1',
      author: 'Carina Almeida Mata',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      role: 'Diretora de Marketing',
      time: 'Ontem, 11:44',
      content: 'A campanha de SVA da FIKTA superou a meta de ativações para os parceiros ISPs! Vamos manter esse fluxo incrível de engajamento.',
      type: 'message',
      likes: 12,
      likedByUser: false,
      comments: [
        {
          id: 'c1',
          author: 'Nicolas Camargo',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          content: 'Resultado fantástico! O mapeamento de planos automáticos ajudou muito.',
          time: 'Ontem, 12:10'
        }
      ]
    },
    {
      id: '2',
      author: 'Eduardo Martins',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
      role: 'Gerente de Integrações',
      time: 'Há 3 dias',
      content: 'Amanhã realizaremos o alinhamento sobre as chaves de API e webhooks do IXC Soft. Conto com a presença da equipe de homologação.',
      type: 'event',
      likes: 4,
      likedByUser: true,
      comments: []
    }
  ]);

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<FeedPost['type']>('message');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Personal Notes States
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Configurações de DNS',
      content: 'Lembrar de repassar aos clientes provedores as chaves DKIM e registros TXT para autenticação nos envios dos templates de e-mail.',
      color: 'bg-amber-100 border-amber-300 dark:bg-amber-950/20 dark:border-amber-750',
      updatedAt: '11/08/2026, 09:40'
    },
    {
      id: '2',
      title: 'Ajuste de Webhooks',
      content: 'Verificar por que o IXC Soft está retornando HTTP 403 em algumas chamadas de sincronia financeira.',
      color: 'bg-blue-100 border-blue-300 dark:bg-blue-950/20 dark:border-blue-750',
      updatedAt: '10/08/2026, 14:15'
    }
  ]);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('bg-amber-100 border-amber-300 dark:bg-amber-950/20 dark:border-amber-750');

  // Breadcrumb
  const BCrumb = [
    { to: "/", title: "Home" },
    { title: "Perfil do Usuário" }
  ];

  // In-place Profile editor saving
  const handleSaveProfile = () => {
    setProfile(tempProfile);
    setIsEditingProfile(false);
  };

  // Create Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: FeedPost = {
      id: Date.now().toString(),
      author: `${profile.firstName} ${profile.lastName}`,
      avatar: profile.avatarUrl,
      role: profile.position,
      time: 'Agora mesmo',
      content: newPostContent,
      type: newPostType,
      likes: 0,
      likedByUser: false,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  // Like Post
  const handleLikePost = (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
          likedByUser: !p.likedByUser
        };
      }
      return p;
    }));
  };

  // Comment Post
  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: Date.now().toString(),
              author: `${profile.firstName} ${profile.lastName}`,
              avatar: profile.avatarUrl,
              content: commentText,
              time: 'Agora mesmo'
            }
          ]
        };
      }
      return p;
    }));
  };

  // Create Note
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      color: newNoteColor,
      updatedAt: new Date().toLocaleString('pt-BR', { hour12: false })
    };

    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  return (
    <div className="space-y-6">
      <BreadcrumbComp title={isCustomer ? "Meu Perfil" : "Perfil Corporativo"} items={BCrumb} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Avatar, Apps */}
        <div className="lg:col-span-4 space-y-6">
          <CardBox className="p-6 text-center flex flex-col items-center">
            {/* User Avatar & Info */}
            <div className="relative group mb-4">
              <img
                src={profile.avatarUrl}
                alt="Foto de perfil"
                className="h-28 w-28 rounded-full object-cover border-4 border-[#0B1D3A] shadow-md mx-auto"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-dark" title="Disponível" />
            </div>

            <h4 className="text-xl font-bold text-foreground">{profile.firstName} {profile.lastName}</h4>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 px-3 py-1 rounded-full mt-1.5 block">
              {isCustomer ? profile.department : profile.position}
            </span>

            {/*
              Os atalhos de download de aplicativo (Android/iOS/Windows/macOS) ficam fora do
              perfil do assinante: apontavam para âncoras inexistentes e o perfil dele deve
              conter os dados dele, não a vitrine de plataformas da FIKTA.
              Para a equipe interna o bloco permanece, como material de apoio.
            */}
            {!isCustomer && (
              <div className="mt-8 pt-6 border-t border-border w-full space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block text-left">
                  Aplicativos FIKTA
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <a href="#android" className="flex items-center gap-1.5 p-2 bg-muted/20 border border-border rounded-lg hover:border-[#0B1D3A] transition-all">
                    <Icon icon="tabler:brand-android" width={16} className="text-emerald-500" />
                    <span>Android App</span>
                  </a>
                  <a href="#ios" className="flex items-center gap-1.5 p-2 bg-muted/20 border border-border rounded-lg hover:border-[#0B1D3A] transition-all">
                    <Icon icon="tabler:brand-apple" width={16} className="text-foreground" />
                    <span>iOS App</span>
                  </a>
                  <a href="#windows" className="flex items-center gap-1.5 p-2 bg-muted/20 border border-border rounded-lg hover:border-[#0B1D3A] transition-all">
                    <Icon icon="tabler:brand-windows" width={16} className="text-blue-500" />
                    <span>Windows</span>
                  </a>
                  <a href="#macos" className="flex items-center gap-1.5 p-2 bg-muted/20 border border-border rounded-lg hover:border-[#0B1D3A] transition-all">
                    <Icon icon="tabler:brand-apple" width={16} className="text-purple-500" />
                    <span>macOS</span>
                  </a>
                </div>
              </div>
            )}
          </CardBox>
        </div>

        {/* RIGHT COLUMN: Tab bar & views */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tab Navigation Menu — internal staff only; customers only have "Meus Dados" */}
          {!isCustomer && (
            <div className="flex border-b border-border bg-white dark:bg-dark p-1 rounded-xl shadow-sm border">
              <button
                onClick={() => setActiveTab('geral')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-lg ${
                  activeTab === 'geral' ? 'bg-[#0B1D3A] text-white' : 'text-muted-foreground hover:bg-muted/10'
                }`}
              >
                <Icon icon="tabler:id-badge" width={16} />
                Geral / Cadastro
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-lg ${
                  activeTab === 'feed' ? 'bg-[#0B1D3A] text-white' : 'text-muted-foreground hover:bg-muted/10'
                }`}
              >
                <Icon icon="tabler:news" width={16} />
                Blog & Feed
              </button>
              <button
                onClick={() => setActiveTab('notas')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-lg ${
                  activeTab === 'notas' ? 'bg-[#0B1D3A] text-white' : 'text-muted-foreground hover:bg-muted/10'
                }`}
              >
                <Icon icon="tabler:note" width={16} />
                Atividades & Notas
              </button>
            </div>
          )}

          {/* Tab View 1: Geral / Cadastro */}
          {activeTab === 'geral' && (
            <CardBox className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h5 className="text-base font-bold text-foreground">Informações de Contato</h5>
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setTempProfile({ ...profile });
                      setIsEditingProfile(true);
                    }}
                    className="text-xs font-bold text-[#0B1D3A] flex items-center gap-1 hover:underline"
                  >
                    <Icon icon="tabler:edit" width={16} />
                    Editar Perfil
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProfile();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Primeiro Nome</label>
                      <input 
                        type="text" 
                        required
                        value={tempProfile.firstName}
                        onChange={(e) => setTempProfile({ ...tempProfile, firstName: e.target.value })}
                        className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Sobrenome</label>
                      <input 
                        type="text" 
                        required
                        value={tempProfile.lastName}
                        onChange={(e) => setTempProfile({ ...tempProfile, lastName: e.target.value })}
                        className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                      />
                    </div>
                  </div>

                  {!isCustomer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cargo / Função</label>
                        <input
                          type="text"
                          required
                          value={tempProfile.position}
                          onChange={(e) => setTempProfile({ ...tempProfile, position: e.target.value })}
                          className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Departamento</label>
                        <input
                          type="text"
                          required
                          value={tempProfile.department}
                          onChange={(e) => setTempProfile({ ...tempProfile, department: e.target.value })}
                          className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                        />
                      </div>
                    </div>
                  )}

                  {!isCustomer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">País</label>
                        <input
                          type="text"
                          value={tempProfile.country}
                          onChange={(e) => setTempProfile({ ...tempProfile, country: e.target.value })}
                          className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cidade</label>
                        <input
                          type="text"
                          value={tempProfile.city}
                          onChange={(e) => setTempProfile({ ...tempProfile, city: e.target.value })}
                          className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        {isCustomer ? 'E-mail' : 'E-mail Corporativo'}
                      </label>
                      <input
                        type="email"
                        required
                        value={tempProfile.email}
                        onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                        className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        {isCustomer ? 'Telefone' : 'Telefone Comercial'}
                      </label>
                      <input
                        type="text"
                        value={tempProfile.phone}
                        onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                        className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="border border-border text-foreground hover:bg-muted/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                      Salvar Informações
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm">
                  <div className="border-b border-border/60 pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Nome</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.firstName}</span>
                  </div>
                  <div className="border-b border-border/60 pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Sobrenome</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.lastName}</span>
                  </div>
                  {isCustomer ? (
                    <div className="border-b border-border/60 pb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Provedor</span>
                      <span className="font-semibold text-foreground mt-0.5 block">{profile.department}</span>
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-border/60 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Cargo</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{profile.position}</span>
                      </div>
                      <div className="border-b border-border/60 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Departamento</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{profile.department}</span>
                      </div>
                      <div className="border-b border-border/60 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">País</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{profile.country}</span>
                      </div>
                      <div className="border-b border-border/60 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Cidade</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{profile.city}</span>
                      </div>
                    </>
                  )}
                  <div className="border-b border-border/60 pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">E-mail</span>
                    <span className="font-semibold text-[#0B1D3A] mt-0.5 block">{profile.email}</span>
                  </div>
                  <div className="border-b border-border/60 pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Telefone</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.phone}</span>
                  </div>
                </div>
              )}
            </CardBox>
          )}

          {/* Tab View 2: Blog & Feed (Bitrix Feed style) */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Add Feed message */}
              <CardBox className="p-4 border border-[#0B1D3A]/25">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex bg-muted/15 p-1 rounded-lg border border-border w-fit">
                    <button
                      type="button"
                      onClick={() => setNewPostType('message')}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                        newPostType === 'message' ? 'bg-[#0B1D3A] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon icon="tabler:message" width={14} />
                      Mensagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPostType('event')}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                        newPostType === 'event' ? 'bg-[#0B1D3A] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon icon="tabler:calendar-event" width={14} />
                      Evento
                    </button>
                  </div>

                  <textarea
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={
                      newPostType === 'message'
                        ? 'Escreva uma mensagem ou compartilhe uma atualização com o time...'
                        : 'Descreva um evento ou atividade técnica a ser programada...'
                    }
                    className="w-full border border-border bg-transparent p-3 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] resize-none h-24"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      Publicar Feed
                    </button>
                  </div>
                </form>
              </CardBox>

              {/* Feed posts */}
              <div className="space-y-4">
                {posts.map((post) => {
                  const currentCommentText = commentInputs[post.id] || '';

                  return (
                    <CardBox key={post.id} className="p-5 space-y-4">
                      {/* Post Header */}
                      <div className="flex items-center gap-3">
                        <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full object-cover border border-border" />
                        <div>
                          <h6 className="font-extrabold text-foreground text-sm">{post.author}</h6>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-[#0B1D3A]">{post.role}</span>
                            <span>•</span>
                            <span>{post.time}</span>
                          </div>
                        </div>
                        {post.type === 'event' && (
                          <span className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                            <Icon icon="tabler:calendar" width={12} />
                            Evento
                          </span>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Post Action Bar (Likes and Comments toggle) */}
                      <div className="flex items-center gap-4 text-xs font-semibold pt-2 border-t border-border/50 text-muted-foreground">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1 transition-all ${
                            post.likedByUser ? 'text-red-500' : 'hover:text-red-500'
                          }`}
                        >
                          <Icon icon={post.likedByUser ? "tabler:heart-filled" : "tabler:heart"} width={16} />
                          <span>{post.likes} Curtidas</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <Icon icon="tabler:messages" width={16} />
                          <span>{post.comments.length} Comentários</span>
                        </span>
                      </div>

                      {/* Comments section */}
                      <div className="space-y-3 bg-muted/15 p-3 rounded-lg border border-border/40">
                        {post.comments.map((c) => (
                          <div key={c.id} className="flex gap-2.5 items-start text-xs border-b border-border/30 pb-2.5 last:border-b-0 last:pb-0">
                            <img src={c.avatar} alt={c.author} className="h-7 w-7 rounded-full object-cover shrink-0" />
                            <div>
                              <span className="font-extrabold text-foreground block">{c.author} <span className="font-normal text-muted-foreground text-[10px] ml-1.5">{c.time}</span></span>
                              <p className="text-muted-foreground mt-0.5">{c.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Add Comment Form */}
                        <div className="flex gap-2 items-center mt-2 pt-2 border-t border-border/30">
                          <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={currentCommentText}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id, currentCommentText);
                                setCommentInputs({ ...commentInputs, [post.id]: '' });
                              }
                            }}
                            className="flex-1 border border-border bg-white dark:bg-dark p-2 rounded-lg text-xs focus:outline-none focus:border-[#0B1D3A]"
                          />
                          <button
                            onClick={() => {
                              handleAddComment(post.id, currentCommentText);
                              setCommentInputs({ ...commentInputs, [post.id]: '' });
                            }}
                            className="bg-[#0B1D3A] text-white p-2 rounded-lg hover:bg-[#0B1D3A]/90 transition-all shrink-0"
                            title="Comentar"
                          >
                            <Icon icon="tabler:send" width={14} />
                          </button>
                        </div>
                      </div>
                    </CardBox>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab View 3: Atividades & Notas */}
          {activeTab === 'notas' && (
            <div className="space-y-6">
              {/* Note creator block */}
              <CardBox className="p-4">
                <h6 className="font-bold text-sm text-foreground mb-3">Nova Nota Pessoal</h6>
                <form onSubmit={handleCreateNote} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Título da Nota..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] font-bold"
                  />
                  <textarea
                    required
                    placeholder="Escreva os detalhes ou anotações técnicas aqui..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full border border-border bg-transparent p-3 rounded-lg text-sm focus:outline-none focus:border-[#0B1D3A] resize-none h-20"
                  />

                  <div className="flex justify-between items-center pt-1">
                    {/* Color selector picker */}
                    <div className="flex gap-2">
                      {[
                        { id: 'bg-amber-100 border-amber-300 dark:bg-amber-950/20 dark:border-amber-750', style: 'bg-amber-200 dark:bg-amber-950' },
                        { id: 'bg-blue-100 border-blue-300 dark:bg-blue-950/20 dark:border-blue-750', style: 'bg-blue-200 dark:bg-blue-950' },
                        { id: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-750', style: 'bg-emerald-200 dark:bg-emerald-950' },
                        { id: 'bg-rose-100 border-rose-300 dark:bg-rose-950/20 dark:border-rose-750', style: 'bg-rose-200 dark:bg-rose-950' }
                      ].map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setNewNoteColor(col.id)}
                          className={`h-6 w-6 rounded-full border transition-all ${col.style} ${
                            newNoteColor === col.id ? 'ring-2 ring-[#0B1D3A]' : 'scale-90 opacity-70'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      Salvar Nota
                    </button>
                  </div>
                </form>
              </CardBox>

              {/* Note Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note) => (
                  <div key={note.id} className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all duration-150 ${note.color}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h6 className="font-extrabold text-foreground text-sm">{note.title}</h6>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-muted-foreground hover:text-red-500 transition-all p-1"
                          title="Excluir Nota"
                        >
                          <Icon icon="tabler:trash" width={14} />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>
                    </div>

                    <div className="text-[9px] text-muted-foreground/80 font-mono text-right mt-3 border-t border-black/5 dark:border-white/5 pt-1.5">
                      Atualizado em: {note.updatedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
