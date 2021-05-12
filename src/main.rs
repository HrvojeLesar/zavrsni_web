use std::env;
use env_logger::Env;
use dotenv::dotenv;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files::Files;

use serde::{Serialize, Deserialize};

use madarska_metoda::{MadarskaMetoda, Matrix};
#[derive(Debug, Deserialize)]
struct HungInput {
    max: Option<bool>,
    problem: Vec<Vec<i32>>,
}
#[derive(Debug, Serialize)]
struct HungResult {
    result: i32,
    original_problem: Vec<Vec<i32>>,
    assigned_positions: Vec<Vec<i32>>,
}


#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().content_type("text/html; charset=utf-8")
    .body(include_str!("../static/www/index.html"))
}

#[post("/hung")]
async fn solve_hungarian(input: web::Json<HungInput>) -> impl Responder {
    
    let matrix_in = Matrix::new(input.problem.clone());
	let mut mm = MadarskaMetoda::new(&matrix_in);
    let (res, assigned) = (mm.solve(input.max), mm.assignment_mask);

    HttpResponse::Ok().json(HungResult { result: res, original_problem: matrix_in.matrix, assigned_positions: assigned.matrix })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();

    HttpServer::new(|| {
        App::new()
        .service(index)
        .service(solve_hungarian)
        .data(web::JsonConfig::default().limit(64000))
        .wrap(actix_web::middleware::Logger::default())
        .service(Files::new("/static/", "static/"))
    })
    .bind(format!("127.0.0.1:{}", env::var("PORT").expect("PORT must be set!")))?
    .run()
    .await
}