import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const ProviderConsumption = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  // Sample data for charts
  const categoryChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
    },
    colors: ['#51A8B1', '#F86D72', '#ffae1f', '#fa896b', '#39b54a'],
    labels: ['Ficção / Romance', 'Tecnologia / Ciência', 'Autoajuda / Negócios', 'Revistas de Variedades', 'Audiobooks Infantis'],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          background: 'transparent',
          labels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: {
              show: true,
              label: 'Total Acessos',
              formatter: () => '14,820'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' }
  };

  const categorySeries = [4500, 3200, 2900, 2400, 1820];

  const consumptionHistoryOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: { show: false },
    },
    colors: ['#51A8B1', '#ffae1f'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: ['Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'],
    },
    tooltip: { theme: 'dark' },
    grid: { borderColor: 'rgba(0,0,0,0.1)' }
  };

  const consumptionHistorySeries = [
    { name: 'Leitores Ativos', data: [3100, 3400, 3900, 4200, 4800, 5210] },
    { name: 'Downloads de Revistas', data: [1200, 1500, 1800, 1900, 2100, 2450] }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Relatório de Consumo</h3>
          <p className="text-sm text-muted-foreground">Monitore os cliques, acessos, volumes de download e métricas de faturamento do SVA</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-border bg-white dark:bg-dark p-2 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground font-semibold"
          >
            <option value="2026-08">Agosto / 2026 (Corrente)</option>
            <option value="2026-07">Julho / 2026</option>
            <option value="2026-06">Junho / 2026</option>
            <option value="2026-05">Maio / 2026</option>
          </select>
          <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all">
            <Icon icon="tabler:download" width={18} />
            Exportar XLS
          </button>
        </div>
      </div>

      {/* Consumption Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardBox>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Assinantes Ativos</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">5,210</h3>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
                <Icon icon="tabler:arrow-up-right" />
                +8.5% vs mês anterior
              </span>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Icon icon="tabler:users" width={24} />
            </div>
          </div>
        </CardBox>
        <CardBox>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Leituras Completadas</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">1,482</h3>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
                <Icon icon="tabler:arrow-up-right" />
                +12.4% vs mês anterior
              </span>
            </div>
            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/35 dark:text-emerald-300 rounded-xl flex items-center justify-center">
              <Icon icon="tabler:book-open" width={24} />
            </div>
          </div>
        </CardBox>
        <CardBox>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tráfego de Dados (DRM)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">48.6 GB</h3>
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-1">
                Taxa de compressão ativa
              </span>
            </div>
            <div className="h-12 w-12 bg-amber-100 text-amber-600 dark:bg-amber-900/35 dark:text-amber-300 rounded-xl flex items-center justify-center">
              <Icon icon="tabler:chart-arrows" width={24} />
            </div>
          </div>
        </CardBox>
        <CardBox>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Faturamento Estimado</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">R$ 10.420,00</h3>
              <span className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
                Tarifa SVA Especial
              </span>
            </div>
            <div className="h-12 w-12 bg-red-100 text-red-600 dark:bg-red-900/35 dark:text-red-300 rounded-xl flex items-center justify-center">
              <Icon icon="tabler:cash" width={24} />
            </div>
          </div>
        </CardBox>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4">Histórico de Engajamento de Leitores</h4>
            <Chart options={consumptionHistoryOptions} series={consumptionHistorySeries} type="area" height={300} />
          </CardBox>
        </div>
        <div>
          <CardBox>
            <h4 className="text-lg font-bold text-foreground mb-4">Acessos por Categoria</h4>
            <div className="flex justify-center items-center h-[300px]">
              <Chart options={categoryChartOptions} series={categorySeries} type="donut" width="100%" />
            </div>
          </CardBox>
        </div>
      </div>

      {/* Auditing Table */}
      <CardBox>
        <h4 className="text-lg font-bold text-foreground mb-4">Detalhamento de Cobrança (Itens de Catálogo Consumidos)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="p-4 font-semibold text-muted-foreground">Mês de Referência</th>
                <th className="p-4 font-semibold text-muted-foreground">Qtd. Licenças Ativas</th>
                <th className="p-4 font-semibold text-muted-foreground">Valor por Licença (SVA)</th>
                <th className="p-4 font-semibold text-muted-foreground">Downloads Efetuados</th>
                <th className="p-4 font-semibold text-muted-foreground">Total Líquido</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Status do Boleto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-4 text-foreground font-semibold">Agosto/2026</td>
                <td className="p-4 font-mono text-foreground">5,210</td>
                <td className="p-4 font-mono text-foreground">R$ 2,00</td>
                <td className="p-4 font-mono text-muted-foreground">2,450</td>
                <td className="p-4 font-bold text-primary font-mono">R$ 10.420,00</td>
                <td className="p-4 text-right">
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    Aberto (Vencimento 15/09)
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border hover:bg-muted/5 transition-all">
                <td className="p-4 text-foreground font-semibold">Julho/2026</td>
                <td className="p-4 font-mono text-foreground">4,800</td>
                <td className="p-4 font-mono text-foreground">R$ 2,00</td>
                <td className="p-4 font-mono text-muted-foreground">2,100</td>
                <td className="p-4 font-bold text-foreground font-mono">R$ 9.600,00</td>
                <td className="p-4 text-right">
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    Pago em 14/08/2026
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </div>
  );
};

export default ProviderConsumption;
