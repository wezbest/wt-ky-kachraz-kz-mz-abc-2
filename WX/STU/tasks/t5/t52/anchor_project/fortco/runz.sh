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
    # wallets=(
    #     "../../shit/wallet1.json"
    #     "../../shit/wallet2.json"
    #     "../../shit/wallet3.json"
    #     "../../shit/wallet4.json"
    #     "../../shit/wallet5.json"
    #     "../../shit/wallet6.json"
    # )
    
    wallets=(
        "wallets/w1.json"
        "wallets/treasury.json"
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
    co2="solana balance --keypair wallets/w1.json"
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
  local FROM_WALLET="wallets/treasury.json"
  local TO_WALLET="wallets/w1.json"
  local AMOUNT="1.5"
  
  solana transfer \
    --keypair "$FROM_WALLET" \
    --url https://api.devnet.solana.com \
    --fee-payer "$FROM_WALLET" \
    $(solana-keygen pubkey "$TO_WALLET") \
    "$AMOUNT" \
    --no-wait \
    --allow-unfunded-recipient
}

# Transfers with addresses 
sol_transfer_address() {
  # Hardcoded values - use keypair file paths
  local FROM_KEYPAIR="wallets/treasury.json"
  local TO_ADDRESS="63tb8Go8gngmCCFPBznMharUHr1mmE5hCQUh4xb8nrfK"
  local AMOUNT="2"
  
  # Validate keypair file exists
  if [[ ! -f "$FROM_KEYPAIR" ]]; then
    echo "❌ Error: Keypair file not found: $FROM_KEYPAIR"
    return 1
  fi
  
  # Get the public address from the keypair for display
  local FROM_ADDRESS=$(solana-keygen pubkey "$FROM_KEYPAIR")
  
  echo "🔄 Transferring $AMOUNT SOL from $FROM_ADDRESS to $TO_ADDRESS"
  echo "💰 Using keypair: $FROM_KEYPAIR"
  
  # Execute the transfer
  solana transfer \
    --keypair "$FROM_KEYPAIR" \
    --url https://api.devnet.solana.com \
    "$TO_ADDRESS" \
    "$AMOUNT" \
    --allow-unfunded-recipient
  
  # Check if the transfer was successful
  if [ $? -eq 0 ]; then
    echo "✅ Transfer completed successfully!"
  else
    echo "❌ Transfer failed"
    return 1
  fi
}

# Get the keypair 
get_id() {
    hea1 "Solana Get ID"
    co1="solana-keygen pubkey target/deploy/fortco-keypair.json"
    echo -e "${GREEN}$co1$NC"
    eval "$co1"
}

# --- Sequencer --- 
seq1() {
    bal_check
    get_id
    clean_1
    build_1
    dep_1
    anchor_test1 
    bal_check
}


# ---Execution zone--- 
# seq1
# bal_check
# sol_transfer
# bal_check
sol_transfer_address 
