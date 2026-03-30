use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::RwLock;
use lamina_core::manifest::NodeManifest;
use crate::config::load_manifests_from_dir;

pub struct NodeRegistry {
    manifests: RwLock<HashMap<String, NodeManifest>>,
}

impl NodeRegistry {
    pub fn new(nodes_dir: Option<&PathBuf>) -> Self {
        let manifests = match nodes_dir {
            Some(dir) => match load_manifests_from_dir(dir) {
                Ok(m) => {
                    tracing::info!("loaded {} manifests from {}", m.len(), dir.display());
                    m
                }
                Err(e) => {
                    tracing::warn!("failed to load manifests from dir: {}", e);
                    HashMap::new()
                }
            },
            None => HashMap::new(),
        };

        Self {
            manifests: RwLock::new(manifests),
        }
    }

    pub fn resolve(&self, node_id: &str, fallback: &NodeManifest) -> NodeManifest {
        self.manifests
            .read()
            .unwrap()
            .get(node_id)
            .cloned()
            .unwrap_or_else(|| fallback.clone())
    }
}