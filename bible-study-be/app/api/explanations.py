from fastapi import APIRouter
from app.services.explanation_service import get_bible_chapter_intro,get_strongs_word

router = APIRouter()

@router.get("/chapter-info/{book}/{chapter}")
def chapter_info(book: str, chapter: int):
    chapter_info = get_bible_chapter_intro(book, chapter)
    return {"result": chapter_info}


@router.get("/strong-info/{book}/{chapter}/{word}")
def strongs_info(book: str, chapter: int,word:str):
    chapter_info = get_strongs_word(book, chapter,word)
    return {"result": chapter_info}