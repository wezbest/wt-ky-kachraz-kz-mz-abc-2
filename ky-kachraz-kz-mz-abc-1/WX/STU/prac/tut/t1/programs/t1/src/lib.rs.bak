use anchor_lang::prelude::*;

declare_id!("B1mwXwsaY8nPUTJ3coexanu7Dp8nFsmZuFtGL3iWuntD");

#[program]
pub mod t1 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, LickPussy: String) -> Result<()> {
        msg!("SmellHerFarts: {:?}", ctx.program_id);

        let data_account = &mut ctx.accounts.data_account;
        data_account.LickPussy = LickPussy;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer, 
        space = 200,
    )]
    pub data_account: Account<'info, PissDrink>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PissDrink {
    pub LickPussy: String,
}
