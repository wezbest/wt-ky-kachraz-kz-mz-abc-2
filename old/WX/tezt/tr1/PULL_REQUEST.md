## Description

Add `--version` and `-v` flags to the Trident CLI application to display version information. This enhancement allows users to quickly check the current version of the Trident tool without needing to run other commands.

### Changes Made

1. **Added Version Flag Support**: Modified the `Cli` struct in `crates/cli/src/lib.rs` to include both `--version` (long form) and `-v` (short form) flags using clap's argument parser.

2. **Implemented Version Display**: Added version printing functionality that displays the current version from `env!("CARGO_PKG_VERSION")` along with a link to the documentation.

3. **Refactored Control Flow**: Replaced the if-else condition with a more idiomatic Rust match statement for better code organization and readability.

4. **Maintained Backward Compatibility**: All existing functionality remains unchanged, ensuring no breaking changes to the CLI interface.

### Technical Details

- The version flag reads from the workspace `Cargo.toml` file, ensuring version consistency across the project
- Both `-v` and `--version` work identically and can be used interchangeably
- The implementation follows the existing code style and patterns used throughout the Trident CLI
- The match statement provides explicit handling of all possible flag/command combinations

## Related Tickets & Documents

- Related Issue # Implements the version flag requirement from RULES.TXT
- Closes # Provides CLI version display functionality

- [ ] I clicked on "Allow edits from maintainers"

---

### Summary of Changes

**File Modified**: `crates/cli/src/lib.rs`

1. **Line 25**: Added short form `-v` to the version argument:

   ```rust
   #[arg(short = 'v', long, help = "Print version information")]
   ```

2. **Lines 81-110**: Replaced if-else logic with match statement for better pattern matching:
   ```rust
   match (cli.version, cli.command) {
       (true, _) => { /* Print version and exit */ }
       (false, Some(command)) => { /* Process command */ }
       (false, None) => { /* Show help */ }
   }
   ```

### Testing

The implementation has been designed to:

- ✅ Display version information when `-v` or `--version` is used
- ✅ Maintain all existing CLI functionality
- ✅ Follow the established code patterns and conventions
- ✅ Provide consistent behavior with other CLI flags
