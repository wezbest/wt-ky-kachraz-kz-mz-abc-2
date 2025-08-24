//-------------------------------------------------------------------------------
///
/// TASK: Implement the initialize tweet functionality for the Twitter program
///
/// Requirements:
/// - Validate that topic and content don't exceed maximum lengths
/// - Initialize a new tweet account with proper PDA seeds
/// - Set tweet fields: topic, content, author, likes, dislikes, and bump
/// - Initialize counters (likes and dislikes) to zero
/// - Use topic in PDA seeds for tweet identification
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn initialize_tweet(
    ctx: Context<InitializeTweet>,
    topic: String,
    content: String,
) -> Result<()> {
    // Validate lengths
    if topic.len() > TOPIC_LENGTH {
        return Err(TwitterError::TopicTooLong.into());
    }
    if content.len() > CONTENT_LENGTH {
        return Err(TwitterError::ContentTooLong.into());
    }

    // Initialize the tweet account
    let tweet = &mut ctx.accounts.tweet;
    tweet.tweet_author = ctx.accounts.tweet_authority.key();
    tweet.topic = topic;
    tweet.content = content;
    tweet.likes = 0;
    tweet.dislikes = 0;
    tweet.bump = ctx.bumps.tweet;

    Ok(())
}

#[derive(Accounts)]
#[instruction(topic: String)]
pub struct InitializeTweet<'info> {
    #[account(mut)]
    pub tweet_authority: Signer<'info>,

    #[account(
        init,
        payer = tweet_authority,
        seeds = [
            topic.as_bytes(),
            TWEET_SEED.as_bytes(),
            tweet_authority.key().as_ref()
        ],
        bump,
        space = 8 + Tweet::INIT_SPACE
    )]
    pub tweet: Account<'info, Tweet>,

    pub system_program: Program<'info, System>,
}
