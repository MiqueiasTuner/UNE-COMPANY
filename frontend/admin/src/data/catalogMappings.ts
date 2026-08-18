// Vínculo entre um serviço do ERP do provedor e um catálogo da FIKTA.
//
// Consumido por PlanMapping (onde a FIKTA configura) e por Subscriptions (onde o contrato
// de um assinante é resolvido para saber a quais títulos ele tem direito).
//
// A chave é o par (providerId, externalCode) — nunca o nome do plano. O `code` do serviço
// no Voalle segue "{tipoContrato}.{sequencial}" e é estável por tenant, mas NÃO é global:
// o código "1.3" da UNE TELECOM não é o mesmo serviço que o "1.3" da TechNet.
// Ver docs/architecture/VOALLE-PORTAL-V2-API.md e VOALLE-API-REFERENCE.md §2.9.4.
export interface CatalogMapping {
  id: string;
  /** Provedor dono do mapeamento. Sem ele os códigos de ERPs diferentes colidem. */
  providerId: string;
  /** Código do serviço no ERP do provedor, ex.: "1.3". Chave real do vínculo. */
  externalCode: string;
  /** Nome do serviço no ERP, apenas para o operador reconhecer na tela. */
  planErpName: string;
  /** Catálogo da FIKTA liberado por este serviço. */
  productLinked: string;
  /** Quantidade de títulos no catálogo — calculada no backend, não digitada. */
  bookCount: number;
  status: boolean;
}

// Dados reais vêm da API — não popular com exemplos.
// Origem: GET /api/v1/providers/{id}/plan-mappings
export const catalogMappings: CatalogMapping[] = [];

/**
 * Resolve o catálogo da FIKTA a partir do código de serviço do ERP, dentro do provedor.
 *
 * Substitui o casamento por nome que existia antes: comparar rótulos livres ("500 Mega +
 * FIKTA Ouro") quebra quando o provedor renomeia o plano no ERP, e pior, pode casar o
 * plano errado por coincidência de palavra. O código é o identificador de verdade.
 */
export function matchCatalogByCode(
  providerId: string,
  externalCode: string,
  mappings: CatalogMapping[] = catalogMappings
): CatalogMapping | undefined {
  if (!providerId || !externalCode) return undefined;
  return mappings.find(
    (m) => m.providerId === providerId && m.externalCode === externalCode && m.status
  );
}
