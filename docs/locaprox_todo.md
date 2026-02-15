# Resumo do Projeto LocaProX — Decisões e Identidade Visual

## 📌 Nome do App
**LocaProX**  
Nome escolhido por ser profissional, curto e adequado ao mercado de locações. Não possui conflitos diretos detectados nas lojas Android ou iOS.

---

## 🎯 Objetivo do App
Criar um aplicativo para:
- Cadastro de clientes  
- Cadastro de equipamentos  
- Criação e gerenciamento de locações  
- Cálculo automático de valores  
- Funcionamento totalmente offline com SQLite  

Voltado para:
- Empresas de eventos  
- Empresas de locação de equipamentos  
- Locação de máquinas de construção  
- Pequenas e médias locadoras  

Sua empresa será apenas uma cliente, sem vínculo visual direto no branding do app.

---

## 📱 Plataforma e Tecnologia
- **Primeiro lançamento:** Android  
- **Possível expansão futura:** iOS  
- **Framework:** React Native **CLI** (sem Expo)  
- **Linguagem:** TypeScript  
- **Navegação:** React Navigation  
- **Estado:** Zustand ou Context API  
- **Banco de dados:** SQLite local  
- **UI:** NativeWind (Tailwind) ou Styled Components  

---

## 🗂 Arquitetura do App
```
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

---

## 🧠 Decisões Sobre Banco de Dados
- O app deve funcionar sem internet  
- Armazenamento local: **SQLite**  
- No futuro: sincronização com banco remoto (Firebase, Supabase ou backend próprio)  
- Garantia de performance, estabilidade e confiabilidade  

---

## 💻 Funcionalidades MVP
- CRUD de clientes  
- CRUD de equipamentos  
- Criação de locações  
- Cálculo automático do total  
- Armazenamento local  
- Listagem de locações  

---

## 🎨 Identidade Visual / Cores Oficiais

### **1. Cor Primária — Azul Escuro**
```
#0D2A3A
```
Transmite segurança, confiabilidade e profissionalismo.

### **2. Cor Secundária — Turquesa/Verde-Água**
```
#32E0C4
```
Usada no símbolo do app. Moderna, tecnológica e com ótimo contraste.

### **3. Gradiente Utilizado no Ícone**
- Base clara: `#32E0C4`
- Tom mais profundo (aproximado): `#22BFA5`

Essas cores foram utilizadas no:
- Ícone do app  
- Splash Screen  
- Diretrizes iniciais da UI  

---

## 📦 Arquivos Criados no Projeto
- **Splash Screen**  
- **Ícone do App** (tamanhos padrões)  
- **README do projeto**  
- **Descrição curta (350 caracteres)**  
- **TODO em Markdown para IA**  
- **Plano de desenvolvimento MVP (Markdown)**  

---

## 🚀 Próximos Passos Possíveis
- Sistema de sincronização online  
- Dashboard e métricas  
- Sistema de orçamentos exportáveis em PDF  
- Histórico e relatórios  
- Modo multi-dispositivo  
- Catálogo inteligente com sugestões automáticas  

---

## ✔ Status Atual  
Todas as decisões essenciais do MVP estão definidas:  
✔ Nome  
✔ Identidade visual  
✔ Paleta  
✔ Arquitetura  
✔ Banco de dados  
✔ Tecnologias  
✔ Etapas do MVP  
✔ Documentos base  

Pronto para iniciar o desenvolvimento.

