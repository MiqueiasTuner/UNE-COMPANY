/**
 * Cliente HTTP único para a API da FIKTA.
 *
 * Existe para que nenhuma tela repita o par "tenta pelo proxy do Vite, cai para a porta
 * 5089" nem invente o próprio tratamento de erro. Uma falha aqui vira sempre uma mensagem
 * legível — telas nunca devem exibir "[object Object]" nem cair em dados de exemplo
 * quando a API não responde.
 */

/** Porta do backend .NET em desenvolvimento, usada quando o proxy do Vite não resolve. */
const DIRECT_API_ORIGIN = 'http://localhost:5089';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let res: Response;
  try {
    res = await fetch(path, init);
    // O proxy do Vite devolve 404 quando o backend não está no ar; nesse caso vale
    // tentar direto, para que o erro exibido seja o do backend e não o do proxy.
    if (res.status === 404) {
      res = await fetch(`${DIRECT_API_ORIGIN}${path}`, init);
    }
  } catch {
    throw new ApiError(
      'Não foi possível falar com a API. Verifique se o backend está em execução na porta 5089.',
      0
    );
  }

  const text = await res.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    // O proxy do Vite devolve 502/500 com corpo vazio quando o backend está fora do ar.
    // Repassar "A API respondeu 500" nesse caso manda o leitor caçar um bug de servidor
    // que não existe — a causa é o processo não estar rodando.
    const backendDown = (res.status === 500 || res.status === 502 || res.status === 504) && !payload;
    if (backendDown) {
      throw new ApiError(
        'O backend não está respondendo. Verifique se a API está em execução na porta 5089.',
        res.status
      );
    }

    const message =
      (payload && (payload.error || payload.message || payload.Error || payload.Message)) ||
      `A API respondeu ${res.status}.`;
    throw new ApiError(message, res.status, payload);
  }

  return normalizeKeys(payload) as T;
}

/**
 * Converte as chaves de PascalCase (padrão do System.Text.Json no ASP.NET com objetos
 * anônimos) para camelCase, que é o que o TypeScript espera. Feito num ponto só para que
 * nenhuma tela precise checar `data.Providers ?? data.providers`.
 */
function normalizeKeys(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (value === null || typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    out[camel] = normalizeKeys(val);
  }
  return out;
}

// Declarações de função, e não arrow: este projeto compila .ts com o loader `tsx`
// (ver vite.config.ts), onde `<T>` numa arrow é lido como JSX e quebra o build.
export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}
