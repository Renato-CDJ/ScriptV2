-- ============================================================
-- CRIAR USUARIO OPERADOR
-- ============================================================

-- Primeiro verificar usuarios existentes
SELECT id, username, name, email, role, password, is_active FROM users;

-- Criar usuario operador se nao existir
INSERT INTO users (username, name, email, password, role, is_active, is_online)
VALUES ('operador', 'Operador', 'login@gruporoveri.com', '123', 'operator', true, false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  is_active = true;

-- Verificar se foi criado
SELECT id, username, name, email, role, password, is_active FROM users WHERE email = 'login@gruporoveri.com';
