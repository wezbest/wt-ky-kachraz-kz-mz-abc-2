// ----------------------------------------------------
// w1 Primitives
// ----------------------------------------------------

// --- Attributes ---
#![allow(dead_code)]

// --- Imports ---
use crate::utz::{header, pswg};
use yansi::Paint;

// --- Main function Call

pub fn wo1_main() {
    pswg("Wo1 Work:");
    // lop1()
    // lop2();
    // mat1();
    // addz();
    cubeprint();
}

// --- Sub functions Call

fn lop1() {
    let t1 = "Lopsa Tests";
    pswg(t1);

    // Loops test
    let line = "~".repeat(20);
    let mut n = 10;
    while n > 0 {
        println!("{}", line);
        println!("This: {}", n.blue());
        dbg!(n);
        n -= 2;
    }
}

fn lop2() {
    let t2 = "Lopsa Tests 2";
    pswg(t2);

    // Loops test
    let line = "~".repeat(20);
    for n in (0..5).rev() {
        println!("{}", line);
        println!("This: {}", n.blue());
    }
}

// Match staement like swith case

fn mat1() {
    header("Match Tests");

    let number = 2;
    dbg!(number);

    match number {
        1 => println!("{}", "one".green()),
        2 => println!("Number Matched - {}", "Two".blue()),
        _ => println!("{}", "No Matchnumber".red()),
    }
}

// Fucntions test

fn addz() -> i32 {
    header("Addz Function Test");

    let a = 69;
    let b = 420;
    let c = a + b;

    println!("Addz = {} + {} = {}", a, b, c.green());

    dbg!(c)
}

// Functions returning value without semicolon

// If a value is bein returned, you need to explain that alsoTi
fn cube(n: i32) -> i32 {
    n * n * n
}
fn cubeprint() {
    header("Cube Print");
    let cube1 = cube(99);
    dbg!(cube1);
}
