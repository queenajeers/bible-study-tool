from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.bible_service import BibleService

router = APIRouter()
bible_service = BibleService()

@router.get("/chapter-info/{book}/{chapter}")
async def stream_chapter_info(book: str, chapter: int):
    """Stream chapter introduction with real-time updates."""
    return StreamingResponse(
        bible_service.get_chapter_intro_stream(book, chapter),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

@router.get("/strongs-analysis/{book}/{chapter}/{verse}/{word}")
async def get_strongs_analysis_stream(book: str, chapter: int, verse: int, word: str):
    """Stream Strong's word analysis for a specific word in the verse."""
    bible_service = BibleService()
    
    return StreamingResponse(
        bible_service.get_strongs_analysis_stream(book, chapter, verse, word),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )