from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import explanations

app = FastAPI(title="Bible Study Tool")

# 👇 Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Register routes
app.include_router(explanations.router, prefix="/explanations", tags=["Explanations"])

@app.get("/")
def root():
    return {"message": "Bible Study Tool API"}
