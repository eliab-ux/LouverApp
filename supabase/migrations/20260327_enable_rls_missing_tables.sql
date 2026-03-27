-- Habilitar RLS nas tabelas que tinham políticas definidas mas RLS desativado
-- Corrige o alerta: "Table has RLS policies but RLS is not enabled"
-- Não requer nova versão do app — é correção apenas no banco de dados

ALTER TABLE public.categorias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momentos_culto   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estilos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musicas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igrejas          ENABLE ROW LEVEL SECURITY;
