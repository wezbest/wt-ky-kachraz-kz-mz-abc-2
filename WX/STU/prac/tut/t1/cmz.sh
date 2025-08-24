#!/usr/bin/bash
# Running Commands 
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

# Header function
hea1() {
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${CYAN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
}

start_gfx() {
    echo -e "${GREEN}"
    echo -e "███████╗ ████████╗  █████╗   █████╗  ██████╗  ████████╗"
    echo -e "██╔════╝ ╚══██╔══╝ ██╔══██╗ ██╔══██╗ ██╔══██╗ ╚══██╔══╝"
    echo -e "███████╗    ██║    ███████║ ███████║ ██████╔╝    ██║   "
    echo -e "╚════██║    ██║    ██╔══██║ ██╔══██║ ██╔══██╗    ██║   "
    echo -e "███████║    ██║    ██║  ██║ ██║  ██║ ██║  ██║    ██║   "
    echo -e "╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝  "
    echo -e "${NC}"
}

end_gfx() {
    echo -e "${RED}"
    echo -e "███████╗ ███╗   ██╗ ██████╗ "
    echo -e "██╔════╝ ████╗  ██║ ██╔══██╗"
    echo -e "█████╗   ██╔██╗ ██║ ██║  ██║"
    echo -e "██╔══╝   ██║╚██╗██║ ██║  ██║"
    echo -e "███████╗ ██║ ╚████║ ██████╔╝"
    echo -e "╚══════╝ ╚═╝  ╚═══╝ ╚═════╝ "
    echo -e "${NC}"
}


# Make a new project
anch_t() {
    start_gfx
    hea1 "Execute Anchor Test"
    co1="anchor test"
    echo -e "${GREEN}Executing...${co1}${NC}"
    eval "$co1"
    end_gfx
}

# Address 
declare -a adrz=(
"6R8jqTmkxkPss4qxak6HKZSgnVqVyKCVVePM5bWn5azd"
"2RcCGxFX2dzj66k9khnC9NnLMvfZJQZV3hWpzkEiv1oz"
"7mMHVYwXFmGCe2SmpGs9J1tE9bJhEhWNz9f14u1gXd7f"
)

bal_t() {
    
    start_gfx
    hea1 "Solana Devnet balance checker"

    for address in "${adrz[@]}"
    do
    echo -en "Checking devent balance for ${BLUE} $address: ${NC}"
    balance=$(solana balance "$address" --url devnet 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}$balance${NC}"
    else
        echo "Error fetching balance (invalid address or connection issue)"
    fi
    done

    end_gfx
}

air_t() {
    start_gfx

    AMT="1"

    hea1 "AirPanty to adrez"

    for address in "${adrz[@]}"
    do
        echo -n "Airdropping to $address... "
        
        # Perform airdrop (suppress verbose output but keep errors)
        result=$(solana airdrop $AMT "$address" --url devnet 2>&1)
        
        if [[ $result == *"Signature"* ]]; then
            echo "✅ Success!"
        else
            echo "❌ Failed: $result"
        fi
        
        sleep 1  # Rate limiting protection
    done

    end_gfx
}

# Start Dockerz 
dok_st() {
    hea1 "Starting school-of-solana docker"
    co1="docker ps -a"
    co2="docker start school-of-solana"
    co3="docker exec -it school-of-solana bash"
    echo -e "${GREEN}Executing...${co1}${NC}"
    eval "$co1"
    echo -e "${GREEN}Executing...${co2}${NC}"
    eval "$co2"
    echo -e "${GREEN}Executing...${co3}${NC}"    
    eval "$co3"
}

# Anchor deploy 
function deploy_to_devnet() {
    start_gfx
    hea1 "Deploying Anchor program to devnet"

    # Configuration
    local WALLET_PATH="/panty/prac/tut/t1/solana_wallets/wallet_0.json"
    local PROGRAM_NAME="t1"
    local ANCHOR_TOML="/panty/prac/tut/t1/Anchor.toml"
    local LIB_RS="/panty/prac/tut/t1/programs/${PROGRAM_NAME}/src/lib.rs"
    local DEPLOYER_PUBKEY="6R8jqTmkxkPss4qxak6HKZSgnVqVyKCVVePM5bWn5azd"
    local MIN_SOL_REQUIRED=1.5  # Minimum SOL needed for deployment
    local AIRDROP_ATTEMPTS=0
    local MAX_AIRDROP_ATTEMPTS=3

    # 1. Verify wallet
    echo "🔐 Verifying wallet..."
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}solana-keygen verify \"$DEPLOYER_PUBKEY\" \"$WALLET_PATH\" ${NC}"
    if ! solana-keygen verify "$DEPLOYER_PUBKEY" "$WALLET_PATH"; then
        echo "❌ Error: Wallet verification failed"
        return 1
    fi

    # 2. Check and ensure sufficient balance
    echo "💰 Checking devnet balance..."
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}solana balance --url devnet \"$DEPLOYER_PUBKEY\" | awk '{print \$1}' ${NC}"
    get_balance() {
        solana balance --url devnet "$DEPLOYER_PUBKEY" | awk '{print $1}'
    }

    BALANCE=$(get_balance)
    echo "Current balance: $BALANCE SOL"

    # Float comparison using awk
    while awk -v balance="$BALANCE" -v min="$MIN_SOL_REQUIRED" 'BEGIN {exit (balance >= min)}'; do
        echo "⚠️ Low balance ($BALANCE SOL). Requesting airdrop..."
        
        if ! solana airdrop 2 --url devnet "$DEPLOYER_PUBKEY"; then
            echo "❌ Airdrop failed. Retrying in 30 seconds..."
            sleep 30
        else
            echo "✔ Airdrop successful. Waiting for balance update..."
            sleep 5  # Wait for balance to update
            BALANCE=$(get_balance)
            echo "New balance: $BALANCE SOL"
        fi

        if [ "$AIRDROP_ATTEMPTS" -ge "$MAX_AIRDROP_ATTEMPTS" ]; then
            echo "❌ Failed to get sufficient SOL after $MAX_AIRDROP_ATTEMPTS attempts"
            return 1
        fi
        ((AIRDROP_ATTEMPTS++))
    done

    # 3. Build program
    echo "🏗 Building program..."
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}anchor build ${NC}"
    if ! anchor build; then
        echo "❌ Error: Build failed"
        return 1
    fi

    # 4. Get new program ID
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN} solana address -k \"${GREEN}/panty/prac/tut/t1/target/deploy/${PROGRAM_NAME}-keypair.json\" ${NC}"
    NEW_PROGRAM_ID=$(solana address -k "/panty/prac/tut/t1/target/deploy/${PROGRAM_NAME}-keypair.json")
    echo "🆔 New program ID: $NEW_PROGRAM_ID"

    # 5. Update program ID in files
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}sed -i.bak \"s/^t1 = .*/t1 = \"$NEW_PROGRAM_ID\"/\" \"$ANCHOR_TOML\" ${NC}"
    echo -e "${GREEN}sed -i.bak \"s/declare_id!(\".*\")/declare_id!(\"$NEW_PROGRAM_ID\")/\" \"$LIB_RS\" ${NC}"
    echo "✏️ Updating program ID in config files..."
    sed -i.bak "s/^t1= .*/t1 = \"$NEW_PROGRAM_ID\"/" "$ANCHOR_TOML"
    sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$NEW_PROGRAM_ID\")/" "$LIB_RS"

    # 6. Deploy to devnet
    echo "🚀 Deploying to devnet..."
    local DEPLOY_ATTEMPTS=0
    local MAX_DEPLOY_ATTEMPTS=3
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}anchor deploy --provider.cluster devnet --provider.wallet \"$WALLET_PATH\" ${NC}"
    while [ "$DEPLOY_ATTEMPTS" -lt "$MAX_DEPLOY_ATTEMPTS" ]; do
        if anchor deploy --provider.cluster devnet --provider.wallet "$WALLET_PATH"; then
            break
        else
            ((DEPLOY_ATTEMPTS++))
            echo "⚠️ Deployment attempt $DEPLOY_ATTEMPTS failed"
            if [ "$DEPLOY_ATTEMPTS" -eq "$MAX_DEPLOY_ATTEMPTS" ]; then
                echo "❌ Error: Deployment failed after $MAX_DEPLOY_ATTEMPTS attempts"
                return 1
            fi
            sleep 10
        fi
    done

    # 7. Run tests
    echo "🧪 Running tests..."
    echo -e "${GREEN}Executing..."
    echo -e "${GREEN}anchor test --provider.cluster devnet --provider.wallet \"$WALLET_PATH\" ${NC}"
    if ! anchor test --provider.cluster devnet --provider.wallet "$WALLET_PATH"; then
        echo "❌ Error: Tests failed"
        return 1
    fi

    echo "🎉 Successfully deployed to devnet!"
    echo "Program ID: $NEW_PROGRAM_ID"
    echo "Deployer: $DEPLOYER_PUBKEY"
    echo "Current balance: $(get_balance) SOL"
    end_gfx
    
    return 0

}

# --- Main Execution ---
# air_t
# bal_t
deploy_to_devnet
# dok_st
# anch_d
# wal_ver