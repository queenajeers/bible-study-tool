import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_bible_chapter_intro(book: str, chapter: int) -> dict:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4.1-mini",
            "messages": [
                {
                    "role": "user",
                    "content": f"""
I want you to act like a National Geographic-style expert narrator, and prepare a compelling contextual introduction for a given Bible chapter.

For the given chapter, return the following structured insights:

1. MainHeading: A short, impactful title (5–10 words) that gives a sense of the drama or theme of the chapter.
2. TimelineInfo: Return only an estimated date range (e.g., "1500 BCE – 1200 BCE") for when the events described in this chapter are traditionally or academically believed to have occurred. Base this on credible historical or scholarly sources, and avoid interpretation or commentary — output only the date range.
3. Paras: Return a list of 4 short sections:
   - World Context: In 2 lines, set the scene — what was the world like at that time? What tensions or conditions existed?
   - Mood Setup: Prepare the user mentally and emotionally to dive into this chapter. Use immersive, cinematic narration.
   - Hook Points: Mention 2–3 intriguing events, twists, or lessons in the chapter that create anticipation and curiosity — only if such points exist.
   - Mindset Invitation: Suggest the lens or attitude the reader should have while reading (e.g., “Read with awe at divine patience” or “Watch how power and fear dance together”).

Start with this chapter: **{book} {chapter}**
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
    return data["choices"][0]["message"]["content"]



result = get_bible_chapter_intro("Genesis",1)
print(result)