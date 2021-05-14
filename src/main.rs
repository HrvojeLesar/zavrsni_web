use std::env;
use env_logger::Env;
use dotenv::dotenv;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files::Files;
use serde::{Serialize, Deserialize};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize)]
struct HungInput {
    max: Option<bool>,
    problem: Vec<Vec<i32>>,
}

#[derive(Debug, Serialize)]
struct HungResult<'a> {
    result: i32,
    original_problem: &'a Vec<Vec<i32>>,
    assigned_positions: Vec<Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReturnResult {
    result: i32,
    assignment_mask: Vec<Vec<i32>>,
}

enum ProcessType {
    HungarianMethod,
    HungarianMethodMunkres,
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().content_type("text/html; charset=utf-8")
    .body(include_str!("../static/www/index.html"))
}

#[post("/hung")]
async fn solve_hungarian(input: web::Json<HungInput>) -> impl Responder {

    if let Ok(res) = tokio::time::timeout(std::time::Duration::from_secs(10), start_process(ProcessType::HungarianMethod, &input)).await {
        return HttpResponse::Ok().json(HungResult { result: res.result, original_problem: &input.problem, assigned_positions: res.assignment_mask });
    } else {
        return HttpResponse::Ok().finish();
    }
}

#[post("/hung-munkres")]
async fn solve_hungarian_munkres(input: web::Json<HungInput>) -> impl Responder {
    if let Ok(res) = tokio::time::timeout(std::time::Duration::from_secs(10), start_process(ProcessType::HungarianMethodMunkres, &input)).await {
        return HttpResponse::Ok().json(HungResult { result: res.result, original_problem: &input.problem, assigned_positions: res.assignment_mask });
    } else {
        return HttpResponse::Ok().finish();
    }
}

async fn start_process(process_type: ProcessType, input: &HungInput) -> ReturnResult {
    let program;
    match process_type {
        ProcessType::HungarianMethod => program = "hung",
        ProcessType::HungarianMethodMunkres => program = "hung-munkres",
    }

    let problem_json = serde_json::to_string(&input).unwrap();

    let out = Command::new(program)
        .arg(&problem_json)
        .output()
        .await;
    serde_json::from_slice::<ReturnResult>(&out.unwrap().stdout).unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();

    HttpServer::new(|| {
        App::new()
        .service(index)
        .service(solve_hungarian)
        .service(solve_hungarian_munkres)
        .data(web::JsonConfig::default().limit(64000))
        .wrap(actix_web::middleware::Logger::default())
        .service(Files::new("/static/", "static/"))
    })
    .bind(format!("127.0.0.1:{}", env::var("PORT").expect("PORT must be set!")))?
    .run()
    .await
}