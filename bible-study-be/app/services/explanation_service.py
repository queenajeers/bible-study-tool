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

# Set up logging configuration

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

def get_strongs_word(book: str, chapter: int, word: str) -> dict:
    """
    Get comprehensive Strong's dictionary information for a specific word in a Bible chapter.
    
    Args:
        book (str): The Bible book name (e.g., "Genesis", "Matthew")
        chapter (int): The chapter number
        word (str): The specific word to analyze
    
    Returns:
        dict: Comprehensive Strong's dictionary data optimized for frontend display
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
You are a biblical scholar who explains Bible words in simple, clear English. Your goal is to help everyday Bible readers understand God's Word better by showing them the rich meaning behind the original Hebrew/Greek words.

Analyze the word "{word}" as it appears in {book} {chapter} and provide comprehensive Strong's information that will be displayed in a user-friendly frontend interface.

**CRITICAL INSTRUCTIONS:**
- Use simple, everyday English that anyone can understand
- Structure your response for optimal frontend display - think cards, highlights, and visual sections
- Help users see the full richness of the original word
- Make it encouraging and help people fall in love with God's Word
- Find the exact verse in {book} {chapter} where "{word}" appears

Return this structured JSON response:

{{
    "word_analysis": {{
        "english_word": "The English word being analyzed",
        "strongs_number": "The Strong's number (e.g., H1234 or G5678)",
        "original_language": "Hebrew/Aramaic/Greek"
    }},
    "original_word": {{
        "original_script": "The word in original Hebrew/Greek characters",
        "transliteration": "English transliteration (like 'bereshith')",
        "pronunciation": "Simple phonetic pronunciation guide (like 'beh-ray-SHEET')",
        "pronunciation_audio_guide": "Very simple pronunciation like you'd tell a friend (like 'sounds like: berry-sheet')"
    }},
    "word_meanings": [
        {{
            "meaning": "First main meaning/definition",
            "explanation": "Simple 1-sentence explanation of this meaning",
            "usage_type": "literal/figurative/metaphorical"
        }},
        {{
            "meaning": "Second meaning/definition/synonym",
            "explanation": "Simple 1-sentence explanation",
            "usage_type": "literal/figurative/metaphorical"
        }}
        // Include 5-8 different meanings/definitions/synonyms
    ],
    "verse_with_deeper_meaning": {{
        "original_verse": "The exact verse from {book} {chapter} where '{word}' appears",
        "enhanced_reading": "The same verse but with the original word's richer meaning highlighted - make it clear which part should be highlighted for frontend",
        "highlight_instruction": "Specific instruction for frontend on what to highlight (e.g., 'highlight: In the beginning' and replace with 'In the supreme start/origin')",
        "meaning_explanation": "Simple explanation of why this deeper reading is more meaningful",
        "figurative_note": "If applicable, note if this is figurative language and what it represents"
    }},
    "related_verses": [
        {{
            "verse_reference": "Book Chapter:Verse",
            "verse_text": "The actual verse text",
            "strongs_word_used": "How this same Strong's number appears in English here (might be translated differently)",
            "highlight_instruction": "What word/phrase to highlight in this verse for frontend",
            "context_usage": "Simple explanation: 'In this context, the word means...'",
            "connection_insight": "How this usage connects back to and enriches the original verse in {book} {chapter}"
        }}
        // Include 8-12 most relevant cross-references showing different translations of same Strong's number
    ],
    "practical_application": {{
        "what_this_means_for_you": "Personal, relatable explanation of what this word means for daily Christian life",
        "what_this_teaches_us": "What this word teaches us about God's character or spiritual truths",
        "historical_context": "Simple explanation of the cultural/historical background that helps understand the word",
        "how_to_apply_today": "Practical ways to apply this deeper understanding in modern Christian living"
    }},
    "final_thoughts": {{
        "word_summary": "A rich summary of what makes this word special and meaningful",
        "encouragement": "An encouraging sentence about how understanding this word enhances Bible reading and faith",
        "key_takeaway": "One simple sentence the user should remember about this word"
    }}
}}

Word to analyze: "{word}" in {book} {chapter}

Remember: Structure this for a beautiful, intuitive frontend where users can easily absorb the information without struggling with the UI. Think visual cards, highlighted text, and clear sections that flow naturally.
"""
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "enhanced_strongs_analysis",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "word_analysis": {
                                "type": "object",
                                "properties": {
                                    "english_word": {"type": "string"},
                                    "strongs_number": {"type": "string"},
                                    "original_language": {"type": "string"}
                                },
                                "required": ["english_word", "strongs_number", "original_language"],
                                "additionalProperties": False
                            },
                            "original_word": {
                                "type": "object",
                                "properties": {
                                    "original_script": {"type": "string"},
                                    "transliteration": {"type": "string"},
                                    "pronunciation": {"type": "string"},
                                    "pronunciation_audio_guide": {"type": "string"}
                                },
                                "required": ["original_script", "transliteration", "pronunciation", "pronunciation_audio_guide"],
                                "additionalProperties": False
                            },
                            "word_meanings": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "meaning": {"type": "string"},
                                        "explanation": {"type": "string"},
                                        "usage_type": {"type": "string"}
                                    },
                                    "required": ["meaning", "explanation", "usage_type"],
                                    "additionalProperties": False
                                },
                                "minItems": 5,
                                "maxItems": 8
                            },
                            "verse_with_deeper_meaning": {
                                "type": "object",
                                "properties": {
                                    "original_verse": {"type": "string"},
                                    "enhanced_reading": {"type": "string"},
                                    "highlight_instruction": {"type": "string"},
                                    "meaning_explanation": {"type": "string"},
                                    "figurative_note": {"type": "string"}
                                },
                                "required": ["original_verse", "enhanced_reading", "highlight_instruction", "meaning_explanation", "figurative_note"],
                                "additionalProperties": False
                            },
                            "related_verses": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "verse_reference": {"type": "string"},
                                        "verse_text": {"type": "string"},
                                        "strongs_word_used": {"type": "string"},
                                        "highlight_instruction": {"type": "string"},
                                        "context_usage": {"type": "string"},
                                        "connection_insight": {"type": "string"}
                                    },
                                    "required": ["verse_reference", "verse_text", "strongs_word_used", "highlight_instruction", "context_usage", "connection_insight"],
                                    "additionalProperties": False
                                },
                                "minItems": 8,
                                "maxItems": 12
                            },
                            "practical_application": {
                                "type": "object",
                                "properties": {
                                    "what_this_means_for_you": {"type": "string"},
                                    "what_this_teaches_us": {"type": "string"},
                                    "historical_context": {"type": "string"},
                                    "how_to_apply_today": {"type": "string"}
                                },
                                "required": ["what_this_means_for_you", "what_this_teaches_us", "historical_context", "how_to_apply_today"],
                                "additionalProperties": False
                            },
                            "final_thoughts": {
                                "type": "object",
                                "properties": {
                                    "word_summary": {"type": "string"},
                                    "encouragement": {"type": "string"},
                                    "key_takeaway": {"type": "string"}
                                },
                                "required": ["word_summary", "encouragement", "key_takeaway"],
                                "additionalProperties": False
                            }
                        },
                        "required": ["word_analysis", "original_word", "word_meanings", "verse_with_deeper_meaning", "related_verses", "practical_application", "final_thoughts"],
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