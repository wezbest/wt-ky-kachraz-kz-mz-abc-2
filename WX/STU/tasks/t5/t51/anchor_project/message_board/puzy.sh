#!/usr/bin/env bash
# Manage Solana wallets: create, check balances, airdrop SOL

# === Config ===
WALLET_DIR="wallets"   # <-- all wallets stored here
WALLETS=("w1.json" "treasury.json")  # <-- list of wallets you want to manage

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

# Create wallets if they don't exist
create_wallets() {
    hea1 "Creating Wallets"
    mkdir -p "$WALLET_DIR"

    for w in "${WALLETS[@]}"; do
        wallet_file="$WALLET_DIR/$w"
        if [ -f "$wallet_file" ]; then
            echo -e "${YELLOW}$w already exists, skipping.${NC}"
        else
            echo -e "${GREEN}Generating $w...${NC}"
            solana-keygen new --no-bip39-passphrase --outfile "$wallet_file" --force > /dev/null 2>&1
        fi
    done
}

# Check balances
check_balances() {
    hea1 "Checking Wallet Balances"
    for w in "${WALLETS[@]}"; do
        wallet_file="$WALLET_DIR/$w"
        if [ ! -f "$wallet_file" ]; then
            echo -e "${RED}$w not found. Skipping.${NC}"
            continue
        fi
        pubkey=$(solana-keygen pubkey "$wallet_file")
        balance=$(solana balance -k "$wallet_file" --url https://api.devnet.solana.com 2>/dev/null)
        echo -e "${BLUE}$w:${NC} ${WHITE}$pubkey${NC}"
        echo -e "   ${GREEN}Balance:${NC} ${YELLOW}$balance${NC}"
    done
}

# Airdrop SOL
airdrop_wallets() {
    hea1 "Airdropping SOL to Wallets"
    for w in "${WALLETS[@]}"; do
        wallet_file="$WALLET_DIR/$w"
        if [ ! -f "$wallet_file" ]; then
            echo -e "${RED}$w not found. Skipping.${NC}"
            continue
        fi
        pubkey=$(solana-keygen pubkey "$wallet_file")
        echo -e "${GREEN}Requesting 2 SOL airdrop for $w:${NC} ${WHITE}$pubkey${NC}"
        solana airdrop 2 "$pubkey" --url https://api.devnet.solana.com > /dev/null 2>&1
        balance=$(solana balance -k "$wallet_file" --url https://api.devnet.solana.com 2>/dev/null)
        echo -e "   ${GREEN}New Balance:${NC} ${YELLOW}$balance${NC}"
    done
}

# Getting the pub key of wallet 

# === Main ===
create_wallets
airdrop_wallets
check_balances
hea1 "Done ✅"
