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
    return data["choices"][0]["message"]["content"]