// Shared between PlanMapping (where FIKTA managers configure the catalogs) and
// Subscriptions (where a Voalle contract's service-catalog code is matched against
// these entries to know how many pre-configured books/titles a customer unlocks).
export interface CatalogMapping {
  id: string;
  planErpId: string;
  planErpName: string;
  productLinked: string;
  bookCount: number;
  status: boolean;
}

export const catalogMappings: CatalogMapping[] = [
  { id: '1', planErpId: '101', planErpName: '500 Mega + FIKTA Ouro', productLinked: 'Biblioteca Gold', bookCount: 260, status: true },
  { id: '2', planErpId: '102', planErpName: '1 Giga Ultra Diamante', productLinked: 'Biblioteca Diamante', bookCount: 480, status: true },
  { id: '3', planErpId: '205', planErpName: 'Plano Combo Família Bronze', productLinked: 'Banca Standard', bookCount: 80, status: true },
  { id: '4', planErpId: '304', planErpName: 'Banda Larga Comercial Gold', productLinked: 'Banca Premium', bookCount: 150, status: false },
];

/** Loosely match a Voalle service-catalog / contract label against a configured FIKTA catalog by name. */
export function matchCatalogByLabel(label: string): CatalogMapping | undefined {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return undefined;
  return catalogMappings.find((m) => {
    const name = m.planErpName.toLowerCase();
    const product = m.productLinked.toLowerCase();
    return normalized.includes(name) || name.includes(normalized) || normalized.includes(product) || product.includes(normalized);
  });
}
