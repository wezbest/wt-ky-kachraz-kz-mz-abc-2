#!/usr/bin/env bash
# Commands for running

# === Config ===
WALLET_DIR="wallets"   # <-- all wallets stored here
WALLETS=("wallet2.json")  # <-- list of wallets you want to manage

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# Header function
hea1() {
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
}

# Running the tests 
run_test() {
    hea1 "Anchor test"
    co1="anchor test"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# Running anchor clean for a proper build
clean_1() {
    hea1 "Anchor test"
    co1="anchor clean"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}


#  Building the program - This will give the new program id which has to be replaced in the Anchor TOml

ACC="WeztmSyZuM2swz22r4sQZmpRfnVdfxTCsMVTt5eoygJ"

build_1() {
    hea1 "Anchor test"
    co1="anchor build"
    co1="solana balance --keypair wallets/wallet2.json --devnet"
    echo -e "${BLUE}Checking Wallet Ballence for $ACC"
    eval "co2"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# DEploying to get the program id 
dep_1() {
    hea1 "Anchor Check Balance and Deploy"
    co1="anchor deploy"
    co2="solana balance --keypair wallets/wallet2.json"
    echo -e "${BLUE}Checking Wallet Ballence for $ACC"
    eval "$co2"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# ---Execution zone--- 

# Running the tests 
# run_test

# clean and build program
clean_1
build_1

# Deploy script 
dep_1