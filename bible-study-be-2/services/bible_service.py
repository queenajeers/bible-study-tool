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
    
    # Add this method to your BibleService class

    # Add this method to your BibleService class

    # Add this method to your BibleService class

    async def get_strongs_analysis_stream(self, book: str, chapter: int, verse: int, word: str) -> AsyncGenerator[str, None]:
        """Stream Strong's word analysis with true incremental streaming."""
        
        messages = [
            {
                "role": "user",
                "content": f"""
    You are a biblical scholar and linguist providing comprehensive analysis of the word "{word}" as it appears in {book} {chapter}:{verse}. 

    First, identify the correct Strong's number for the word "{word}" in this specific verse context. Then provide thorough, academic yet accessible insights into this biblical word and its Strong's number.

    Please structure your response EXACTLY as follows, with clear section markers:

    [WORD_HEADER]
    The English word this Strong's number represents in the given verse, followed by a pipe separator, then the Strong's number (e.g., "love|G25"). Only include the primary English word used in this specific verse.
    [/WORD_HEADER]

    [LANGUAGE_INFO]
    The original language (Hebrew, Greek, Aramaic) this word comes from.
    [/LANGUAGE_INFO]

    [ORIGINAL_TEXT]
    The original language text/spelling of this word exactly as it appears in ancient manuscripts.
    [/ORIGINAL_TEXT]

    [PRONUNCIATION]
    The phonetic pronunciation guide for this word (e.g., "ah-gap-ah'-o").
    [/PRONUNCIATION]

    [LITERAL_MEANING]
    The core, literal meaning(s) of this word in its original language, independent of any specific biblical context. Include root meanings, etymology if relevant, and fundamental definitions. This should be 2-3 sentences focusing on the word's basic semantic range.
    [/LITERAL_MEANING]

    [CONTEXTUAL_MEANING]
    How this specific Strong's word is used and what it means specifically in {book} {chapter}:{verse}. Explain the particular nuance, theological significance, or contextual application in this verse. Focus on why this specific word was chosen by the biblical author in this context. This should be 2-3 sentences.
    [/CONTEXTUAL_MEANING]

    [OTHER_USES]
    List 7-10 other significant biblical verses where this exact Strong's number appears, showing how it was translated in each case. Format each entry as: "Reference|English Translation|Brief Context". For example: "John 3:16|loved|God's love for the world" or "1 Corinthians 13:4|love|description of love's characteristics". Include diverse examples showing the word's range of meaning and usage patterns across Scripture.
    [/OTHER_USES]

    [CULTURAL_SIGNIFICANCE]
    Explain the cultural, historical, and theological significance of this word in biblical times and its importance for understanding Scripture. Discuss how ancient audiences would have understood this word, any cultural nuances, and why it matters for biblical interpretation today. This should be 3-4 sentences providing rich cultural context.
    [/CULTURAL_SIGNIFICANCE]

    Word to analyze: "{word}"
    Reference: {book} {chapter}:{verse}

    Provide scholarly analysis that helps readers understand both the linguistic precision and spiritual depth of God's Word through careful word study.
    """
            }
        ]

        try:
            # Create streaming response
            stream = self.client.chat.completions.create(
                model="gpt-4.1",
                messages=messages,
                stream=True
            )

            accumulated_content = ""
            usage_data = {}
            
            # Track what we've already sent to avoid duplicates
            sent_content = {
                "WordHeader": "",
                "LanguageInfo": "",
                "OriginalText": "",
                "Pronunciation": "",
                "LiteralMeaning": "",
                "ContextualMeaning": "",
                "OtherUses": "",
                "CulturalSignificance": ""
            }

            # Process the streaming response
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content_chunk = chunk.choices[0].delta.content
                    accumulated_content += content_chunk
                    
                    # Parse sections as they come in
                    parsed_sections = self._parse_strongs_streaming_sections(accumulated_content)
                    
                    # Check if we have new content to stream
                    for section_name, content in parsed_sections.items():
                        if content and content != sent_content.get(section_name, ""):
                            # Calculate new content
                            previous_length = len(sent_content.get(section_name, ""))
                            if len(content) > previous_length:
                                new_content = content[previous_length:]

                                # Avoid streaming any part of content that still includes section markers
                                if "[" in new_content or "]" in new_content:
                                    continue  # Wait for a cleaner version

                                # Update sent content and stream the new part
                                sent_content[section_name] = content
                                
                                yield f"data: {json.dumps({'type': 'section_update', 'section': section_name, 'content': new_content, 'is_complete': False})}\n\n"

                # Capture usage data from the final chunk
                if hasattr(chunk, 'usage') and chunk.usage:
                    usage_data = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens
                    }

            # Final processing
            final_sections = self._parse_strongs_streaming_sections(accumulated_content)
            
            # Build final structured data
            sections_data = {
                "WordHeader": final_sections.get("WordHeader", ""),
                "LanguageInfo": final_sections.get("LanguageInfo", ""),
                "OriginalText": final_sections.get("OriginalText", ""),
                "Pronunciation": final_sections.get("Pronunciation", ""),
                "LiteralMeaning": final_sections.get("LiteralMeaning", ""),
                "ContextualMeaning": final_sections.get("ContextualMeaning", ""),
                "OtherUses": final_sections.get("OtherUses", ""),
                "CulturalSignificance": final_sections.get("CulturalSignificance", "")
            }

            # Validate the complete response
            try:
                validated_analysis = StrongsAnalysis(**sections_data)
                
                # Log usage if available
                if usage_data:
                    cost_data = self.logging_service.calculate_cost(
                        usage_data.get("prompt_tokens", 0),
                        usage_data.get("completion_tokens", 0)
                    )
                    self.logging_service.log_token_usage(
                        "get_strongs_analysis_stream", book, chapter, verse, usage_data, cost_data
                    )

                # Send completion signal with validated data
                yield f"data: {json.dumps({'type': 'complete', 'data': validated_analysis.model_dump()})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Validation error: {str(e)}'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'API error: {str(e)}'})}\n\n"

    def _parse_strongs_streaming_sections(self, content: str) -> Dict[str, str]:
        """Parse Strong's analysis sections from streaming content using markers."""
        sections = {}
        
        # Define section patterns for Strong's analysis
        patterns = {
            "WordHeader": r'\[WORD_HEADER\]\s*(.*?)\s*(?:\[/WORD_HEADER\]|$)',
            "LanguageInfo": r'\[LANGUAGE_INFO\]\s*(.*?)\s*(?:\[/LANGUAGE_INFO\]|$)',
            "OriginalText": r'\[ORIGINAL_TEXT\]\s*(.*?)\s*(?:\[/ORIGINAL_TEXT\]|$)',
            "Pronunciation": r'\[PRONUNCIATION\]\s*(.*?)\s*(?:\[/PRONUNCIATION\]|$)',
            "LiteralMeaning": r'\[LITERAL_MEANING\]\s*(.*?)(?:\s*\[(?:CONTEXTUAL_MEANING|OTHER_USES|CULTURAL_SIGNIFICANCE|/LITERAL_MEANING\])|$)',
            "ContextualMeaning": r'\[CONTEXTUAL_MEANING\]\s*(.*?)(?:\s*\[(?:OTHER_USES|CULTURAL_SIGNIFICANCE|/CONTEXTUAL_MEANING\])|$)',
            "OtherUses": r'\[OTHER_USES\]\s*(.*?)(?:\s*\[(?:CULTURAL_SIGNIFICANCE|/OTHER_USES\])|$)',
            "CulturalSignificance": r'\[CULTURAL_SIGNIFICANCE\]\s*(.*?)(?:\s*\[/CULTURAL_SIGNIFICANCE\]|$)'
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