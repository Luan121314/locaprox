# Plano de Desenvolvimento - LocaProX (MVP)

## 1. Objetivo do Plano
Estruturar a entrega do MVP do LocaProX com foco em:
- Funcionamento 100% offline
- Operação simples para locadoras de pequeno e medio porte
- Base tecnica pronta para evolucao futura (sync online, relatorios, iOS)

## 2. Escopo do MVP
### Inclui
- CRUD de clientes
- CRUD de equipamentos
- Criacao e listagem de locacoes
- Calculo automatico de valor total
- Persistencia local com SQLite

### Nao inclui (pos-MVP)
- Sincronizacao em nuvem
- Exportacao PDF
- Dashboard analitico
- Modo multi-dispositivo

## 3. Arquitetura e Padroes
- Stack: React Native CLI + TypeScript
- Navegacao: React Navigation
- Estado global: Zustand (preferencial) ou Context API
- Persistencia: SQLite local
- UI: NativeWind (preferencial) ou Styled Components
- Estrutura base:

```txt
/src
 ├── api
 ├── components
 ├── database
 │    ├── schema.sql
 │    ├── connection.ts
 │    └── services
 ├── screens
 ├── store
 ├── utils
 └── types
```

## 4. Roadmap por Fases

### Fase 0 - Fundacao Tecnica (Semana 1)
Entregaveis:
- Projeto React Native CLI configurado com TypeScript
- Lint/format padronizados
- Navegacao base (stack/tabs) com telas placeholder
- Tema global com paleta oficial:
  - Primaria `#0D2A3A`
  - Secundaria `#32E0C4`
- Banco SQLite inicial conectado

Criterios de aceite:
- App abre em Android sem erros
- Navegacao entre telas funcionando
- Teste de escrita e leitura simples no SQLite

### Fase 1 - Modelagem de Dados e Servicos (Semana 1-2)
Entregaveis:
- `schema.sql` com tabelas principais:
  - `clients`
  - `equipments`
  - `rentals`
  - `rental_items`
- Camada `database/services` com operacoes CRUD
- Regras de integridade basicas (chaves e validacoes)

Criterios de aceite:
- CRUD funcional via servicos para clientes e equipamentos
- Insercao e consulta de locacao com itens
- Sem perda de dados ao reiniciar app

### Fase 2 - CRUD de Clientes e Equipamentos (Semana 2-3)
Entregaveis:
- Telas de listagem, criacao, edicao e exclusao de clientes
- Telas de listagem, criacao, edicao e exclusao de equipamentos
- Busca simples por nome
- Feedback visual de sucesso/erro

Criterios de aceite:
- Operacoes CRUD completas sem travamentos
- Validacoes de campos obrigatorios funcionando
- Fluxo utilizavel sem internet

### Fase 3 - Fluxo de Locacao e Calculo (Semana 3-4)
Entregaveis:
- Tela para criar locacao com:
  - Selecionar cliente
  - Adicionar/remover equipamentos
  - Quantidade e valor unitario
  - Datas (inicio/fim)
- Calculo automatico de subtotal e total
- Lista de locacoes com status basico

Criterios de aceite:
- Total recalcula ao alterar quantidade/valor
- Locacao salva corretamente com seus itens
- Listagem exibe informacoes essenciais da locacao

### Fase 4 - Qualidade, Estabilidade e Release Android (Semana 4-5)
Entregaveis:
- Tratamento de erros principais (DB, validacao, navegacao)
- Ajustes de UX (loading, estados vazios, confirmacoes)
- Testes manuais orientados a fluxo real
- Build Android de distribuicao interna

Criterios de aceite:
- Fluxos centrais sem bug bloqueante
- Performance aceitavel em uso continuo
- APK/AAB gerado para validacao com usuarios internos

## 5. Backlog Priorizado (MVP)
1. Configuracao base do projeto e arquitetura
2. Banco SQLite + schema inicial
3. Servicos de dados (clientes/equipamentos/locacoes)
4. CRUD clientes
5. CRUD equipamentos
6. Criacao de locacao com calculo automatico
7. Listagem de locacoes
8. Ajustes de UX, validacao final e build

## 6. Definicao de Pronto (Definition of Done)
Uma entrega e considerada concluida quando:
- Requisitos funcionais da tarefa estao implementados
- Validacoes basicas foram aplicadas
- Nao ha erro critico no fluxo relacionado
- Codigo segue o padrao de estrutura definido no projeto
- Funciona em dispositivo Android de teste sem internet

## 7. Riscos e Mitigacoes
- Risco: complexidade no fluxo de locacao com multiplos itens.
  - Mitigacao: iniciar com modelo simples de itens e evoluir iterativamente.
- Risco: inconsistencias de dados locais.
  - Mitigacao: uso de transacoes e validacoes na camada de servicos.
- Risco: crescimento do escopo antes do release.
  - Mitigacao: bloquear MVP no escopo definido e mover extras para pos-MVP.
- Risco: baixa usabilidade em operacao de campo.
  - Mitigacao: testes manuais com cenarios reais de uso offline.

## 8. Plano Pos-MVP (Evolucao)
1. Sincronizacao online (Firebase, Supabase ou backend proprio)
2. Relatorios e historico de locacoes
3. Exportacao de orcamento/contrato em PDF
4. Dashboard com metricas operacionais
5. Publicacao iOS
