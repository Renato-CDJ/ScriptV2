-- Criar usuário administrador inicial
-- IMPORTANTE: Altere o email e senha conforme necessário

INSERT INTO users (email, name, role, is_active)
VALUES ('admin@script.com', 'Administrador', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
