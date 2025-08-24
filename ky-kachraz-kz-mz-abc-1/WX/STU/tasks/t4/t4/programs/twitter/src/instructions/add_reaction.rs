//-------------------------------------------------------------------------------
///
/// TASK: Implement the add reaction functionality for the Twitter program
///
/// Requirements:
/// - Initialize a new reaction account with proper PDA seeds
/// - Increment the appropriate counter (likes or dislikes) on the tweet
/// - Set reaction fields: type, author, parent tweet, and bump
/// - Handle both Like and Dislike reaction types
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn add_reaction(ctx: Context<AddReactionContext>, reaction: ReactionType) -> Result<()> {
    let tweet = &mut ctx.accounts.tweet;
    let tweet_reaction = &mut ctx.accounts.tweet_reaction;

    // Update reaction count based on type
    match reaction {
        ReactionType::Like => {
            if tweet.likes == u64::MAX {
                return Err(TwitterError::MaxLikesReached.into());
            }
            tweet.likes += 1;
        }
        ReactionType::Dislike => {
            if tweet.dislikes == u64::MAX {
                return Err(TwitterError::MaxDislikesReached.into());
            }
            tweet.dislikes += 1;
        }
    }

    // Set reaction fields
    tweet_reaction.reaction = reaction;
    tweet_reaction.reaction_author = ctx.accounts.reaction_author.key();
    tweet_reaction.parent_tweet = tweet.key();
    tweet_reaction.bump = ctx.bumps.tweet_reaction;

    Ok(())
}

#[derive(Accounts)]
pub struct AddReactionContext<'info> {
    #[account(mut)]
    pub reaction_author: Signer<'info>,

    #[account(
        init,
        seeds = [
            TWEET_REACTION_SEED.as_bytes(),
            reaction_author.key().as_ref(),
            tweet.key().as_ref()
        ],
        bump,
        payer = reaction_author,
        space = 8 + Reaction::INIT_SPACE
    )]
    pub tweet_reaction: Account<'info, Reaction>,

    #[account(mut)]
    pub tweet: Account<'info, Tweet>,

    pub system_program: Program<'info, System>,
}
