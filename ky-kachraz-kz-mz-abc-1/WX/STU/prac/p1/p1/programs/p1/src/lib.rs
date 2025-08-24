use anchor_lang::prelude::*;

declare_id!("8RpJAbzQUK6EKsai1QCRKDctwLXMiwMkZkVhCBzKrzxZ");

#[program]
pub mod p1 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
