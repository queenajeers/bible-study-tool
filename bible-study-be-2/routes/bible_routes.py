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

@router.get("/strongs-info/{book}/{chapter}/{word}")
async def stream_strongs_info(book: str, chapter: int, word: str):
    """Stream Strong's analysis with real-time updates."""
    return StreamingResponse(
        bible_service.get_strongs_analysis_stream(book, chapter, word),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )
