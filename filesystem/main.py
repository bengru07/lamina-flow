from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import workspace, multiuser, node_templates

app = FastAPI()
origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspace.router)
app.include_router(node_templates.router)
app.include_router(multiuser.router)
# uvicorn main:app --host 0.0.0.0 --port 8000
