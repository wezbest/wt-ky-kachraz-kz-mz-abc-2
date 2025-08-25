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

build_1() {
    hea1 "Anchor test"
    co1="anchor build"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# Checking balance
bal_check() {
    hea1 "Solana Balance Check"
    
    # Array of wallet file paths
    wallets=(
        "../../shit/wallets/wallet1.json"
        "../../shit/wallets/wallet2.json"
        "../../shit/wallets/wallet3.json"
        "../../shit/wallets/wallet4.json"
        "../../shit/wallets/wallet5.json"
        "../../shit/wallets/wallet6.json"
    )
    
    # Loop through each wallet and check balance
    for wallet in "${wallets[@]}"; do
        echo -e "${YELLOW}Checking balance for: $wallet$NC"
        co1="solana balance -k $wallet --url https://api.devnet.solana.com"
        echo -e "${GREEN}$co1$NC"
        eval "$co1"
        echo "" # Add empty line for readability
    done
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

# getting the new id
WALLET_DIR="wallets/wallet4.json"
get_id() {
    hea1 "Solana Get ID"
    co1="solana-keygen pubkey $WALLET_DIR"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# --- Anchor Test ---
anchor_test1() {
    hea1 "Anchor Test"
    co1="anchor test"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}


# --- Transferring sol --- 
sol_transfer() {
  local FROM_WALLET="wallets/wallet2.json"
  local TO_WALLET="wallets/wallet3.json"
  
  solana transfer \
    --keypair "$FROM_WALLET" \
    --url https://api.devnet.solana.com \
    --fee-payer "$FROM_WALLET" \
    $(solana-keygen pubkey "$TO_WALLET") \
    "$1" \
    --no-wait \
    --allow-unfunded-recipient
}

# --- Sequencer --- 
seq1() {
    bal_check
    anchor_test1 
    bal_check
}


# ---Execution zone--- 
# seq1
bal_check
