from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.bible_routes import router as bible_router

app = FastAPI(
    title="Bible Study API",
    description="Streaming Bible chapter introductions and Strong's analysis",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bible_router, prefix="/api/v1", tags=["Bible Study"])

@app.get("/")
async def root():
    return {"message": "Bible Study API v2.0 - Now with OpenAI Structured Outputs and Streaming!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bible-study-api"}

