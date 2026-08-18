import { useEffect, useRef } from 'react';

/**
 * Reexecuta uma carga de dados periodicamente e quando a aba volta ao foco.
 *
 * Existe porque telas que buscam dados só na montagem envelhecem em silêncio: quem deixa o
 * painel aberto continua vendo o estado de meia hora atrás e não tem como saber disso.
 * O gatilho por foco é o que mais importa na prática — a pessoa cadastra um provedor em
 * outra aba, volta, e espera encontrar o número já atualizado.
 *
 * Não dispara enquanto a aba está oculta: bater na API a cada 30s em vinte abas esquecidas
 * gasta banco e, no caso das rotas que consultam o ERP, orçamento de rate limit.
 */
export function useAutoRefresh(refresh: () => void, intervalMs = 30_000) {
  // Guardado em ref para que trocar a identidade da função entre renders não reinicie o
  // timer — senão uma callback recriada a cada render zera o intervalo para sempre.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };

    const timer = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [intervalMs]);
}
