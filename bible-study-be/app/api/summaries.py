from fastapi import APIRouter
from app.services.summary_service import generate_summary

router = APIRouter()

@router.get("/{book}/{chapter}")
def get_summary(book: str, chapter: int):
    summary = generate_summary(book, chapter)
    return {"summary": summary}
