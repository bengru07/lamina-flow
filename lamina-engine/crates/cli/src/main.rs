use anyhow::Result;

mod commands;

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();

    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        print_usage();
        return Ok(());
    }

    match args[1].as_str() {
        "run" => {
            let path = args.get(2).map(|s| s.as_str()).unwrap_or(".");
            let watch = args.contains(&"--watch".to_string());
            let inputs = args.get(3).filter(|s| *s != "--watch").map(|s| s.as_str());
            commands::run::execute(path, inputs, watch).await?;
        }
        "status" => {
            let execution_id = args.get(2).ok_or_else(|| anyhow::anyhow!("missing execution id"))?;
            commands::status::execute(execution_id).await?;
        }
        "cancel" => {
            let execution_id = args.get(2).ok_or_else(|| anyhow::anyhow!("missing execution id"))?;
            commands::cancel::execute(execution_id).await?;
        }
        "logs" => {
            let execution_id = args.get(2).ok_or_else(|| anyhow::anyhow!("missing execution id"))?;
            commands::logs::execute(execution_id).await?;
        }
        "watch" => {
            let execution_id = args.get(2).ok_or_else(|| anyhow::anyhow!("missing execution id"))?;
            commands::watch::execute(execution_id).await?;
        }
        _ => {
            print_usage();
        }
    }

    Ok(())
}

fn print_usage() {
    println!("lamina — workflow execution engine");
    println!();
    println!("USAGE:");
    println!("  lamina run <workflow.json> [inputs.json]");
    println!("  lamina status <execution_id>");
    println!("  lamina cancel <execution_id>");
    println!("  lamina logs <execution_id>");
    println!("  lamina watch <execution_id>");
    println!();
    println!("ENVIRONMENT:");
    println!("  LAMINA_API=http://localhost:3000  (default)");
}