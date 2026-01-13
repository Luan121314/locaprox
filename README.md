📱 LocaProX
Sistema de Orçamentos para Locação de Equipamentos

<!-- coloque aqui um banner futuramente, se quiser -->

📌 Descrição

O LocaProX é um aplicativo mobile desenvolvido em React Native (sem Expo) com foco em empresas de locação de equipamentos.
Criado para ser flexível, rápido e fácil de usar, o app permite gerar orçamentos de modo totalmente offline, utilizando banco de dados local (SQLite) e uma interface moderna que prioriza eficiência e clareza.

Embora inicialmente voltado para locação de equipamentos de eventos (som, iluminação, painéis de LED), o app foi planejado para ser genérico o suficiente para abranger outros ramos como construção civil, máquinas industriais, ferramentas e muito mais.

🚀 Principais Funcionalidades (MVP)

🧑‍🤝‍🧑 Cadastro e gerenciamento de clientes

🎛 Cadastro de equipamentos

📝 Criação rápida de orçamentos

💾 Banco local SQLite (funciona 100% offline)

🎨 Interface moderna e intuitiva

📱 Suporte inicial para Android, com futura expansão para iOS

🧩 Tecnologias Utilizadas

React Native CLI

TypeScript

SQLite (offline-first)

React Navigation

Styled Components ou NativeWind (a depender da escolha final)

Arquitetura modular preparada para sincronização futura com backend

📦 Instalação e Execução

1. Clonar o repositório
   git clone https://github.com/seuusuario/locaprox.git
   cd locaprox

2. Instalar dependências
   yarn install

3. Executar no Android
   yarn android

4. (Opcional) Executar no iOS
   cd ios
   pod install
   cd ..
   yarn ios

⚠️ iOS só poderá ser compilado em macOS.

📁 Estrutura do Projeto (Sugestão)
src/
assets/
components/
screens/
navigation/
database/
services/
hooks/
utils/
App.tsx

🗺️ Roadmap
MVP

Cadastro de clientes

Cadastro de equipamentos

Criação de orçamentos

Banco local SQLite

Tema visual LocaProX

Geração de PDF (versão simples)

Tela de listagem e detalhes do orçamento

Versões Futuras

Sincronização com servidor remoto

Dashboard administrativo (web)

Multiusuário com permissões

Envio de orçamento via WhatsApp/Email direto pelo app

Controle de estoque

Templates personalizáveis de orçamento

Monetização via Play Store / App Store

🎨 Identidade Visual

Nome: LocaProX
Conceito: moderno, confiável, tecnológico
Paleta base: azul petróleo + turquesa neon + cinza neutro

A identidade visual será evoluída ao longo do desenvolvimento.

🛠️ Contribuindo

Sinta-se livre para abrir issues e PRs.
Sugestões de melhoria são sempre bem-vindas!

📄 Licença

Este projeto está sob a licença MIT — consulte o arquivo LICENSE para mais detalhes.
