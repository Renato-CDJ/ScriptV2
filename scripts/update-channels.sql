-- ============================================================
-- ATUALIZAR CANAIS DE ATENDIMENTO CAIXA
-- 
-- Execute este script no SQL Editor do Supabase
-- para atualizar os canais com as informacoes corretas
-- ============================================================

-- Primeiro, limpar os canais existentes
DELETE FROM channels;

-- Inserir os canais atualizados com formato correto
INSERT INTO channels (name, description, icon, is_active) VALUES
(
  'Alô CAIXA:',
  'Pessoa Física, Jurídica ou Ente Público
Conta corrente, poupança e empréstimos comerciais
Cartão de Crédito
Habitação
Suporte nos sites, aplicativos e Caixa Eletrônico
Negociação de dívidas, penhor e contratos cedidos
Resultado de Loterias
De Olho na Qualidade (Minha Casa Minha Vida)',
  '☎ 4004 0 104 - Capitais e Regiões Metropolitanas
☎ 0800 104 0 104 - Demais regiões',
  true
),
(
  'Atendimento CAIXA Cidadão:',
  'Atendimento sobre PIS, Benefícios Sociais, FGTS e - Cartão Social
Atendimento eletrônico: 24h
Atendimento humano: seg a sex 8h às 21h, sábado 10h às 16h',
  '☎ 0800 726 0207',
  true
),
(
  'Agência Digital:',
  'Serviços e consultoria financeira personalizada
Atendimento: 8h às 18h (exceto finais de semana e feriados)',
  '☎ 4004 0 104 - Capitais e regiões metropolitanas
☎ 0800 104 0 104 - Demais regiões',
  true
),
(
  'Atendimento para Pessoas Surdas:',
  'Para esclarecer suas dúvidas sobre produtos e serviços, suporte tecnológico, informações, reclamações, sugestões e elogios.
O atendimento ocorre 24 horas por dia, 7 dias por semana.
Atendimento com Intérprete de Libras:
Acesse https://icom.app/8AG8Z e você será direcionado ao site da ICOM, parceiro da CAIXA. Para saber mais sobre o atendimento, acesse www.caixa.gov.br/libras.',
  'https://icom.app/8AG8Z',
  true
),
(
  'SAC CAIXA:',
  'Reclamações, sugestões, elogios, cancelamentos
Atendimento 24h, todos os dias',
  '☎ 0800 726 0101',
  true
),
(
  'Ouvidoria CAIXA:',
  'Reclamações não solucionadas
Atendimento: dias úteis, das 9h às 18h',
  '☎ 0800 725 7474',
  true
),
(
  'Canal de Denúncias:',
  'Fatos irregulares contra a CAIXA e empresas do conglomerado
Atendimento especializado 24h, todos os dias
Página de denúncia: https://www.caixa.gov.br/denuncia',
  '☎ 0800 721 0738',
  true
);

-- Verificar os canais inseridos
SELECT name, icon, description FROM channels ORDER BY created_at;
