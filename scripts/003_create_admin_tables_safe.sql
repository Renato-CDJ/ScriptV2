-- =============================================
-- ADMIN TABLES - SAFE VERSION (ignores existing tables)
-- Execute this script in Supabase SQL Editor
-- =============================================

-- SCRIPTS / ROTEIROS
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'geral',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS / PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT DEFAULT 'geral',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABULATIONS / TABULACOES
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITUATIONS / SITUACOES
CREATE TABLE IF NOT EXISTS situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHANNELS / CANAIS
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'phone',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESULT CODES / CODIGOS DE RESULTADO
CREATE TABLE IF NOT EXISTS result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'geral',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INITIAL GUIDE / GUIA INICIAL
CREATE TABLE IF NOT EXISTS initial_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  step_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTES / BLOCO DE NOTAS
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Notas',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APP SETTINGS / CONFIGURACOES
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTENDANCE CONFIG / CONFIGURAR ATENDIMENTO
CREATE TABLE IF NOT EXISTS attendance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHRASEOLOGY / FRASEOLOGIA
CREATE TABLE IF NOT EXISTS phraseology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  shortcut TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE REALTIME (safe - ignores if already added)
-- =============================================
DO $$
DECLARE
  tbl TEXT;
  tables_to_add TEXT[] := ARRAY['scripts', 'products', 'tabulations', 'situations', 'channels', 'result_codes', 'initial_guide', 'notes', 'app_settings', 'attendance_config', 'phraseology', 'chat_messages'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- Table already in publication, ignore
      NULL;
    END;
  END LOOP;
END $$;

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default Tabulations
INSERT INTO tabulations (name, description, color) VALUES
('Venda Realizada', 'Cliente realizou a compra', '#22c55e'),
('Sem Interesse', 'Cliente nao tem interesse no momento', '#ef4444'),
('Callback', 'Retornar ligacao em outro momento', '#f59e0b'),
('Numero Invalido', 'Numero nao existe ou incorreto', '#6b7280'),
('Caixa Postal', 'Caiu na caixa postal', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Default Situations
INSERT INTO situations (name, description, color) VALUES
('Disponivel', 'Operador disponivel para atendimento', '#22c55e'),
('Em Ligacao', 'Operador em atendimento', '#f59e0b'),
('Pausa', 'Operador em pausa', '#6b7280'),
('Ausente', 'Operador ausente', '#ef4444')
ON CONFLICT DO NOTHING;

-- Default Channels
INSERT INTO channels (name, description, icon) VALUES
('Telefone', 'Atendimento via telefone', 'phone'),
('WhatsApp', 'Atendimento via WhatsApp', 'message-circle'),
('Email', 'Atendimento via email', 'mail'),
('Chat', 'Atendimento via chat do site', 'message-square')
ON CONFLICT DO NOTHING;

-- Default Result Codes
INSERT INTO result_codes (code, name, description, category, color) VALUES
('VEN001', 'Venda Confirmada', 'Venda realizada com sucesso', 'venda', '#22c55e'),
('VEN002', 'Venda Pendente', 'Venda aguardando confirmacao', 'venda', '#f59e0b'),
('CAL001', 'Callback Agendado', 'Retorno agendado pelo cliente', 'callback', '#3b82f6'),
('CAL002', 'Callback Nao Atendeu', 'Cliente nao atendeu retorno', 'callback', '#6b7280'),
('REC001', 'Recusa - Sem Interesse', 'Cliente recusou por falta de interesse', 'recusa', '#ef4444'),
('REC002', 'Recusa - Preco', 'Cliente recusou pelo preco', 'recusa', '#ef4444'),
('OUT001', 'Numero Errado', 'Numero de telefone incorreto', 'outro', '#6b7280'),
('OUT002', 'Caixa Postal', 'Ligacao caiu na caixa postal', 'outro', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Default Initial Guide
INSERT INTO initial_guide (title, content, step_order) VALUES
('Bem-vindo ao Sistema', 'Este e o guia inicial para novos operadores. Siga os passos abaixo para comecar.', 1),
('Login e Acesso', 'Use suas credenciais fornecidas pelo supervisor para acessar o sistema.', 2),
('Interface Principal', 'Conheca os principais elementos da interface e como navegar.', 3),
('Realizando Atendimentos', 'Aprenda como realizar e registrar atendimentos corretamente.', 4),
('Duvidas Frequentes', 'Consulte esta secao para duvidas comuns sobre o sistema.', 5)
ON CONFLICT DO NOTHING;

-- Default App Settings
INSERT INTO app_settings (key, value, description) VALUES
('company_name', '"RCP Call Center"', 'Nome da empresa'),
('working_hours', '{"start": "08:00", "end": "18:00"}', 'Horario de funcionamento'),
('break_duration', '15', 'Duracao da pausa em minutos'),
('theme', '"dark"', 'Tema padrao do sistema')
ON CONFLICT (key) DO NOTHING;

-- Default Phraseology
INSERT INTO phraseology (title, content, category, shortcut) VALUES
('Saudacao Inicial', 'Ola, bom dia/tarde! Meu nome e [NOME], em que posso ajudar?', 'abertura', '/oi'),
('Confirmacao de Dados', 'Posso confirmar seus dados? Nome completo e CPF, por favor.', 'dados', '/dados'),
('Aguardar na Linha', 'Por favor, aguarde um momento enquanto verifico as informacoes.', 'espera', '/aguarde'),
('Transferencia', 'Vou transferir sua ligacao para o setor responsavel.', 'transferencia', '/transfer'),
('Encerramento', 'Agradecemos seu contato. Tenha um otimo dia!', 'fechamento', '/tchau')
ON CONFLICT DO NOTHING;
