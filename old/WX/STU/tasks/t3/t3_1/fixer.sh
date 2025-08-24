#!/usr/bin/env fish

echo "🔧 Running Solana/Anchor development environment fixer..."
echo "🛠️  Detected shell: Fish ($0)"

set -l user_home (echo $HOME)
set -l rust_dir "$user_home/.cargo"
set -l solana_dir "$user_home/.local/share/solana"
set -l bin_dir "$user_home/.local/bin"

# ------------------------------------------------------------------
# 1. Ensure .local/bin exists and is in Fish universal path
# ------------------------------------------------------------------
if not test -d "$bin_dir"
    echo "📁 Creating $bin_dir"
    mkdir -p "$bin_dir"
end

if not contains "$bin_dir" $fish_user_paths
    echo "✅ Adding $bin_dir to Fish path"
    set -Ua fish_user_paths "$bin_dir"
end


# ------------------------------------------------------------------
# 2. Add Rust to PATH and source it
# ------------------------------------------------------------------
if not set -q CARGO_HOME
    set -gx CARGO_HOME "$rust_dir"
end

if not contains "$rust_dir/bin" $fish_user_paths
    set -Ua fish_user_paths "$rust_dir/bin"
    echo "✅ Added Cargo bin to PATH"
end

# Source cargo env in current session
set -q CARGO_HOME; or set -gx CARGO_HOME "$rust_dir"
if test -f "$rust_dir/env"
    source "$rust_dir/env"
end


# ------------------------------------------------------------------
# 3. Add Solana to PATH
# ------------------------------------------------------------------
if not contains "$solana_dir/bin" $fish_user_paths
    set -Ua fish_user_paths "$solana_dir/bin"
    echo "✅ Added Solana bin to PATH"
end


# ------------------------------------------------------------------
# 4. Load Rust toolchain
# ------------------------------------------------------------------
if not command -v rustc > /dev/null
    echo "❌ rustc not found. Please install Rust: https://rustup.rs"
    exit 1
else
    echo "✅ rustc $(rustc --version) is available"
end


# ------------------------------------------------------------------
# 5. Set default toolchain to stable (or nightly)
# ------------------------------------------------------------------
echo "🔧 Setting default Rust toolchain to 'stable'"
rustup default stable

# Ensure host target is installed
set -l host_target "x86_64-unknown-linux-gnu"
if not rustup target list --installed | grep -q "$host_target"
    echo "📥 Installing standard library for $host_target"
    rustup target add $host_target
else
    echo "✅ Host target $host_target is installed"
end


# ------------------------------------------------------------------
# 6. Reinstall rust-std component (ensures std is available)
# ------------------------------------------------------------------
echo "🔧 Reinstalling rust-std component"
rustup component remove rust-std --toolchain stable
rustup component add rust-std --toolchain stable
echo "✅ rust-std reinstalled"


# ------------------------------------------------------------------
# 7. Unset dangerous environment variables
# ------------------------------------------------------------------
echo "🧹 Unsetting problematic environment variables"
set -e RUSTFLAGS
set -e RUST_SYSROOT
set -e CARGO_BUILD_TARGET

# Also clean from config if set
set -l cargo_config "$PWD/.cargo/config.toml"
if test -f "$cargo_config"
    echo "⚠️  Checking $cargo_config for BPF-only settings..."
    if grep -q "target.*bpf" "$cargo_config"
        echo "💡 Consider removing 'target' from $cargo_config when testing."
        echo "   Or use: anchor test --skip-build"
    end
end


# ------------------------------------------------------------------
# 8. Verify Solana and Anchor
# ------------------------------------------------------------------
if not command -v solana > /dev/null
    echo "❌ solana not installed. Run:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
else
    echo "✅ solana $(solana --version) is available"
end

if not command -v anchor > /dev/null
    echo "❌ anchor not installed. Run:"
    echo "   npm install -g @project-serum/anchor-cli"
else
    echo "✅ anchor $(anchor --version) is available"
end


# ------------------------------------------------------------------
# 9. Final Instructions
# ------------------------------------------------------------------
echo "\n✅ Environment is fixed!"
echo "🔁 Please restart your shell or run:"
echo "   source "$rust_dir/env""
echo ""
echo "🧪 Now try:"
echo "   anchor clean"
echo "   anchor test"