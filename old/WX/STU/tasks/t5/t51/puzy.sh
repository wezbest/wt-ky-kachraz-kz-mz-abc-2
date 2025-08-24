#!/usr/bin/env bash
# Generate 10 Solana wallets, check balances, and airdrop SOL

# === Config ===
WALLET_DIR="shit"   # <-- change this if you want a different folder

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

# Function 1: Create wallets
create_wallets() {
    hea1 "Creating 10 Solana Wallets"
    mkdir -p "$WALLET_DIR"

    for i in {1..10}; do
        wallet_file="$WALLET_DIR/wallet$i.json"

        if [ -f "$wallet_file" ]; then
            echo -e "${YELLOW}Wallet $i already exists, skipping generation.${NC}"
        else
            echo -e "${GREEN}Generating wallet $i...${NC}"
            solana-keygen new --no-bip39-passphrase --outfile "$wallet_file" --force > /dev/null 2>&1
        fi
    done
}

# Function 2: Check balances
check_balances() {
    hea1 "Checking Wallet Balances"

    for i in {1..10}; do
        wallet_file="$WALLET_DIR/wallet$i.json"

        if [ ! -f "$wallet_file" ]; then
            echo -e "${RED}Wallet $i not found. Skipping.${NC}"
            continue
        fi

        pubkey=$(solana-keygen pubkey "$wallet_file")
        balance=$(solana balance -k "$wallet_file" 2>/dev/null)

        echo -e "${BLUE}Wallet $i:${NC} ${WHITE}$pubkey${NC}"
        echo -e "   ${GREEN}Balance:${NC} ${YELLOW}$balance${NC}"
    done
}

# Function 3: Airdrop SOL to wallets
airdrop_wallets() {
    hea1 "Airdropping SOL to Wallets"

    for i in {1..10}; do
        wallet_file="$WALLET_DIR/wallet$i.json"

        if [ ! -f "$wallet_file" ]; then
            echo -e "${RED}Wallet $i not found. Skipping.${NC}"
            continue
        fi

        pubkey=$(solana-keygen pubkey "$wallet_file")

        echo -e "${GREEN}Requesting 2 SOL airdrop for Wallet $i:${NC} ${WHITE}$pubkey${NC}"
        solana airdrop 2 "$pubkey" --url https://api.devnet.solana.com > /dev/null 2>&1

        # Show new balance
        balance=$(solana balance -k "$wallet_file" --url https://api.devnet.solana.com 2>/dev/null)
        echo -e "   ${GREEN}New Balance:${NC} ${YELLOW}$balance${NC}"
    done
}

# Main
# create_wallets
airdrop_wallets
check_balances
hea1 "Done ✅"
