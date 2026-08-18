import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';

interface Magazine {
  id: string;
  title: string;
  month: string;
  year: string;
  category: string;
  downloads: string;
  color: string;
}

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/providers/{id}/magazines
const magazines: Magazine[] = [];

const DigitalMagazines = () => {

  const handleDownload = (title: string) => {
    alert(`Preparando download da "${title}". O arquivo PDF será baixado em instantes.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Revistas Digitais</h3>
          <p className="text-sm text-muted-foreground">Download e distribuição de edições periódicas mensais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {magazines.map((mag) => (
          <CardBox key={mag.id} className="flex flex-col justify-between overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border">
            {/* Magazine Cover illustration */}
            <div className={`w-full aspect-[3/4] rounded-lg bg-gradient-to-br ${mag.color} p-4 flex flex-col justify-between text-white relative shadow-inner overflow-hidden mb-4`}>
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Spine Effect */}
              <div className="absolute top-0 left-0 w-2 h-full bg-white/10 backdrop-blur-xs border-r border-black/10" />
              
              <div className="flex justify-between items-start pl-3">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {mag.year}
                </span>
                <Icon icon="tabler:book-2" width={20} className="opacity-80" />
              </div>
              
              <div className="pl-3 space-y-1">
                <p className="text-xs font-semibold opacity-90 uppercase tracking-wider">{mag.month}</p>
                <h4 className="text-lg font-black tracking-tight leading-tight uppercase">{mag.category}</h4>
              </div>

              <div className="pl-3 flex justify-between items-center text-[10px] opacity-75">
                <span>FIKTA EDITORA</span>
                <span className="flex items-center gap-0.5">
                  <Icon icon="tabler:download" width={10} /> {mag.downloads}
                </span>
              </div>
            </div>

            {/* Info and Actions */}
            <div className="space-y-3">
              <div>
                <h5 className="font-bold text-foreground text-base truncate">{mag.title}</h5>
                <p className="text-xs text-muted-foreground">{mag.category}</p>
              </div>
              
              <button
                onClick={() => handleDownload(mag.title)}
                className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Icon icon="tabler:download" width={16} />
                Download PDF
              </button>
            </div>
          </CardBox>
        ))}
      </div>
    </div>
  );
};

export default DigitalMagazines;
