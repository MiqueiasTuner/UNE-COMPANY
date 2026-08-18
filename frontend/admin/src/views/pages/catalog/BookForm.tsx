import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

/**
 * Tela cheia de cadastro/edição de título do catálogo global.
 *
 * Substitui o modal que expunha 4 campos — título, autor, categoria e formato — enquanto a
 * entidade Book tem treze, incluindo o que de fato entrega o livro ao assinante: a URL do
 * arquivo. Um título sem `fileUrl` aparece no catálogo e falha na hora da leitura, então o
 * campo ganhou seção própria em vez de ficar escondido atrás de um "avançado".
 */

type Section = 'OBRA' | 'ARQUIVO' | 'COMERCIAL' | 'PUBLICACAO';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'OBRA', label: 'Dados da Obra', icon: 'tabler:book' },
  { id: 'ARQUIVO', label: 'Arquivo & Capa', icon: 'tabler:file-download' },
  { id: 'COMERCIAL', label: 'Licenciamento', icon: 'tabler:certificate' },
  { id: 'PUBLICACAO', label: 'Publicação', icon: 'tabler:rocket' },
];

const BookForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [section, setSection] = useState<Section>('OBRA');
  const [error, setError] = useState<string | null>(null);

  // Dados da obra
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('');
  const [collection, setCollection] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [pageCount, setPageCount] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [description, setDescription] = useState('');

  // Arquivo
  const [fileUrl, setFileUrl] = useState('');
  const [fileFormat, setFileFormat] = useState('PDF');
  const [fileSizeMb, setFileSizeMb] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);

  // Licenciamento
  const [supplier, setSupplier] = useState('');
  const [licenseType, setLicenseType] = useState('PERPETUA');
  const [licenseStart, setLicenseStart] = useState('');
  const [licenseEnd, setLicenseEnd] = useState('');
  const [maxConcurrentReads, setMaxConcurrentReads] = useState('');
  const [costPerLicense, setCostPerLicense] = useState('');

  // Publicação
  const [status, setStatus] = useState('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [ageRating, setAgeRating] = useState('LIVRE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setSection('OBRA');
      setError('Título é obrigatório.');
      return;
    }

    // Um título publicado sem arquivo é um item que o assinante abre e não lê. Barrar aqui
    // é mais honesto do que deixar o erro aparecer no leitor do cliente final.
    if (status === 'PUBLISHED' && !fileUrl.trim()) {
      setSection('ARQUIVO');
      setError('Para publicar, informe a URL do arquivo — sem ela o assinante não consegue ler.');
      return;
    }

    setError(
      'O endpoint POST /api/v1/catalog/books ainda não existe no backend. ' +
        'Os dados do formulário estão prontos para ser enviados assim que ele for criado.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin/global-catalog')}
            className="shrink-0 h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted/20 transition-all"
            aria-label="Voltar para o catálogo"
          >
            <Icon icon="tabler:arrow-left" width={18} />
          </button>
          <div className="min-w-0">
            <h3 className="text-2xl font-bold text-foreground truncate">
              {isEditing ? 'Editar Título' : 'Novo Título do Catálogo'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Acervo global da FIKTA — distribuído aos provedores conforme licenciamento
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-2.5">
          <Icon icon="tabler:alert-triangle" width={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">{error}</div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0" aria-label="Seções do cadastro">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:sticky lg:top-24">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                aria-current={section === s.id ? 'page' : undefined}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
                  section === s.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-dark text-foreground border border-border hover:bg-muted/20'
                }`}
              >
                <Icon icon={s.icon} width={17} className="shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {section === 'OBRA' && (
            <CardBox className="space-y-5">
              <SectionTitle icon="tabler:book" title="Dados da Obra" subtitle="Identificação bibliográfica do título" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Título" required>
                    <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Subtítulo">
                    <input className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                  </Field>
                </div>
                <Field label="ISBN" hint="Identificador único da obra">
                  <input className={inputCls} value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-85-000-0000-0" />
                </Field>
                <Field label="Autor">
                  <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} />
                </Field>
                <Field label="Editora">
                  <input className={inputCls} value={publisher} onChange={(e) => setPublisher(e.target.value)} />
                </Field>
                <Field label="Categoria">
                  <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} />
                </Field>
                <Field label="Coleção" hint="Opcional">
                  <input className={inputCls} value={collection} onChange={(e) => setCollection(e.target.value)} />
                </Field>
                <Field label="Idioma">
                  <select className={inputCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">Inglês</option>
                    <option value="es-ES">Espanhol</option>
                  </select>
                </Field>
                <Field label="Nº de Páginas">
                  <input type="number" min={0} className={inputCls} value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
                </Field>
                <Field label="Ano de Publicação">
                  <input type="number" min={0} className={inputCls} value={publishYear} onChange={(e) => setPublishYear(e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Sinopse">
                    <textarea className={inputCls} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </Field>
                </div>
              </div>
            </CardBox>
          )}

          {section === 'ARQUIVO' && (
            <CardBox className="space-y-5">
              <SectionTitle
                icon="tabler:file-download"
                title="Arquivo & Capa"
                subtitle="É a URL do arquivo que entrega o livro ao assinante"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field
                    label="URL do Arquivo (download)"
                    hint="Link direto para o PDF/EPUB. Sem ele o título aparece no catálogo mas não abre."
                  >
                    <input
                      className={`${inputCls} font-mono text-xs`}
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://cdn.fikta.com.br/livros/titulo.pdf"
                    />
                  </Field>
                </div>
                <Field label="Formato">
                  <select className={inputCls} value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}>
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                    <option value="MOBI">MOBI</option>
                    <option value="AUDIOBOOK">Audiobook</option>
                  </select>
                </Field>
                <Field label="Tamanho (MB)" hint="Exibido ao assinante antes do download">
                  <input type="number" min={0} step="0.1" className={inputCls} value={fileSizeMb} onChange={(e) => setFileSizeMb(e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="URL da Capa">
                    <input
                      className={`${inputCls} font-mono text-xs`}
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://cdn.fikta.com.br/capas/titulo.jpg"
                    />
                  </Field>
                </div>
              </div>

              {coverUrl && (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/10">
                  <img
                    src={coverUrl}
                    alt="Pré-visualização da capa"
                    className="h-28 w-20 object-cover rounded-lg border border-border"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pré-visualização da capa. Se a imagem não aparecer, a URL está inacessível.
                  </p>
                </div>
              )}

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/10">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
                <span className="text-sm">
                  <strong className="block text-foreground">Permitir download do arquivo</strong>
                  <span className="text-xs text-muted-foreground">
                    Desmarcado, o assinante lê no leitor online mas não baixa o arquivo. Depende do que a
                    licença com a editora permite.
                  </span>
                </span>
              </label>
            </CardBox>
          )}

          {section === 'COMERCIAL' && (
            <CardBox className="space-y-5">
              <SectionTitle
                icon="tabler:certificate"
                title="Licenciamento"
                subtitle="Condições acordadas com o fornecedor da obra"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Fornecedor / Distribuidor">
                  <input className={inputCls} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </Field>
                <Field label="Tipo de Licença">
                  <select className={inputCls} value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
                    <option value="PERPETUA">Perpétua</option>
                    <option value="ASSINATURA">Por assinatura (vigência)</option>
                    <option value="POR_LEITURA">Por leitura</option>
                  </select>
                </Field>
                <Field label="Início da Vigência">
                  <input type="date" className={inputCls} value={licenseStart} onChange={(e) => setLicenseStart(e.target.value)} />
                </Field>
                <Field label="Fim da Vigência" hint="Vazio = sem prazo">
                  <input type="date" className={inputCls} value={licenseEnd} onChange={(e) => setLicenseEnd(e.target.value)} />
                </Field>
                <Field label="Leituras Simultâneas" hint="Vazio = ilimitado">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={maxConcurrentReads}
                    onChange={(e) => setMaxConcurrentReads(e.target.value)}
                  />
                </Field>
                <Field label="Custo por Licença (R$)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    value={costPerLicense}
                    onChange={(e) => setCostPerLicense(e.target.value)}
                  />
                </Field>
              </div>
            </CardBox>
          )}

          {section === 'PUBLICACAO' && (
            <CardBox className="space-y-5">
              <SectionTitle icon="tabler:rocket" title="Publicação" subtitle="Visibilidade do título na plataforma" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Situação">
                  <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="DRAFT">Rascunho (não visível)</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="ARCHIVED">Arquivado</option>
                  </select>
                </Field>
                <Field label="Classificação Indicativa">
                  <select className={inputCls} value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
                    <option value="LIVRE">Livre</option>
                    <option value="10">10 anos</option>
                    <option value="12">12 anos</option>
                    <option value="14">14 anos</option>
                    <option value="16">16 anos</option>
                    <option value="18">18 anos</option>
                  </select>
                </Field>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/10">
                <input type="checkbox" className="mt-0.5" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                <span className="text-sm">
                  <strong className="block text-foreground">Destacar na vitrine</strong>
                  <span className="text-xs text-muted-foreground">
                    Aparece em posição privilegiada no portal dos assinantes.
                  </span>
                </span>
              </label>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground">
                Publicar aqui coloca o título no <strong>acervo global</strong>. Quais provedores o recebem é
                definido separadamente, na liberação por parceiro.
              </div>
            </CardBox>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/global-catalog')}
              className="px-5 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted/20"
            >
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm">
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Título'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

const inputCls =
  'w-full border border-border bg-white dark:bg-dark p-2.5 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary';

const Field = ({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3 border-b border-border pb-4">
    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon icon={icon} width={18} />
    </div>
    <div className="min-w-0">
      <h4 className="font-bold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

export default BookForm;
