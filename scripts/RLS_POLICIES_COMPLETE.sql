-- ============================================================
-- REPIR - ROTEIRO CALL CENTER
-- POLITICAS RLS COMPLETAS PARA TODAS AS TABELAS
-- 
-- Execute este script no SQL Editor do Supabase
-- Versao: 1.0
-- ============================================================

-- ============================================================
-- DESABILITAR RLS PARA TODAS AS TABELAS
-- (Necessario para que operadores consigam acessar os dados)
-- ============================================================

-- Tabelas principais
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tabulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS situations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS result_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS initial_guide DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS phraseology DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings DISABLE ROW LEVEL SECURITY;

-- Tabelas de comunicacao
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervisor_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_chat_messages DISABLE ROW LEVEL SECURITY;

-- Tabelas de qualidade
ALTER TABLE IF EXISTS quality_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedbacks DISABLE ROW LEVEL SECURITY;

-- Tabelas de quiz e treinamento
ALTER TABLE IF EXISTS quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS presentations DISABLE ROW LEVEL SECURITY;

-- Tabelas adicionais
ALTER TABLE IF EXISTS attendance_config DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- CRIAR POLITICAS PERMISSIVAS PARA TODAS AS TABELAS
-- (Caso RLS seja habilitado no futuro)
-- ============================================================

DO $$
DECLARE
  all_tables TEXT[] := ARRAY[
    'users', 'operators', 'products', 'scripts', 'tabulations', 
    'situations', 'channels', 'result_codes', 'initial_guide', 
    'contracts', 'phraseology', 'notes', 'app_settings', 'messages',
    'chat_messages', 'supervisor_chat_messages', 'quality_chat_messages',
    'quality_posts', 'quality_comments', 'quality_questions', 
    'admin_questions', 'feedbacks', 'quizzes', 'quiz_attempts', 
    'training_views', 'presentations', 'attendance_config'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY all_tables
  LOOP
    BEGIN
      -- Remover politicas existentes
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable update for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable delete for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow read access" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all operations" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "public_read" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "public_insert" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "public_update" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "public_delete" ON %I', tbl);
      
      -- Criar politicas permissivas
      EXECUTE format('CREATE POLICY "Enable read access for all users" ON %I FOR SELECT USING (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable insert for all users" ON %I FOR INSERT WITH CHECK (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable update for all users" ON %I FOR UPDATE USING (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable delete for all users" ON %I FOR DELETE USING (true)', tbl);
      
      RAISE NOTICE 'Politicas criadas para tabela: %', tbl;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Tabela nao existe: %', tbl;
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao processar tabela %: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================
-- GARANTIR QUE REALTIME ESTA HABILITADO PARA TODAS AS TABELAS
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables_realtime TEXT[] := ARRAY[
    'users', 'products', 'scripts', 'tabulations', 'situations', 
    'channels', 'result_codes', 'initial_guide', 'contracts', 
    'phraseology', 'notes', 'app_settings', 'messages', 'quizzes', 
    'quiz_attempts', 'feedbacks', 'quality_posts', 'quality_comments', 
    'quality_questions', 'admin_questions', 'chat_messages', 
    'attendance_config', 'presentations', 'operators', 'training_views',
    'supervisor_chat_messages', 'quality_chat_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_realtime
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      RAISE NOTICE 'Realtime habilitado para: %', tbl;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Realtime ja habilitado para: %', tbl;
    WHEN undefined_table THEN
      RAISE NOTICE 'Tabela nao existe para realtime: %', tbl;
    END;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICAR CONFIGURACOES DE CONEXAO
-- ============================================================

-- Aumentar timeout de statement (se necessario)
-- ALTER DATABASE postgres SET statement_timeout = '60s';

-- ============================================================
-- FIM DO SCRIPT
-- Execute este script para garantir que todas as tabelas
-- estejam acessiveis para operadores, supervisores e admins.
-- ============================================================
