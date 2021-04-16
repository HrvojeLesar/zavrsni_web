use std::env;
use env_logger::Env;
use dotenv::dotenv;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files::Files;

use serde::Serialize;

use madarska_metoda::{MadarskaMetoda, Matrix};
#[derive(Debug, Serialize)]
struct HungResult {
    min: i32,
    assigned_positions: Vec<Vec<i32>>,
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().content_type("text/html; charset=utf-8")
    .body(include_str!("../static/www/index.html"))
}

#[post("/hung")]
async fn solve_hungarian(prob: web::Json<Vec<Vec<i32>>>) -> impl Responder {
    
    let (res, assigned) = MadarskaMetoda::solve(&Matrix::new(prob.into_inner()));

    HttpResponse::Ok().json(HungResult { min: res, assigned_positions: assigned.matrix })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();

    HttpServer::new(|| {
        App::new()
        .service(hello)
        .service(solve_hungarian)
        .data(web::JsonConfig::default().limit(32000))
        .wrap(actix_web::middleware::Logger::default())
        .service(Files::new("/static/", "static/"))
    })
    .bind(format!("127.0.0.1:{}", env::var("PORT").expect("PORT must be set!")))?
    .run()
    .await
}