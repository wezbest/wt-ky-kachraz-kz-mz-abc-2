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
    co1="solana balance -k wallets/wallet2.json --url https://api.devnet.solana.com"
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
SOL_TO_ADDRESS="WeztmSyZuM2swz22r4sQZmpRfnVdfxTCsMVTt5eoygJ"
SOL_AMOUNT_SOL="1.5"
SOL_CLUSTER="--devnet"
SOL_RPC_URL="https://api.devnet.solana.com"

sol_transfer() {
  # Read variables (expected to be set externally)
  local FROM_KEYPAIR="${SOL_FROM_KEYPAIR}"
  local TO_ADDRESS="${SOL_TO_ADDRESS}"
  local AMOUNT_SOL="${SOL_AMOUNT_SOL}"
  local CLUSTER="${SOL_CLUSTER:-https://api.devnet.solana.com}"
  local RPC_URL="${SOL_RPC_URL:-https://api.devnet.solana.com}"

  # Validate required inputs
  if [[ -z "$FROM_KEYPAIR" || -z "$TO_ADDRESS" || -z "$AMOUNT_SOL" ]]; then
    echo "Error: Missing required environment variables." >&2
    echo "Please set:" >&2
    echo "  SOL_FROM_KEYPAIR = path to sender's keypair file" >&2
    echo "  SOL_TO_ADDRESS   = recipient's wallet address (base58)" >&2
    echo "  SOL_AMOUNT_SOL   = amount of SOL to send (e.g. 0.1)" >&2
    echo "Optional:" >&2
    echo "  SOL_CLUSTER      = cluster (e.g. --devnet, --testnet)" >&2
    echo "  SOL_RPC_URL      = custom RPC URL (default: $RPC_URL)" >&2
    return 1
  fi

  # Validate keypair file exists
  if [[ ! -f "$FROM_KEYPAIR" ]]; then
    echo "Error: Keypair file not found: $FROM_KEYPAIR" >&2
    return 1
  fi

  # Validate amount is a number
  if ! [[ "$AMOUNT_SOL" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    echo "Error: Invalid amount: $AMOUNT_SOL (must be a number)" >&2
    return 1
  fi

  # Execute transfer
  solana transfer \
    --keypair "$FROM_KEYPAIR" \
    --url "$RPC_URL" \
    --fee-payer "$FROM_KEYPAIR" \
    "$TO_ADDRESS" \
    "$AMOUNT_SOL" \
    --no-wait \
    --allow-unfunded-recipient
}

# ---Execution zone--- 
bal_check
# sol_transfer
# clean_1
# build_1