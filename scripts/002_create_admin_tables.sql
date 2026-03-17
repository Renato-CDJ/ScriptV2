-- =============================================
-- ROTEIROS / SCRIPTS
-- =============================================
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'geral',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scripts;

-- =============================================
-- PRODUTOS / PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'geral',
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- =============================================
-- TABULACOES / TABULATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tabulations;

-- =============================================
-- SITUACOES / SITUATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE situations;

-- =============================================
-- CANAIS / CHANNELS
-- =============================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'phone',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE channels;

-- =============================================
-- CODIGOS DE RESULTADO / RESULT CODES
-- =============================================
CREATE TABLE IF NOT EXISTS result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'geral',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE result_codes;

-- =============================================
-- GUIA INICIAL / INITIAL GUIDE
-- =============================================
CREATE TABLE IF NOT EXISTS initial_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  step_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE initial_guide;

-- =============================================
-- BLOCO DE NOTAS / NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  color TEXT DEFAULT '#fef3c7',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- =============================================
-- CONFIGURACOES / SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;

-- =============================================
-- CONFIGURAR ATENDIMENTO / ATTENDANCE CONFIG
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_config;

-- =============================================
-- FRASEOLOGIA / PHRASEOLOGY
-- =============================================
CREATE TABLE IF NOT EXISTS phraseology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  shortcut TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE phraseology;

-- =============================================
-- CHAT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default Tabulations
INSERT INTO tabulations (name, description, color) VALUES
('Venda Realizada', 'Cliente fechou a compra', '#22c55e'),
('Callback', 'Cliente solicitou retorno', '#3b82f6'),
('Sem Interesse', 'Cliente nao tem interesse', '#ef4444'),
('Numero Invalido', 'Numero nao existe ou incorreto', '#6b7280'),
('Caixa Postal', 'Caiu na caixa postal', '#f59e0b'),
('Ocupado', 'Linha ocupada', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Default Situations
INSERT INTO situations (name, description, color) VALUES
('Em Atendimento', 'Operador em ligacao', '#22c55e'),
('Pausado', 'Operador em pausa', '#f59e0b'),
('Disponivel', 'Operador disponivel', '#3b82f6'),
('Ausente', 'Operador ausente', '#ef4444'),
('Treinamento', 'Em treinamento', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Default Channels
INSERT INTO channels (name, description, icon) VALUES
('Telefone', 'Atendimento por telefone', 'phone'),
('WhatsApp', 'Atendimento por WhatsApp', 'message-circle'),
('Email', 'Atendimento por email', 'mail'),
('Chat', 'Atendimento por chat online', 'message-square')
ON CONFLICT DO NOTHING;

-- Default Result Codes
INSERT INTO result_codes (code, name, description, category, color) VALUES
('V01', 'Venda Aprovada', 'Venda realizada e aprovada', 'venda', '#22c55e'),
('V02', 'Venda Pendente', 'Venda aguardando aprovacao', 'venda', '#f59e0b'),
('C01', 'Callback Agendado', 'Retorno agendado com cliente', 'callback', '#3b82f6'),
('N01', 'Nao Atendeu', 'Cliente nao atendeu', 'negativo', '#6b7280'),
('N02', 'Recusou Oferta', 'Cliente recusou a oferta', 'negativo', '#ef4444')
ON CONFLICT DO NOTHING;

-- Default Initial Guide Steps
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
