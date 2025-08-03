# services/bible_service.py
import json
from typing import AsyncGenerator, Dict, Any
from openai import OpenAI
from config import Config
from models.schemas import ChapterIntro, StrongsAnalysis
from services.logging_service import LoggingService




class BibleService:
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
        self.logging_service = LoggingService()

    async def get_chapter_intro_stream(self, book: str, chapter: int) -> AsyncGenerator[str, None]:
        """Stream chapter introduction with true incremental streaming."""
        
        messages = [
            {
                "role": "user",
                "content": f"""
You are a faithful biblical scholar and devoted guide helping someone understand the sacred richness of **{book} {chapter}**. Your goal is to provide reverent cultural context and spiritual insights that make God's Word more meaningful and accessible, especially addressing any difficult or challenging passages that modern readers might struggle with, inviting deeper exploration of His truth even in hard-to-understand verses.

Create a warm, faith-affirming introduction that says "Here's what will help God's Word come alive for you in this chapter."

Please structure your response EXACTLY as follows, with clear section markers:

[MAIN_HEADING]
A thoughtful, engaging title (6–10 words) that captures the chapter's essence and addresses any challenging content. If the chapter contains difficult passages, craft a heading that acknowledges the complexity while remaining faith-affirming. Think: "Understanding God's Heart in Hard Passages" or "Ancient Laws, Eternal Love" - informative but pastorally sensitive.
[/MAIN_HEADING]

[TIMELINE_INFO]
The historical period (e.g., "c. 1000–960 BCE") with brief context if helpful.
[/TIMELINE_INFO]

[CULTURAL_CONTEXT]
Explain the historical and cultural backdrop that God was working within. What customs, beliefs, or social structures help us understand how the Lord was moving among His people? Help readers see God's providence through the lens of ancient times while honoring the divine inspiration of Scripture.
[/CULTURAL_CONTEXT]

[WHAT_MIGHT_SEEM_STRANGE]
Acknowledge elements that modern readers might find unfamiliar or difficult to understand, while affirming that God's Word is perfect and timeless. Pay special attention to passages that may seem challenging to contemporary readers (like laws about slavery, violence, or ancient customs). Gently explain how these difficult passages reveal God's character, His progressive revelation, and His work within the cultural context of the time, helping readers understand the deeper spiritual truths without compromising biblical authority.
[/WHAT_MIGHT_SEEM_STRANGE]

[KEY_INSIGHTS]
Point out 2-3 meaningful spiritual themes, divine patterns, or biblical truths that emerge in this chapter. Help readers recognize God's hand at work and understand what the Holy Spirit wants them to discover. Create anticipation for spiritual growth and deeper faith.
[/KEY_INSIGHTS]

[WHY_THIS_MATTERS_TODAY]
Connect the chapter's divine wisdom to contemporary Christian life. What eternal truths, spiritual lessons, or insights about God's character can speak to believers today? Invite personal reflection on how God's Word applies to their walk with Him.
[/WHY_THIS_MATTERS_TODAY]

Use warm, reverent language that feels like a faithful pastor or Bible teacher sharing God's truth with love. Be scholarly but deeply respectful of Scripture's divine inspiration. Create genuine spiritual curiosity and hunger for God's Word through faithful exposition and biblical insight.

Chapter: **{book} {chapter}**
"""
            }
        ]

        try:
            # Create streaming response WITHOUT structured output
            stream = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True
            )

            accumulated_content = ""
            usage_data = {}
            current_section = None
            sections_data = {
                "MainHeading": "",
                "TimelineInfo": "",
                "Paras": []
            }

            # Track what we've already sent to avoid duplicates
            sent_content = {
                "MainHeading": "",
                "TimelineInfo": "",
                "CulturalContext": "",
                "WhatMightSeemStrange": "",
                "KeyInsights": "",
                "WhyThisMattersToday": ""
            }

            # Process the streaming response
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content_chunk = chunk.choices[0].delta.content
                    accumulated_content += content_chunk
                    
                    # Parse sections as they come in
                    parsed_sections = self._parse_streaming_sections(accumulated_content)
                    
                    # Check if we have new content to stream
                    for section_name, content in parsed_sections.items():
                        if section_name not in ['MainHeading', 'TimelineInfo'] and content:
                            # This is a paragraph section, stream only the new part
                            previous_length = len(sent_content.get(section_name, ""))
                            if len(content) > previous_length:
                                new_content = content[previous_length:]

                                # Avoid streaming any part of content that still includes section markers
                                if "[" in new_content or "]" in new_content:
                                    continue  # Wait for a cleaner version

                                # New content available
                                sent_content[section_name] = content
                                
                                yield f"data: {json.dumps({'type': 'section_update', 'section': section_name, 'content': new_content, 'is_complete': False})}\n\n"
                        
                        elif section_name in ['MainHeading', 'TimelineInfo'] and content and content != sent_content.get(section_name, ""):
                            # Update header sections only if they've changed
                            sent_content[section_name] = content
                            sections_data[section_name] = content
                            yield f"data: {json.dumps({'type': 'header_update', 'section': section_name, 'content': content})}\n\n"

                # Capture usage data from the final chunk
                if hasattr(chunk, 'usage') and chunk.usage:
                    usage_data = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens
                    }

            # Final processing
            final_sections = self._parse_streaming_sections(accumulated_content)
            
            # Build final structured data
            sections_data["MainHeading"] = final_sections.get("MainHeading", "")
            sections_data["TimelineInfo"] = final_sections.get("TimelineInfo", "")
            sections_data["Paras"] = []
            
            for section_name in ["CulturalContext", "WhatMightSeemStrange", "KeyInsights", "WhyThisMattersToday"]:
                if section_name in final_sections and final_sections[section_name]:
                    sections_data["Paras"].append({
                        "title": self._section_name_to_title(section_name),
                        "content": final_sections[section_name]
                    })

            # Validate the complete response
            try:
                validated_intro = ChapterIntro(**sections_data)
                
                # Log usage if available
                if usage_data:
                    cost_data = self.logging_service.calculate_cost(
                        usage_data.get("prompt_tokens", 0),
                        usage_data.get("completion_tokens", 0)
                    )
                    self.logging_service.log_token_usage(
                        "get_chapter_intro_stream", book, chapter, None, usage_data, cost_data
                    )

                # Send completion signal with validated data
                yield f"data: {json.dumps({'type': 'complete', 'data': validated_intro.model_dump()})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Validation error: {str(e)}'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'API error: {str(e)}'})}\n\n"

    def _parse_streaming_sections(self, content: str) -> Dict[str, str]:
        """Parse sections from streaming content using markers."""
        sections = {}
        
        # Define section patterns - more precise regex
        patterns = {
            "MainHeading": r'\[MAIN_HEADING\]\s*(.*?)\s*(?:\[/MAIN_HEADING\]|$)',
            "TimelineInfo": r'\[TIMELINE_INFO\]\s*(.*?)\s*(?:\[/TIMELINE_INFO\]|$)',
            "CulturalContext": r'\[CULTURAL_CONTEXT\]\s*(.*?)(?:\s*\[(?:WHAT_MIGHT_SEEM_STRANGE|KEY_INSIGHTS|WHY_THIS_MATTERS_TODAY|/CULTURAL_CONTEXT\])|$)',
            "WhatMightSeemStrange": r'\[WHAT_MIGHT_SEEM_STRANGE\]\s*(.*?)(?:\s*\[(?:KEY_INSIGHTS|WHY_THIS_MATTERS_TODAY|/WHAT_MIGHT_SEEM_STRANGE\])|$)',
            "KeyInsights": r'\[KEY_INSIGHTS\]\s*(.*?)(?:\s*\[(?:WHY_THIS_MATTERS_TODAY|/KEY_INSIGHTS\])|$)',
            "WhyThisMattersToday": r'\[WHY_THIS_MATTERS_TODAY\]\s*(.*?)(?:\s*\[/WHY_THIS_MATTERS_TODAY\]|$)'
        }
        
        import re
        
        for section_name, pattern in patterns.items():
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            if match:
                section_content = match.group(1).strip()
                # Only include non-empty content
                if section_content:
                    sections[section_name] = section_content
        
        return sections

    

    def _section_name_to_title(self, section_name: str) -> str:
        """Convert section name to display title."""
        mapping = {
            "CulturalContext": "Cultural Context",
            "WhatMightSeemStrange": "What Might Seem Strange",
            "KeyInsights": "Key Insights to Watch For",
            "WhyThisMattersToday": "Why This Matters Today"
        }
        return mapping.get(section_name, section_name)

    async def get_strongs_analysis_stream(self, book: str, chapter: int, word: str) -> AsyncGenerator[str, None]:
        """Stream Strong's analysis with structured output."""
        
        messages = [
            {
                "role": "user",
                "content": f"""
You are a biblical scholar specializing in Strong's Concordance analysis. Analyze the word "{word}" as it appears in {book} {chapter} and provide comprehensive Strong's information structured for a beautiful frontend interface.

**INSTRUCTIONS:**
- Use clear, simple English that anyone can understand
- Structure response for optimal frontend display (think cards and visual sections)
- Focus on the original language richness and biblical depth
- Make it encouraging and help people love God's Word more

Return this structured JSON response with the exact schema provided.

Word to analyze: "{word}" in {book} {chapter}

Focus on creating a clean, structured response that will look beautiful in a modern web interface with clear sections and easy-to-read information.
"""
            }
        ]

        try:
            # Create streaming response
            stream = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "strongs_analysis",
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
                },
                stream=True
            )

            accumulated_content = ""
            usage_data = {}

            # Process the streaming response correctly
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content_chunk = chunk.choices[0].delta.content
                    accumulated_content += content_chunk
                    
                    # Yield the chunk for real-time streaming
                    yield f"data: {json.dumps({'type': 'content', 'data': content_chunk})}\n\n"

                # Capture usage data from the final chunk
                if hasattr(chunk, 'usage') and chunk.usage:
                    usage_data = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens
                    }

            # Parse and validate the complete response
            try:
                parsed_content = json.loads(accumulated_content)
                validated_analysis = StrongsAnalysis(**parsed_content)
                
                # Log usage if available
                if usage_data:
                    cost_data = self.logging_service.calculate_cost(
                        usage_data.get("prompt_tokens", 0),
                        usage_data.get("completion_tokens", 0)
                    )
                    self.logging_service.log_token_usage(
                        "get_strongs_analysis_stream", book, chapter, word, usage_data, cost_data
                    )

                # Send completion signal with validated data
                yield f"data: {json.dumps({'type': 'complete', 'data': validated_analysis.model_dump()})}\n\n"
                
            except json.JSONDecodeError as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'JSON parsing error: {str(e)}'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Validation error: {str(e)}'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'API error: {str(e)}'})}\n\n"


