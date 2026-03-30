use std::collections::{HashMap, HashSet, VecDeque};
use thiserror::Error;
use crate::workflow::{Workflow, Edge, EdgeKind};

#[derive(Debug, Error)]
pub enum DagError {
    #[error("cycle detected involving node: {0}")]
    CycleDetected(String),
    #[error("edge references unknown node: {0}")]
    UnknownNode(String),
    #[error("edge references unknown port '{port}' on node '{node}'")]
    UnknownPort { node: String, port: String },
}

#[derive(Debug, Clone)]
pub struct ResolvedDag {
    pub topology: Vec<Vec<String>>,
    pub routes: HashMap<String, Vec<Route>>,
    pub feedback_routes: HashMap<String, Vec<Route>>,
    pub trigger_routes: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone)]
pub struct Route {
    pub from_port: String,
    pub to_node: String,
    pub to_port: String,
}

pub fn resolve(workflow: &Workflow) -> Result<ResolvedDag, DagError> {
    let node_ids: HashSet<String> = workflow.nodes.iter().map(|n| n.id.clone()).collect();
    let node_ports: HashMap<String, (Vec<String>, Vec<String>)> = workflow
        .nodes
        .iter()
        .map(|n| (n.id.clone(), (n.manifest.inputs.clone(), n.manifest.outputs.clone())))
        .collect();

    let data_edges: Vec<&Edge> = workflow.edges.iter()
        .filter(|e| e.kind == EdgeKind::Data && !e.feedback)
        .collect();

    let feedback_edges: Vec<&Edge> = workflow.edges.iter()
        .filter(|e| e.kind == EdgeKind::Data && e.feedback)
        .collect();

    let trigger_edges: Vec<&Edge> = workflow.edges.iter()
        .filter(|e| e.kind == EdgeKind::Trigger)
        .collect();

    validate_edges(&data_edges, &node_ids, &node_ports)?;
    validate_edges(&feedback_edges, &node_ids, &node_ports)?;
    validate_trigger_edges(&trigger_edges, &node_ids)?;

    let dependencies = build_dependencies(&data_edges, &node_ids);
    let topology = topological_sort(&dependencies, &node_ids)?;
    let routes = build_routes(&data_edges);
    let feedback_routes = build_routes(&feedback_edges);
    let trigger_routes = build_trigger_routes(&trigger_edges);

    Ok(ResolvedDag { topology, routes, feedback_routes, trigger_routes })
}

fn validate_edges(
    edges: &[&Edge],
    node_ids: &HashSet<String>,
    node_ports: &HashMap<String, (Vec<String>, Vec<String>)>,
) -> Result<(), DagError> {
    for edge in edges {
        if !node_ids.contains(&edge.from.node_id) {
            return Err(DagError::UnknownNode(edge.from.node_id.clone()));
        }
        if !node_ids.contains(&edge.to.node_id) {
            return Err(DagError::UnknownNode(edge.to.node_id.clone()));
        }
        let (_, from_outputs) = &node_ports[&edge.from.node_id];
        if !from_outputs.contains(&edge.from.port) {
            return Err(DagError::UnknownPort {
                node: edge.from.node_id.clone(),
                port: edge.from.port.clone(),
            });
        }
        let (to_inputs, _) = &node_ports[&edge.to.node_id];
        if !to_inputs.contains(&edge.to.port) {
            return Err(DagError::UnknownPort {
                node: edge.to.node_id.clone(),
                port: edge.to.port.clone(),
            });
        }
    }
    Ok(())
}

fn validate_trigger_edges(
    edges: &[&Edge],
    node_ids: &HashSet<String>,
) -> Result<(), DagError> {
    for edge in edges {
        if !node_ids.contains(&edge.from.node_id) {
            return Err(DagError::UnknownNode(edge.from.node_id.clone()));
        }
        if !node_ids.contains(&edge.to.node_id) {
            return Err(DagError::UnknownNode(edge.to.node_id.clone()));
        }
    }
    Ok(())
}

fn build_dependencies(edges: &[&Edge], node_ids: &HashSet<String>) -> HashMap<String, Vec<String>> {
    let mut deps: HashMap<String, Vec<String>> = node_ids
        .iter()
        .map(|id| (id.clone(), vec![]))
        .collect();

    for edge in edges {
        deps.entry(edge.to.node_id.clone())
            .or_default()
            .push(edge.from.node_id.clone());
    }

    deps
}

fn topological_sort(
    dependencies: &HashMap<String, Vec<String>>,
    node_ids: &HashSet<String>,
) -> Result<Vec<Vec<String>>, DagError> {
    let mut in_degree: HashMap<String, usize> =
        node_ids.iter().map(|id| (id.clone(), 0)).collect();

    for (node, deps) in dependencies {
        let _ = in_degree.entry(node.clone()).or_insert(0);
        for _ in deps {
            *in_degree.get_mut(node).unwrap() += 1;
        }
    }

    let mut queue: VecDeque<String> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| id.clone())
        .collect();

    let mut layers: Vec<Vec<String>> = vec![];
    let mut visited = 0;

    while !queue.is_empty() {
        let layer_size = queue.len();
        let mut layer = vec![];

        for _ in 0..layer_size {
            let node = queue.pop_front().unwrap();
            layer.push(node.clone());
            visited += 1;

            for (dependent, deps) in dependencies {
                if deps.contains(&node) {
                    let deg = in_degree.get_mut(dependent).unwrap();
                    *deg -= 1;
                    if *deg == 0 {
                        queue.push_back(dependent.clone());
                    }
                }
            }
        }

        layers.push(layer);
    }

    if visited != node_ids.len() {
        let cycle_node = node_ids
            .iter()
            .find(|id| *in_degree.get(*id).unwrap() > 0)
            .unwrap()
            .clone();
        return Err(DagError::CycleDetected(cycle_node));
    }

    Ok(layers)
}

fn build_routes(edges: &[&Edge]) -> HashMap<String, Vec<Route>> {
    let mut routes: HashMap<String, Vec<Route>> = HashMap::new();

    for edge in edges {
        routes
            .entry(edge.from.node_id.clone())
            .or_default()
            .push(Route {
                from_port: edge.from.port.clone(),
                to_node: edge.to.node_id.clone(),
                to_port: edge.to.port.clone(),
            });
    }

    routes
}

fn build_trigger_routes(edges: &[&Edge]) -> HashMap<String, Vec<String>> {
    let mut routes: HashMap<String, Vec<String>> = HashMap::new();

    for edge in edges {
        routes
            .entry(edge.from.node_id.clone())
            .or_default()
            .push(edge.to.node_id.clone());
    }

    routes
}