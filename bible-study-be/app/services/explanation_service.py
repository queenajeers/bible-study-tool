import requests
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('strongs_usage.log'),
        logging.StreamHandler()
    ]
)

def log_token_usage(function_name: str, book: str, chapter: int, word: str, token_data: dict, cost_data: dict):
    """Log token usage and cost information to a file."""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "function": function_name,
        "book": book,
        "chapter": chapter,
        "word": word if word else None,
        "tokens": {
            "input_tokens": token_data.get("input_tokens", 0),
            "output_tokens": token_data.get("output_tokens", 0),
            "total_tokens": token_data.get("total_tokens", 0)
        },
        "cost": {
            "input_cost_usd": cost_data["input_cost_usd"],
            "output_cost_usd": cost_data["output_cost_usd"],
            "total_cost_usd": cost_data["total_cost_usd"]
        }
    }
    
    # Log to file
    with open('token_usage_log.txt', 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry, indent=2) + '\n' + '-'*50 + '\n')
    
    # Also log to console
    logging.info(f"{function_name} - Tokens: {token_data.get('total_tokens', 0)} | Cost: ${cost_data['total_cost_usd']:.6f}")

def calculate_cost(input_tokens: int, output_tokens: int) -> dict:
    """
    Calculate cost based on OpenRouter pricing:
    $2/M input tokens, $8/M output tokens
    """
    input_cost = (input_tokens / 1_000_000) * 2.0
    output_cost = (output_tokens / 1_000_000) * 8.0
    total_cost = input_cost + output_cost
    
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "input_cost_usd": round(input_cost, 6),
        "output_cost_usd": round(output_cost, 6),
        "total_cost_usd": round(total_cost, 6)
    }

def get_bible_chapter_intro(book: str, chapter: int) -> dict:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": f"""
You are a faithful biblical scholar and devoted guide helping someone understand the sacred richness of **{book} {chapter}**. Your goal is to provide reverent cultural context and spiritual insights that make God's Word more meaningful and accessible, especially addressing any difficult or challenging passages that modern readers might struggle with, inviting deeper exploration of His truth even in hard-to-understand verses.

Create a warm, faith-affirming introduction that says "Here's what will help God's Word come alive for you in this chapter."

Return this structured response:

1. **MainHeading**: A thoughtful, engaging title (6–10 words) that captures the chapter's essence and addresses any challenging content. If the chapter contains difficult passages, craft a heading that acknowledges the complexity while remaining faith-affirming. Think: "Understanding God's Heart in Hard Passages" or "Ancient Laws, Eternal Love" - informative but pastorally sensitive.

2. **TimelineInfo**: The historical period (e.g., "c. 1000–960 BCE") with brief context if helpful.

3. **Paras**: Create exactly 4 sections that gently guide understanding:

   **Cultural Context**: Explain the historical and cultural backdrop that God was working within. What customs, beliefs, or social structures help us understand how the Lord was moving among His people? Help readers see God's providence through the lens of ancient times while honoring the divine inspiration of Scripture.

   **What Might Seem Strange**: Acknowledge elements that modern readers might find unfamiliar or difficult to understand, while affirming that God's Word is perfect and timeless. Pay special attention to passages that may seem challenging to contemporary readers (like laws about slavery, violence, or ancient customs). Gently explain how these difficult passages reveal God's character, His progressive revelation, and His work within the cultural context of the time, helping readers understand the deeper spiritual truths without compromising biblical authority.

   **Key Insights to Watch For**: Point out 2-3 meaningful spiritual themes, divine patterns, or biblical truths that emerge in this chapter. Help readers recognize God's hand at work and understand what the Holy Spirit wants them to discover. Create anticipation for spiritual growth and deeper faith.

   **Why This Matters Today**: Connect the chapter's divine wisdom to contemporary Christian life. What eternal truths, spiritual lessons, or insights about God's character can speak to believers today? Invite personal reflection on how God's Word applies to their walk with Him.

Use warm, reverent language that feels like a faithful pastor or Bible teacher sharing God's truth with love. Be scholarly but deeply respectful of Scripture's divine inspiration. Create genuine spiritual curiosity and hunger for God's Word through faithful exposition and biblical insight.

Chapter: **{book} {chapter}**
"""
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "bible_chapter_intro",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "MainHeading": { "type": "string" },
                            "TimelineInfo": { "type": "string" },
                            "Paras": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": { "type": "string" },
                                        "content": { "type": "string" }
                                    },
                                    "required": ["title", "content"],
                                    "additionalProperties": False
                                },
                                "minItems": 4,
                                "maxItems": 4
                            }
                        },
                        "required": ["MainHeading", "TimelineInfo", "Paras"],
                        "additionalProperties": False
                    }
                }
            }
        }
    )

    data = response.json()
    
    # Extract token usage and calculate cost
    usage = data.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    
    cost_data = calculate_cost(input_tokens, output_tokens)
    
    # Log token usage and cost
    log_token_usage("get_bible_chapter_intro", book, chapter, None, usage, cost_data)
    
    return data["choices"][0]["message"]["content"]

def get_strongs_word(book: str, chapter: int, word: str) -> dict:
    """
    Get comprehensive Strong's dictionary information for a specific word in a Bible chapter.
    Redesigned with clean structure for beautiful frontend interface.
    
    Args:
        book (str): The Bible book name (e.g., "Genesis", "Matthew")
        chapter (int): The chapter number
        word (str): The specific word to analyze
    
    Returns:
        dict: Clean Strong's dictionary data optimized for frontend display
    """
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": f"""
You are a biblical scholar specializing in Strong's Concordance analysis. Analyze the word "{word}" as it appears in {book} {chapter} and provide comprehensive Strong's information structured for a beautiful frontend interface.

**INSTRUCTIONS:**
- Use clear, simple English that anyone can understand
- Structure response for optimal frontend display (think cards and visual sections)
- Focus on the original language richness and biblical depth
- Make it encouraging and help people love God's Word more

Return this structured JSON response:

{{
    "original_language_info": {{
        "strongs_number": "The Strong's number (e.g., H1234 or G5678)",
        "original_language": "Hebrew/Aramaic/Greek",
        "original_script": "The word in original Hebrew/Greek characters",
        "transliteration": "English transliteration (like 'bereshith')",
        "pronunciation": "Simple phonetic pronunciation guide (like 'beh-ray-SHEET')",
        "pronunciation_guide": "Very simple pronunciation helper (like 'sounds like: berry-sheet')"
    }},
    "general_meanings": [
        {{
            "meaning": "Primary/literal meaning of the word",
            "explanation": "Clear explanation of this meaning and its significance",
            "usage_context": "When/how this meaning is typically used"
        }},
        {{
            "meaning": "Secondary meaning",
            "explanation": "Clear explanation of this meaning",
            "usage_context": "Context where this meaning applies"
        }}
        // Include 4-6 different meanings/nuances of the word in its original language
    ],
    "contextual_meaning": {{
        "verse_reference": "{book} {chapter}:verse where the word appears",
        "verse_text": "The complete verse text",
        "word_in_context": "How this specific Strong's word is translated in this verse",
        "contextual_explanation": "What this word means specifically in this verse context",
        "why_this_translation": "Brief explanation of why it was translated this way here",
        "deeper_insight": "What this reveals about the verse's deeper meaning"
    }},
    "biblical_usage_examples": [
        {{
            "verse_reference": "Book Chapter:Verse",
            "verse_text": "Complete verse text",
            "translated_as": "How the Strong's word appears in English here",
            "meaning_used": "Which meaning/nuance of the word is used in this context",
            "significance": "Short explanation of why this usage is significant or meaningful"
        }}
        // Include exactly 7 verses that showcase different meanings and uses of this Strong's number
    ]
}}

Word to analyze: "{word}" in {book} {chapter}

Focus on creating a clean, structured response that will look beautiful in a modern web interface with clear sections and easy-to-read information.
"""
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "redesigned_strongs_analysis",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "original_language_info": {
                                "type": "object",
                                "properties": {
                                    "strongs_number": {"type": "string"},
                                    "original_language": {"type": "string"},
                                    "original_script": {"type": "string"},
                                    "transliteration": {"type": "string"},
                                    "pronunciation": {"type": "string"},
                                    "pronunciation_guide": {"type": "string"}
                                },
                                "required": ["strongs_number", "original_language", "original_script", "transliteration", "pronunciation", "pronunciation_guide"],
                                "additionalProperties": False
                            },
                            "general_meanings": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "meaning": {"type": "string"},
                                        "explanation": {"type": "string"},
                                        "usage_context": {"type": "string"}
                                    },
                                    "required": ["meaning", "explanation", "usage_context"],
                                    "additionalProperties": False
                                },
                                "minItems": 4,
                                "maxItems": 6
                            },
                            "contextual_meaning": {
                                "type": "object",
                                "properties": {
                                    "verse_reference": {"type": "string"},
                                    "verse_text": {"type": "string"},
                                    "word_in_context": {"type": "string"},
                                    "contextual_explanation": {"type": "string"},
                                    "why_this_translation": {"type": "string"},
                                    "deeper_insight": {"type": "string"}
                                },
                                "required": ["verse_reference", "verse_text", "word_in_context", "contextual_explanation", "why_this_translation", "deeper_insight"],
                                "additionalProperties": False
                            },
                            "biblical_usage_examples": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "verse_reference": {"type": "string"},
                                        "verse_text": {"type": "string"},
                                        "translated_as": {"type": "string"},
                                        "meaning_used": {"type": "string"},
                                        "significance": {"type": "string"}
                                    },
                                    "required": ["verse_reference", "verse_text", "translated_as", "meaning_used", "significance"],
                                    "additionalProperties": False
                                },
                                "minItems": 7,
                                "maxItems": 7
                            }
                        },
                        "required": ["original_language_info", "general_meanings", "contextual_meaning", "biblical_usage_examples"],
                        "additionalProperties": False
                    }
                }
            }
        }
    )

    data = response.json()
    
    # Extract token usage and calculate cost
    usage = data.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    
    cost_data = calculate_cost(input_tokens, output_tokens)
    
    # Log token usage and cost
    log_token_usage("get_strongs_word", book, chapter, word, usage, cost_data)
    
    return data["choices"][0]["message"]["content"]