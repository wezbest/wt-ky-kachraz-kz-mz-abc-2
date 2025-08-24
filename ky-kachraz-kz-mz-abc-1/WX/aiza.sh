#!/usr/bin/bash
# Installaz Aiza 
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

# Gemin Cli install
gc_c() {
    hea1 "Gemin CLI Installation"
    co1="bun install -g @google/gemini-cli"
    echo -e "${GREEN}Executing: $co1${NC}"
    eval "$co1"
}

# ////////////////////////////////////// Rovo Section //////////////////////////////////////

# Rovo Installaz
# https://developer.atlassian.com/cloud/acli/guides/install-linux/

rov_i() {
    hea1 "Installing Rovo CLI"
    sudo apt-get install -y wget gnupg2
    sudo mkdir -p -m 755 /etc/apt/keyrings
    wget -nv -O- https://acli.atlassian.com/gpg/public-key.asc | sudo gpg --dearmor -o /etc/apt/keyrings/acli-archive-keyring.gpg
    sudo chmod go+r /etc/apt/keyrings/acli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/acli-archive-keyring.gpg] https://acli.atlassian.com/linux/deb stable main" | sudo tee /etc/apt/sources.list.d/acli.list >/dev/null
    sudo apt update
    sudo apt install -y acli
}

rov_auth() {
    hea1 "Authenticaing RovoCli"
    co1="acli --help"
    co2="acli rovodev auth login"
    echo -e "--- Executing ${co1} ---"
    eval "${co1}"
    echo -e "--- Executing ${co2} ---"
    eval "${co2}"
}

# ////////////////////////////////////// Opencode.ai //////////////////////////////////////

opencode_i() {
    hea1 "Installing Opencode.ai CLI"
    co1="curl -fsSL https://opencode.ai/install | bash"
    echo -e "${GREEN}Executing: $co1${NC}"
    eval "$co1"
}


# ////////////////////////////////////// UV Section //////////////////////////////////////

# UV Setup

uv_gr() {
    hea1 "UV Installation with gradio"

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

    DEPS="rich gradio[mcp] smolagents[toolkit] dotenv groq"
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

# Function remove all directories with .vent
rm_venv_find() {
    hea1 "Removing all directories with .venv"
    co1="find . -type d -name '.venv' -exec rm -rf {} +"
    echo -e "--- Executing ${co1} ---"
    eval "${co1}"
}

# Esxecution
gc_c
# rov_i
# opencode_i