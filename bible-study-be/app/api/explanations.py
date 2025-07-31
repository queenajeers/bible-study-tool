from fastapi import APIRouter
from app.services.explanation_service import get_bible_chapter_intro

router = APIRouter()

@router.get("/chapter-info/{book}/{chapter}")
def chapter_info(book: str, chapter: int):
    chapter_info = get_bible_chapter_intro(book, chapter)
    return {"result": chapter_info}
