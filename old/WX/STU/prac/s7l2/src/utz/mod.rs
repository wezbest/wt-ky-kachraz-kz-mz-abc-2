/*
Utils folder
*/
// main utiities file
#![allow(dead_code)]

use cfonts::{BgColors, Fonts, Options, Rgb, say};
use yansi::Paint;

pub fn pswg(text: &str) {
    // Define the fire gradient colors
    let synth = vec![
        String::from("#FF00FF"), // Neon Pink
        String::from("#8A2BE2"), // Blue Violet
        String::from("#00FFFF"), // Cyan
        String::from("#FF1493"), // Deep Pink
        String::from("#9400D3"), // Dark Violet
    ];

    say(Options {
        text: text.to_string(),
        font: Fonts::FontConsole, // Change the style here
        gradient: synth,
        independent_gradient: false,
        transition_gradient: true,
        spaceless: true,
        background: BgColors::Rgb(Rgb::Val(1, 13, 6)), // Background color
        ..Options::default()
    });
}

pub fn header(text: &str) {
    let line = "~".repeat(20);
    println!("{} \n {} \n{}", line.blue(), text.blue(), line.blue());
}

// Function to clear console
pub fn clear_console() {
    print!("\x1B[2J\x1B[1;1H");
}
