#!/bin/bash

###############################################################################
# Script de Configuração do Ambiente - LocaProx
# Este script configura o ambiente de desenvolvimento com as versões necessárias
###############################################################################

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Versões necessárias
NODE_VERSION="20"
# RUBY_VERSION="2.6.10"
JAVA_VERSION="17"
ANDROID_BUILD_TOOLS="36.0.0"
ANDROID_COMPILE_SDK="36"
ANDROID_NDK_VERSION="27.1.12297006"
COCOAPODS_VERSION="1.13"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Configuração do Ambiente - LocaProx                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Função para imprimir mensagens
print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    print_step "Sistema operacional detectado: $OS"
}

# Verificar e instalar Node.js
check_node() {
    print_step "Verificando Node.js..."
    
    if command_exists node; then
        CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $(node -v) já instalado (versão mínima: v${NODE_VERSION})"
            return 0
        else
            print_warning "Node.js $(node -v) instalado, mas é necessário v${NODE_VERSION} ou superior"
        fi
    fi
    
    print_warning "Node.js v${NODE_VERSION}+ não encontrado"
    
    if command_exists nvm; then
        print_step "Instalando Node.js v${NODE_VERSION} usando NVM..."
        nvm install ${NODE_VERSION}
        nvm use ${NODE_VERSION}
        nvm alias default ${NODE_VERSION}
        print_success "Node.js v${NODE_VERSION} instalado via NVM"
    else
        print_error "NVM não encontrado. Por favor, instale o NVM primeiro:"
        echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "Depois execute este script novamente."
        return 1
    fi
}

# Verificar e instalar Yarn (opcional)
check_yarn() {
    print_step "Verificando Yarn..."
    
    if command_exists yarn; then
        print_success "Yarn $(yarn -v) já instalado"
    else
        print_step "Instalando Yarn..."
        npm install -g yarn
        print_success "Yarn instalado"
    fi
}

# Verificar Ruby
# check_ruby() {
#     print_step "Verificando Ruby..."
#     
#     if command_exists ruby; then
#         CURRENT_RUBY_VERSION=$(ruby -v | grep -oP '\d+\.\d+\.\d+' | head -1)
#         print_success "Ruby ${CURRENT_RUBY_VERSION} instalado (versão mínima: ${RUBY_VERSION})"
#     else
#         print_warning "Ruby não encontrado. É necessário Ruby >= ${RUBY_VERSION}"
#         print_warning "Instale via rbenv ou rvm:"
#         echo "  rbenv: https://github.com/rbenv/rbenv"
#         echo "  rvm: https://rvm.io/"
#     fi
# }

# Verificar Java/JDK
check_java() {
    print_step "Verificando Java JDK..."
    
    if command_exists java; then
        JAVA_VER=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [ "$JAVA_VER" -ge "$JAVA_VERSION" ]; then
            print_success "Java JDK ${JAVA_VER} instalado (versão mínima: ${JAVA_VERSION})"
        else
            print_warning "Java ${JAVA_VER} instalado, mas é necessário JDK ${JAVA_VERSION}"
            
            # Verificar se Java 17 está disponível no sistema
            if [ "$OS" = "linux" ]; then
                if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
                    print_warning "Java 17 encontrado em /usr/lib/jvm/java-17-openjdk-amd64"
                    echo "  Configure JAVA_HOME no seu shell:"
                    echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
                    echo "  export PATH=\$JAVA_HOME/bin:\$PATH"
                    echo ""
                    echo "  Ou use update-alternatives:"
                    echo "  sudo update-alternatives --config java"
                fi
            fi
        fi
    else
        print_error "Java JDK não encontrado. Instale o OpenJDK ${JAVA_VERSION}"
        if [ "$OS" = "linux" ]; then
            echo "  sudo apt-get install openjdk-${JAVA_VERSION}-jdk  # Ubuntu/Debian"
        elif [ "$OS" = "macos" ]; then
            echo "  brew install openjdk@${JAVA_VERSION}"
        fi
    fi
}

# Verificar Android SDK
check_android_sdk() {
    print_step "Verificando Android SDK..."
    
    if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
        print_success "Android SDK configurado: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
        
        # Verificar se sdkmanager existe
        if command_exists sdkmanager; then
            print_step "Android SDK Manager encontrado"
        else
            print_warning "sdkmanager não encontrado no PATH"
        fi
        
        # Verificar emuladores disponíveis
        if command_exists emulator; then
            AVDS=$(emulator -list-avds 2>/dev/null)
            if [ -n "$AVDS" ]; then
                print_success "Emuladores Android encontrados:"
                echo "$AVDS" | while read -r avd; do
                    echo "    - $avd"
                done
            else
                print_warning "Nenhum emulador Android configurado"
                echo "  Crie um emulador usando Android Studio ou:"
                echo "  avdmanager create avd -n MyEmulator -k 'system-images;android-34;google_apis;x86_64'"
            fi
        else
            print_warning "Comando 'emulator' não encontrado no PATH"
        fi
    else
        print_error "ANDROID_HOME ou ANDROID_SDK_ROOT não configurado"
        print_warning "Configure as variáveis de ambiente no ~/.bashrc ou ~/.zshrc:"
        echo ""
        echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
        echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
        echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        echo "  export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin"
    fi
}

# Verificar CocoaPods (para iOS no macOS)
check_cocoapods() {
    if [ "$OS" = "macos" ]; then
        print_step "Verificando CocoaPods..."
        
        if command_exists pod; then
            POD_VERSION=$(pod --version)
            print_success "CocoaPods ${POD_VERSION} instalado"
        else
            print_warning "CocoaPods não encontrado"
            print_step "Instalando CocoaPods..."
            sudo gem install cocoapods -v ">= ${COCOAPODS_VERSION}"
            print_success "CocoaPods instalado"
        fi
    fi
}

# Verificar Watchman
# check_watchman() {
#     print_step "Verificando Watchman..."
#     
#     if command_exists watchman; then
#         print_success "Watchman $(watchman -v) instalado"
#     else
#         print_warning "Watchman não encontrado (recomendado para React Native)"
#         if [ "$OS" = "macos" ]; then
#             echo "  brew install watchman"
#         elif [ "$OS" = "linux" ]; then
#             echo "  Siga as instruções em: https://facebook.github.io/watchman/docs/install.html"
#         fi
#     fi
# }

# Instalar dependências do projeto
install_dependencies() {
    print_step "Instalando dependências do projeto..."
    
    if [ -f "package.json" ]; then
        if command_exists yarn; then
            print_step "Executando: yarn install"
            yarn install
        else
            print_step "Executando: npm install"
            npm install
        fi
        print_success "Dependências JavaScript instaladas"
    fi
    
    # iOS pods (somente macOS)
    if [ "$OS" = "macos" ] && [ -f "ios/Podfile" ]; then
        print_step "Instalando CocoaPods para iOS..."
        cd ios
        # bundle install
        pod install
        cd ..
        print_success "CocoaPods instalados"
    fi
}

# Verificar configurações do Android
check_android_config() {
    print_step "Verificando configurações do Android..."
    
    if [ -f "android/local.properties" ]; then
        print_success "android/local.properties encontrado"
    else
        print_warning "android/local.properties não encontrado"
        
        if [ -n "$ANDROID_HOME" ]; then
            print_step "Criando android/local.properties..."
            echo "sdk.dir=${ANDROID_HOME}" > android/local.properties
            print_success "android/local.properties criado"
        fi
    fi
}

# Exibir resumo das versões necessárias
show_requirements() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Versões Necessárias                                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  Node.js:                >= ${NODE_VERSION}"
    # echo "  React Native:           0.83.1"
    # echo "  React:                  19.2.0"
    # echo "  TypeScript:             5.8.3"
    echo "  Java JDK:               >= ${JAVA_VERSION}"
    # echo "  Ruby:                   >= ${RUBY_VERSION}"
    echo "  Android Build Tools:    ${ANDROID_BUILD_TOOLS}"
    echo "  Android Compile SDK:    ${ANDROID_COMPILE_SDK}"
    echo "  Android Target SDK:     ${ANDROID_COMPILE_SDK}"
    echo "  Android NDK:            ${ANDROID_NDK_VERSION}"
    echo "  Kotlin:                 2.1.20"
    if [ "$OS" = "macos" ]; then
        echo "  CocoaPods:              >= ${COCOAPODS_VERSION}"
        echo "  iOS Deployment:         >= 13.4"
    fi
    echo ""
}

# Exibir comandos úteis
show_useful_commands() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Comandos Úteis                                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  Iniciar Metro Bundler:"
    echo "    npm start"
    echo ""
    echo "  Executar no Android:"
    echo "    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 npm run android"
    echo ""
    echo "  Ou configure Java 17 permanentemente no ~/.bashrc:"
    echo "    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
    echo "    export PATH=\$JAVA_HOME/bin:\$PATH"
    echo ""
    echo "  Listar emuladores Android:"
    echo "    emulator -list-avds"
    echo ""
    echo "  Iniciar emulador específico:"
    echo "    emulator -avd <nome_do_emulador> &"
    echo ""
    if [ "$OS" = "macos" ]; then
        echo "  Executar no iOS:"
        echo "    npm run ios"
        echo ""
    fi
    echo "  Executar testes:"
    echo "    npm test"
    echo ""
    echo "  Limpar cache:"
    echo "    npm start -- --reset-cache"
    echo "    cd android && ./gradlew clean && cd .."
    if [ "$OS" = "macos" ]; then
        echo "    cd ios && rm -rf Pods Podfile.lock && pod install && cd .."
    fi
    echo ""
}

# Configurar Java 17 permanentemente
configure_java17() {
    if [ "$OS" = "linux" ]; then
        CURRENT_JAVA_VER=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
        
        if [ "$CURRENT_JAVA_VER" -lt "17" ] && [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
            echo ""
            echo -e "${YELLOW}Java 17 está instalado mas não é a versão padrão.${NC}"
            echo -e "${YELLOW}Deseja configurar Java 17 como padrão? (s/n)${NC}"
            read -r response
            
            if [[ "$response" =~ ^[Ss]$ ]]; then
                print_step "Configurando Java 17 como padrão..."
                
                # Adicionar ao .bashrc se não existir
                if ! grep -q "JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" ~/.bashrc; then
                    echo "" >> ~/.bashrc
                    echo "# Java 17 para React Native" >> ~/.bashrc
                    echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
                    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
                    print_success "Java 17 configurado no ~/.bashrc"
                    echo ""
                    print_warning "Execute: source ~/.bashrc"
                    print_warning "Ou abra um novo terminal para aplicar as mudanças"
                else
                    print_success "Java 17 já está configurado no ~/.bashrc"
                fi
                
                # Configurar para a sessão atual
                export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
                export PATH=$JAVA_HOME/bin:$PATH
                print_success "Java 17 configurado para esta sessão"
            fi
        fi
    fi
}

# Função principal
main() {
    detect_os
    show_requirements
    
    echo -e "${BLUE}Iniciando verificação do ambiente...${NC}"
    echo ""
    
    check_node || exit 1
    check_yarn
    # check_ruby
    check_java
    check_android_sdk
    check_cocoapods
    # check_watchman
    
    # Configurar Java 17 se necessário
    configure_java17
    
    echo ""
    echo -e "${YELLOW}Deseja instalar as dependências do projeto agora? (s/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Ss]$ ]]; then
        install_dependencies
        check_android_config
    fi
    
    show_useful_commands
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Configuração concluída!                                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_success "Ambiente verificado e configurado!"
    echo ""
}

# Executar script
main
