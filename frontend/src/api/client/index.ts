import axios from "axios";

export const workspacesApi = axios.create({
    baseURL: "http://localhost:8080/projects",
    headers: {
        "Content-Type": "application/json",
    }
})