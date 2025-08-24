#!/usr/bin/bash
# This bash srcript is for installing the KL docker image here
clear

# Colors
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[0;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[0;37m'
export NC='\033[0m' # No Color

# Commands

hea1() {
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
}

# UV Install
uvsetup() {
    hea1 "UV Installation with packages"

    # Get Name of project
    echo -e "Enter the name of the project: "
    read name_of_project
    if [ -z "$name_of_project" ]; then
        echo -e "${RED}BASTARD ! Project name cannot be empty${NC}"
        exit 1
    fi

    # UC Commands
    CO1="uv init $name_of_project"
    CO2="cd $name_of_project"

    DEPS="rich langgraph langgraph-sdk langgraph-checkpoint-sqlite langsmith langchain-community langchain-core langchain-openai notebook tavily-python wikipedia trustcall langgraph-cli"
    CO3="uv add  $DEPS"
    CO4="uv tree"

    ## RUN Above Commands
    echo -e "--- Executing ${CO1} ---"
    eval "$CO1"
    echo -e "--- Executing ${CO2} ---"
    eval "$CO2"
    echo -e "--- Executing ${CO3} ---"
    eval "$CO3"
    echo -e "--- Executing ${CO4} ---"
    eval "$CO4"
    echo -e "${GREEN}***** Installation Completed *****${NC}"
}

# Solana Install 
# Source -  https://solana.com/docs/intro/installation
solna_inst(){
    hea1 "Solna and Ancho Installation"
    co1="curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash"
    co2="sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev llvm libclang-dev \
    protobuf-compiler libssl-dev"
    co3="sh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\""
    co4="cargo install --git https://github.com/coral-xyz/anchor avm --force"
    echo -e "--- Executing ${co1} ---"
    eval "$co1"
    echo -e "--- Executing ${co2} ---"
    eval "$co2"
    echo -e "--- Executing ${co3} ---"
    eval "$co3"
    echo -e "--- Executing ${co4} ---"
    eval "$co4"
    echo -e "${GREEN}***** Solna and Ancho Installation Completed *****${NC}"
}

# Muchio CLI Install 
# Source -https://github.com/solana-foundation/mucho
mucho_cli() {
    hea1 "Mucho Cli Install - Solana Utils"
    co1="bun install -gy mucho@latest"
    co2="bunx mucho@latest self-update"
    echo -e "--- Executing ${co1} ---"
    eval "$co1"
    echo -e "--- Executing ${co2} ---"
    eval "$co2"
    echo -e "${GREEN}***** Mucho CLI Installation Completed *****${NC}"
}

# Execute 
# solna_inst
mucho_cli