#!/usr/bin/bash
# Commands for binary related

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

# Using cargo bloat to check for binary size 
cargobloat() {
    hea1 "Checking binary size with cargo bloat"
    
    co1="cargo bloat --release -n 10"
    co2="cargo bloat --release --crates"

    echo -e "${GREEN} Executing ${co1}"
    echo -e "[?] Biggest functions in binary ${NC}"
    eval "$co1"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    
    echo -e "${GREEN} Executing ${co2}"
    echo -e "[?] Biggest Crates ${NC}"
    eval "$co2"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"    
}

# Exeution
cargobloat