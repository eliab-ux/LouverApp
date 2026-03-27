-- Adicionar campos opcionais de cor e legenda na tabela estilos
-- Retrocompatível: colunas nullable, versão anterior do app não é afetada

ALTER TABLE public.estilos
  ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS legenda TEXT DEFAULT NULL;

-- Também adicionar na tabela de template (usada ao criar novas igrejas)
ALTER TABLE public.template_estilos
  ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS legenda TEXT DEFAULT NULL;
