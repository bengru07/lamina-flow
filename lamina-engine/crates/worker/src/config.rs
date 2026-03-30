use std::collections::HashMap;
use std::path::PathBuf;
use anyhow::Result;
use lamina_core::manifest::NodeManifest;

#[derive(Debug, Clone)]
pub struct WorkerConfig {
    pub nats_url: String,
    pub nodes_dir: Option<PathBuf>,
}

impl WorkerConfig {
    pub fn from_env() -> Self {
        Self {
            nats_url: std::env::var("NATS_URL")
                .unwrap_or_else(|_| "nats://localhost:4222".to_string()),
            nodes_dir: std::env::var("NODES_DIR").ok().map(PathBuf::from),
        }
    }

    pub fn with_nodes_dir(mut self, path: Option<PathBuf>) -> Self {
        if path.is_some() {
            self.nodes_dir = path;
        }
        self
    }
}

pub fn load_manifests_from_dir(dir: &PathBuf) -> Result<HashMap<String, NodeManifest>> {
    let mut manifests = HashMap::new();
    load_dir(dir, &mut manifests)?;
    Ok(manifests)
}

fn load_dir(dir: &PathBuf, manifests: &mut HashMap<String, NodeManifest>) -> Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            load_dir(&path, manifests)?;
            continue;
        }

        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        let content = std::fs::read_to_string(&path)?;
        match serde_json::from_str::<NodeManifest>(&content) {
            Ok(manifest) => {
                manifests.insert(manifest.id.clone(), manifest);
            }
            Err(e) => {
                tracing::warn!("failed to parse manifest at {}: {}", path.display(), e);
            }
        }
    }
    Ok(())
}