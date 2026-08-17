import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  format: 'E-book' | 'Audiobook';
  status: boolean;
}

const initialBooks: Book[] = [
  { id: '1', title: 'O Alquimista', author: 'Paulo Coelho', category: 'Ficção', format: 'E-book', status: true },
  { id: '2', title: 'Pai Rico, Pai Pobre', author: 'Robert Kiyosaki', category: 'Finanças', format: 'Audiobook', status: true },
  { id: '3', title: 'A Arte da Guerra', author: 'Sun Tzu', category: 'Estratégia', format: 'E-book', status: true },
  { id: '4', title: 'Hábitos Atômicos', author: 'James Clear', category: 'Desenvolvimento Pessoal', format: 'Audiobook', status: true },
  { id: '5', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'História', format: 'E-book', status: false },
];

const GlobalCatalog = () => {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Ficção');
  const [format, setFormat] = useState<'E-book' | 'Audiobook'>('E-book');

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    const newBook: Book = {
      id: Date.now().toString(),
      title,
      author,
      category,
      format,
      status: true
    };

    setBooks([newBook, ...books]);
    setTitle('');
    setAuthor('');
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setBooks(books.map(b => b.id === id ? { ...b, status: !b.status } : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Catálogo Global</h3>
          <p className="text-sm text-muted-foreground">Global Context: Gerencie títulos de e-books e audiobooks ativos no ecossistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
        >
          <Icon icon="tabler:plus" width={18} />
          Adicionar Título
        </button>
      </div>

      <CardBox>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground">Título</th>
                <th className="p-4 font-semibold text-muted-foreground">Autor</th>
                <th className="p-4 font-semibold text-muted-foreground">Categoria</th>
                <th className="p-4 font-semibold text-muted-foreground">Formato</th>
                <th className="p-4 font-semibold text-muted-foreground">Distribuição</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-border hover:bg-muted/5 transition-all">
                  <td className="p-4 font-medium text-foreground">{b.title}</td>
                  <td className="p-4 text-foreground">{b.author}</td>
                  <td className="p-4 text-muted-foreground">{b.category}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      b.format === 'Audiobook' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}>
                      <Icon icon={b.format === 'Audiobook' ? 'tabler:headphones' : 'tabler:book'} width={14} />
                      {b.format}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${
                      b.status ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${b.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {b.status ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => toggleStatus(b.id)}
                      className="text-muted-foreground hover:text-primary transition-all p-1"
                      title={b.status ? 'Pausar Distribuição' : 'Ativar Distribuição'}
                    >
                      <Icon icon={b.status ? 'tabler:circle-dot' : 'tabler:circle'} width={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBox>

      {/* Add Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark border border-border w-full max-w-md p-6 rounded-xl shadow-lg relative animate-fade-in">
            <h4 className="text-lg font-bold text-foreground mb-4">Adicionar Novo Título ao Catálogo</h4>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Título do Livro *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pai Rico, Pai Pobre"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Autor *</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Robert Kiyosaki"
                  className="w-full border border-border bg-transparent p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="Ficção">Ficção</option>
                    <option value="Finanças">Finanças</option>
                    <option value="Estratégia">Estratégia</option>
                    <option value="Desenvolvimento Pessoal">Desenvolvimento Pessoal</option>
                    <option value="História">História</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'E-book' | 'Audiobook')}
                    className="w-full border border-border bg-transparent dark:bg-dark p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="E-book">E-book</option>
                    <option value="Audiobook">Audiobook</option>
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
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Salvar Título
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalCatalog;
