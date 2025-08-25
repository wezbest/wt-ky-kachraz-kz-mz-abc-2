use anchor_lang::prelude::*;

declare_id!("CVBns8Rp7ivo1tisKru8GDwhwu36DnxbM4YtkDiZReKu");

#[program]
pub mod fortco {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
