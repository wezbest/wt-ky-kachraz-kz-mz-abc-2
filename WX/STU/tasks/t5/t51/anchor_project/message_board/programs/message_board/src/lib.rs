use anchor_lang::prelude::*;

declare_id!("CstpP3EmxiMSETxpGDoV6magX1hit1VuCgPm2uPJdPaY");

#[program]
pub mod message_board {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
