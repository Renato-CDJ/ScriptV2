-- Seed default users
INSERT INTO users (username, full_name, role, permissions) VALUES
  ('admin', 'Administrador Sistema', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria1', 'Monitoria 1', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria2', 'Monitoria 2', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria3', 'Monitoria 3', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria4', 'Monitoria 4', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Seed default chat settings
INSERT INTO chat_settings (is_enabled) VALUES (true)
ON CONFLICT DO NOTHING;

-- Seed default channels
INSERT INTO channels (name, contact, is_active) VALUES
  ('Alô CAIXA', '4004 0 104 (Capitais e Regiões Metropolitanas) | 0800 104 0 104 (Demais regiões)', true),
  ('Atendimento CAIXA Cidadão', '0800 726 0207', true),
  ('Agência Digital', '4004 0 104 (Capitais) | 0800 104 0 104 (Demais regiões)', true),
  ('Atendimento para Pessoas Surdas', 'https://icom.app/8AG8Z | www.caixa.gov.br/libras', true),
  ('SAC CAIXA', '0800 726 0101', true),
  ('Ouvidoria CAIXA', '0800 725 7474', true),
  ('Canal de Denúncias', '0800 721 0738 | https://www.caixa.gov.br/denuncia', true)
ON CONFLICT DO NOTHING;
