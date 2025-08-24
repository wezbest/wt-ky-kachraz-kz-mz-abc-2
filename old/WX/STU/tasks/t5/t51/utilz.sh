#!/usr/bin/env bash
# Manage Solana wallets: check balances and transfer SOL

# === Config ===
WALLET1="F9MkQktifqRcb9cF6S6e3nVTHBHXfdGvaepHGwG9rR2g"
TREZ="WeztmSyZuM2swz22r4sQZmpRfnVdfxTCsMVTt5eoygJ"

WALLET1_FILE="anchor_project/message_board/wallets/wallet1.json"    # keypair file for wallet1
TREZ_FILE="anchor_project/message_board/walletswallets/treasury.json"      # keypair file for treasury

AMOUNT="0.5"   # Default transfer amount (SOL)

# === Colors ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# === Helpers ===
hea1() {
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
}

check_balance() {
    local pubkey=$1
    local label=$2
    balance=$(solana balance "$pubkey" --url https://api.devnet.solana.com 2>/dev/null)
    echo -e "${BLUE}${label}:${NC} ${WHITE}$pubkey${NC}"
    echo -e "   ${GREEN}Balance:${NC} ${YELLOW}${balance:-N/A}${NC}"
}

# === Functions ===

send_to_trez() {
    hea1 "Transferring from WALLET1 → TREZ"
    check_balance "$WALLET1" "WALLET1 (before)"
    check_balance "$TREZ" "TREZ (before)"

    echo -e "${GREEN}Sending $AMOUNT SOL from WALLET1 → TREZ${NC}"
    solana transfer "$TREZ" "$AMOUNT" \
        --from "$WALLET1_FILE" \
        --url https://api.devnet.solana.com \
        --allow-unfunded-recipient --fee-payer "$WALLET1_FILE"

    check_balance "$WALLET1" "WALLET1 (after)"
    check_balance "$TREZ" "TREZ (after)"
    echo -e "${CYAN}✅ Transfer complete!${NC}"
}

send_to_wallet1() {
    hea1 "Transferring from TREZ → WALLET1"
    check_balance "$TREZ" "TREZ (before)"
    check_balance "$WALLET1" "WALLET1 (before)"

    echo -e "${GREEN}Sending $AMOUNT SOL from TREZ → WALLET1${NC}"
    solana transfer "$WALLET1" "$AMOUNT" \
        --from "$TREZ_FILE" \
        --url https://api.devnet.solana.com \
        --allow-unfunded-recipient --fee-payer "$TREZ_FILE"

    check_balance "$TREZ" "TREZ (after)"
    check_balance "$WALLET1" "WALLET1 (after)"
    echo -e "${CYAN}✅ Transfer complete!${NC}"
}

# === Menu ===
clear
hea1 "Solana Wallet Manager"
echo -e "${BLUE}1)${NC} Check Balances"
echo -e "${BLUE}2)${NC} Send WALLET1 → TREZ"
echo -e "${BLUE}3)${NC} Send TREZ → WALLET1"
echo -e "${BLUE}4)${NC} Exit"
echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
echo -ne "${WHITE}Choose an option [1-4]: ${NC}"
read -r choice

case $choice in
    1)
        hea1 "Checking Balances"
        check_balance "$WALLET1" "WALLET1"
        check_balance "$TREZ" "TREZ"
        ;;
    2)
        send_to_trez
        ;;
    3)
        send_to_wallet1
        ;;
    4)
        echo -e "${GREEN}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option. Exiting.${NC}"
        ;;
esac

echo -e "\n${YELLOW}Done.${NC}"
