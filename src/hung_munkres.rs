use std::env;
use madarska_metoda::{Matrix, MadarskaMetodaMunkres};
use std::io::{stdout, Write};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize)]
struct ReturnResult {
    result: i32,
    original_problem: Vec<Vec<i32>>,
    assignment_mask: Vec<Vec<i32>>,
}

#[derive(Debug, Deserialize)]
struct HungInput {
    max: Option<bool>,
    problem: Vec<Vec<i32>>,
}

fn main() {
    let args: Vec<String> = env::args().collect();

    let input: HungInput = serde_json::from_str(&args[1]).unwrap();
    let matrix = Matrix::new(input.problem);
    let mut mm = MadarskaMetodaMunkres::new(&matrix);
    let res = mm.solve(input.max);

    let ret = ReturnResult {
        result: res,
        original_problem: matrix.matrix,
        assignment_mask: mm.assignment_mask.matrix,
    };

    let stdout = stdout();
    let mut handle = stdout.lock();

    handle.write_all(serde_json::to_string(&ret).unwrap().as_bytes()).unwrap();
}
