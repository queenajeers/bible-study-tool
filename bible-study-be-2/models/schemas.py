from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OriginalLanguageInfo(BaseModel):
    strongs_number: str
    original_language: str
    original_script: str
    transliteration: str
    pronunciation: str
    pronunciation_guide: str

class GeneralMeaning(BaseModel):
    meaning: str
    explanation: str
    usage_context: str

class ContextualMeaning(BaseModel):
    verse_reference: str
    verse_text: str
    word_in_context: str
    contextual_explanation: str
    why_this_translation: str
    deeper_insight: str

class BiblicalUsageExample(BaseModel):
    verse_reference: str
    verse_text: str
    translated_as: str
    meaning_used: str
    significance: str

class StrongsAnalysis(BaseModel):
    WordHeader: str
    LanguageInfo: str
    OriginalText: str
    Pronunciation: str
    LiteralMeaning: str
    ContextualMeaning: str
    OtherUses: str
    CulturalSignificance: str

class ChapterParagraph(BaseModel):
    title: str
    content: str

class ChapterIntro(BaseModel):
    MainHeading: str
    TimelineInfo: str
    Paras: List[ChapterParagraph]

class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int

class CostData(BaseModel):
    input_cost_usd: float
    output_cost_usd: float
    total_cost_usd: float

class LogEntry(BaseModel):
    timestamp: str
    function: str
    book: str
    chapter: int
    word: Optional[str]
    tokens: TokenUsage
    cost: CostData