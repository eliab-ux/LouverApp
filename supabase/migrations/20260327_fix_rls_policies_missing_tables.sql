-- Adicionar policies SELECT/INSERT/UPDATE/DELETE para tabelas que tiveram
-- RLS habilitado mas não tinham policies — causava bloqueio total de leitura.

-- ============================================================
-- CATEGORIAS
-- ============================================================
DROP POLICY IF EXISTS "select_categorias_mesma_igreja" ON public.categorias;
DROP POLICY IF EXISTS "insert_categorias_admin_ou_lider" ON public.categorias;
DROP POLICY IF EXISTS "update_categorias_admin_ou_lider" ON public.categorias;
DROP POLICY IF EXISTS "Admin delete categorias" ON public.categorias;

CREATE POLICY "select_categorias_mesma_igreja" ON public.categorias
  FOR SELECT TO authenticated
  USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_categorias_admin_ou_lider" ON public.categorias
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "update_categorias_admin_ou_lider" ON public.categorias
  FOR UPDATE TO authenticated
  USING (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "Admin delete categorias" ON public.categorias
  FOR DELETE TO authenticated
  USING (
    public.get_my_papel() = 'admin'
    AND igreja_id = public.get_my_igreja_id()
  );

-- ============================================================
-- MOMENTOS_CULTO
-- ============================================================
DROP POLICY IF EXISTS "select_momentos_mesma_igreja" ON public.momentos_culto;
DROP POLICY IF EXISTS "insert_momentos_admin_ou_lider" ON public.momentos_culto;
DROP POLICY IF EXISTS "update_momentos_admin_ou_lider" ON public.momentos_culto;
DROP POLICY IF EXISTS "delete_momentos_admin" ON public.momentos_culto;

CREATE POLICY "select_momentos_mesma_igreja" ON public.momentos_culto
  FOR SELECT TO authenticated
  USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_momentos_admin_ou_lider" ON public.momentos_culto
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "update_momentos_admin_ou_lider" ON public.momentos_culto
  FOR UPDATE TO authenticated
  USING (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "delete_momentos_admin" ON public.momentos_culto
  FOR DELETE TO authenticated
  USING (
    public.get_my_papel() = 'admin'
    AND igreja_id = public.get_my_igreja_id()
  );

-- ============================================================
-- ESTILOS
-- ============================================================
DROP POLICY IF EXISTS "select_estilos_mesma_igreja" ON public.estilos;
DROP POLICY IF EXISTS "insert_estilos_admin_ou_lider" ON public.estilos;
DROP POLICY IF EXISTS "update_estilos_admin_ou_lider" ON public.estilos;
DROP POLICY IF EXISTS "delete_estilos_admin" ON public.estilos;

CREATE POLICY "select_estilos_mesma_igreja" ON public.estilos
  FOR SELECT TO authenticated
  USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_estilos_admin_ou_lider" ON public.estilos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "update_estilos_admin_ou_lider" ON public.estilos
  FOR UPDATE TO authenticated
  USING (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "delete_estilos_admin" ON public.estilos
  FOR DELETE TO authenticated
  USING (
    public.get_my_papel() = 'admin'
    AND igreja_id = public.get_my_igreja_id()
  );

-- ============================================================
-- MUSICAS
-- ============================================================
DROP POLICY IF EXISTS "select_musicas_mesma_igreja" ON public.musicas;
DROP POLICY IF EXISTS "insert_musicas_admin_ou_lider" ON public.musicas;
DROP POLICY IF EXISTS "update_musicas_admin_ou_lider" ON public.musicas;
DROP POLICY IF EXISTS "delete_musicas_admin" ON public.musicas;

CREATE POLICY "select_musicas_mesma_igreja" ON public.musicas
  FOR SELECT TO authenticated
  USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_musicas_admin_ou_lider" ON public.musicas
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "update_musicas_admin_ou_lider" ON public.musicas
  FOR UPDATE TO authenticated
  USING (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  );

CREATE POLICY "delete_musicas_admin" ON public.musicas
  FOR DELETE TO authenticated
  USING (
    public.get_my_papel() = 'admin'
    AND igreja_id = public.get_my_igreja_id()
  );

-- ============================================================
-- IGREJAS (membros leem apenas sua própria igreja)
-- ============================================================
DROP POLICY IF EXISTS "select_igrejas_propria" ON public.igrejas;
DROP POLICY IF EXISTS "update_igrejas_admin" ON public.igrejas;

CREATE POLICY "select_igrejas_propria" ON public.igrejas
  FOR SELECT TO authenticated
  USING (id = public.get_my_igreja_id());

CREATE POLICY "update_igrejas_admin" ON public.igrejas
  FOR UPDATE TO authenticated
  USING (
    public.get_my_papel() = 'admin'
    AND id = public.get_my_igreja_id()
  );
