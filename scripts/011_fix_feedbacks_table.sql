-- Script para corrigir a tabela feedbacks existente
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas faltantes na tabela feedbacks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'recipient_id') THEN
    ALTER TABLE feedbacks ADD COLUMN recipient_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'sender_id') THEN
    ALTER TABLE feedbacks ADD COLUMN sender_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'sender_name') THEN
    ALTER TABLE feedbacks ADD COLUMN sender_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'type') THEN
    ALTER TABLE feedbacks ADD COLUMN type TEXT DEFAULT 'positive';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'message') THEN
    ALTER TABLE feedbacks ADD COLUMN message TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'is_read') THEN
    ALTER TABLE feedbacks ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_feedbacks_recipient ON feedbacks(recipient_id);
