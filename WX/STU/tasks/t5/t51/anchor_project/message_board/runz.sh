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
    co2="solana balance --keypair wallets/wallet2.json"
    echo -e "${BLUE}Checking Wallet Ballence for $ACC"
    eval "$co2"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# Checking balance
bal_check() {
    hea1 "Solana Balance Check"
    co1="solana balance --keypair wallets/wallet2.json"
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

# getting the new id
WALLET_DIR="wallets/wallet2.json"
get_id() {
    hea1 "Solana Get ID"
    co1="solana-keygen pubkey $WALLET_DIR"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}


# --- Transferring sol --- 

SOL_FROM_KEYPAIR="wallets/wallet1.json"
SOL_TO_ADDRESS="wallets/walletaddress.txt"
SOL_AMOUNT_SOL="1.5"
SOL_CLUSTER="--devnet" 

sol_transfer() {
  local from_keypair="$SOL_FROM_KEYPAIR"
  local to_address="$SOL_TO_ADDRESS"
  local amount_sol="$SOL_AMOUNT_SOL"
  local cluster="${SOL_CLUSTER:---devnet}"
  local url="https://api.devnet.solana.com"

  # Validate inputs
  if [ -z "$from_keypair" ] || [ -z "$to_address" ] || [ -z "$amount_sol" ]; then
    echo "Error: Missing required variables. Please set:"
    echo "  SOL_FROM_KEYPAIR = path to sender's keypair file"
    echo "  SOL_TO_ADDRESS   = recipient's wallet address"
    echo "  SOL_AMOUNT_SOL   = amount of SOL to send"
    echo "  SOL_CLUSTER      = network (optional, default: --devnet)"
    return 1
  fi

  # Check if keypair file exists
  if [ ! -f "$from_keypair" ]; then
    echo "Error: Keypair file not found: $from_keypair"
    return 1
  fi

  # Execute transfer
  solana transfer \
    --keypair "$from_keypair" \
    "$to_address" \
    "$amount_sol" \
    --url "$url" \
    --fee-payer "$from_keypair" \
    --no-wait
}

# ---Execution zone--- 
bal_check
sol_transfer
# clean_1
# build_1