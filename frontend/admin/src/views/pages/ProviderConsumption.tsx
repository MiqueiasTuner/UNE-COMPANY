import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const ProviderConsumption = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  /** Uma linha de fechamento de cobrança do SVA. */
  interface BillingStatement {
    period: string;
    activeLicenses: string;
    pricePerLicense: string;
    downloads: string;
    netTotal: string;
    invoiceStatus: string;
  }

  // Dados reais vêm da API — não popular com exemplos.
  // Origem: GET /api/v1/providers/{id}/billing-statements
  const billingStatements: BillingStatement[] = [];

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
              formatter: () => '0'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' }
  };

  // Dados reais vêm da API — não popular com exemplos.
  // Origem: GET /api/v1/providers/{id}/consumption
  const categorySeries: number[] = [];

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
    { name: 'Leitores Ativos', data: [] as number[] },
    { name: 'Downloads de Revistas', data: [] as number[] }
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

      {/*
        Indicadores de consumo.

        Os valores e as variações mês a mês são calculados no backend a partir de
        CustomerBooks e ProviderMagazines. Nenhum percentual é estimado aqui: uma
        variação "+8.5%" inventada é o tipo de número que acaba dentro de uma
        apresentação comercial para o provedor.
        Origem: GET /api/v1/providers/{id}/consumption?month=YYYY-MM
      */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardBox>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Assinantes Ativos</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">—</h3>
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
              <h3 className="text-2xl font-bold text-foreground mt-1">—</h3>
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
              <h3 className="text-2xl font-bold text-foreground mt-1">—</h3>
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
              <h3 className="text-2xl font-bold text-foreground mt-1">—</h3>
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
            {/*
              Fechamento de cobrança do SVA, por competência.
              Origem: GET /api/v1/providers/{id}/billing-statements

              Valor por licença e total líquido são dinheiro cobrado do provedor —
              exibir um número de exemplo aqui é o pior lugar possível para isso.
            */}
            <tbody>
              {billingStatements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum fechamento de cobrança disponível para o período selecionado.
                  </td>
                </tr>
              ) : (
                billingStatements.map((row) => (
                  <tr key={row.period} className="border-b border-border hover:bg-muted/5 transition-all">
                    <td className="p-4 text-foreground font-semibold">{row.period}</td>
                    <td className="p-4 font-mono text-foreground">{row.activeLicenses}</td>
                    <td className="p-4 font-mono text-foreground">{row.pricePerLicense}</td>
                    <td className="p-4 font-mono text-muted-foreground">{row.downloads}</td>
                    <td className="p-4 font-bold text-primary font-mono">{row.netTotal}</td>
                    <td className="p-4 text-right">
                      <span className="bg-muted text-foreground px-2.5 py-1 rounded-full text-xs font-bold">
                        {row.invoiceStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBox>
    </div>
  );
};

export default ProviderConsumption;
