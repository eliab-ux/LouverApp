-- Habilitar RLS nas tabelas restantes com alerta de segurança
-- Não requer nova versão do app

-- tipos_evento: usada pelo app — precisa de política SELECT
ALTER TABLE public.tipos_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_evento_select_authenticated"
  ON public.tipos_evento
  FOR SELECT
  TO authenticated
  USING (true);

-- rls_debug_log: tabela de debug interna — apenas habilita RLS (sem política = bloqueia acesso externo)
ALTER TABLE public.rls_debug_log ENABLE ROW LEVEL SECURITY;

-- momentos: tabela não utilizada pelo app — apenas habilita RLS
ALTER TABLE public.momentos ENABLE ROW LEVEL SECURITY;
