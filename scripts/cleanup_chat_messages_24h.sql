-- ============================================================
-- LIMPEZA AUTOMATICA DE MENSAGENS DE CHAT (24 HORAS)
-- 
-- Este script configura a limpeza automatica de mensagens
-- das tabelas supervisor_chat_messages e quality_chat_messages
-- que tenham mais de 24 horas.
-- 
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. FUNCAO PARA LIMPAR MENSAGENS ANTIGAS
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_supervisor INTEGER := 0;
  deleted_quality INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  -- Deletar mensagens do chat com supervisao com mais de 24 horas
  DELETE FROM supervisor_chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_supervisor = ROW_COUNT;
  
  -- Deletar mensagens do chat com qualidade com mais de 24 horas
  DELETE FROM quality_chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_quality = ROW_COUNT;
  
  total_deleted := deleted_supervisor + deleted_quality;
  
  -- Log da operacao (opcional - pode ser removido em producao)
  RAISE NOTICE 'Limpeza concluida: % mensagens do supervisor, % mensagens da qualidade deletadas', 
    deleted_supervisor, deleted_quality;
  
  RETURN total_deleted;
END;
$$;

-- ============================================================
-- 2. HABILITAR EXTENSAO PG_CRON (se nao estiver habilitada)
-- 
-- IMPORTANTE: Voce precisa habilitar pg_cron no Dashboard do Supabase:
-- 1. Va em Database > Extensions
-- 2. Procure por "pg_cron"
-- 3. Habilite a extensao
-- ============================================================

-- Verificar se pg_cron esta disponivel
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'ATENCAO: A extensao pg_cron NAO esta habilitada.';
    RAISE NOTICE 'Para habilitar: Va em Supabase Dashboard > Database > Extensions > pg_cron';
    RAISE NOTICE 'Apos habilitar, execute o comando de agendamento abaixo.';
  ELSE
    RAISE NOTICE 'pg_cron esta habilitado!';
  END IF;
END;
$$;

-- ============================================================
-- 3. AGENDAR EXECUCAO A CADA HORA
-- 
-- Executa a limpeza a cada hora para garantir que mensagens
-- com mais de 24 horas sejam removidas regularmente.
-- 
-- EXECUTE ESTE COMANDO APENAS SE pg_cron ESTIVER HABILITADO:
-- ============================================================

-- Remover job anterior se existir (evita duplicatas)
-- SELECT cron.unschedule('cleanup-chat-messages-24h');

-- Agendar novo job para executar a cada hora
-- SELECT cron.schedule(
--   'cleanup-chat-messages-24h',           -- nome do job
--   '0 * * * *',                            -- a cada hora (minuto 0)
--   'SELECT cleanup_old_chat_messages()'    -- funcao a executar
-- );

-- ============================================================
-- 4. ALTERNATIVA: EXECUTAR MANUALMENTE
-- 
-- Se voce nao quiser usar pg_cron, pode executar manualmente:
-- SELECT cleanup_old_chat_messages();
-- 
-- Ou criar um endpoint na API para chamar periodicamente
-- ============================================================

-- ============================================================
-- 5. VERIFICAR JOBS AGENDADOS (apos habilitar pg_cron)
-- ============================================================
-- SELECT * FROM cron.job;

-- ============================================================
-- 6. TESTAR A FUNCAO (executar manualmente)
-- ============================================================
-- SELECT cleanup_old_chat_messages();

-- ============================================================
-- INSTRUCOES DE USO:
-- 
-- OPCAO 1 - Com pg_cron (recomendado para limpeza automatica):
-- 1. Habilite pg_cron no Dashboard: Database > Extensions > pg_cron
-- 2. Execute este script inteiro
-- 3. Descomente e execute os comandos SELECT cron.schedule(...)
-- 
-- OPCAO 2 - Sem pg_cron (limpeza via API):
-- 1. Execute apenas a funcao cleanup_old_chat_messages()
-- 2. Crie um endpoint API que chama essa funcao
-- 3. Use um cron job externo (Vercel Cron, etc) para chamar o endpoint
-- ============================================================
