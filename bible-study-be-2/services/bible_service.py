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
You are a faithful Bible teacher who loves helping people understand God’s Word. Your goal is to help someone explore the rich meaning of **{book} {chapter}** in a simple, clear, and respectful way. Use warm, loving language like a kind pastor or guide. Focus on helping the reader feel the setting, understand what’s happening, and discover what God is showing through this chapter.

Please follow the exact format below, keeping all the section markers.  

Use **simple English** that anyone can understand.  

Your writing should also include:  
- **Setting** – Where are we? What does it feel like to be there?  
- **Foreshadowing** – Does anything hint at what’s coming later in the Bible?  
- **Mood & Atmosphere** – What’s the emotional tone? Tense? Joyful? Heavy?  
- **Sensory Details** – What might people have seen, smelled, heard, touched, or tasted? Help the reader imagine the world of the Bible.  

In the section on difficult verses, gently explain what’s hard to understand but always show how God is good and His Word is trustworthy.

In the timeline section, only give the **date range** like "c. 1440–1400 BCE" — no extra explanation.

---

Format to follow:

[MAIN_HEADING]  
A short, inviting title (6–10 words) that captures the heart of the chapter. If the chapter has hard parts, use a heading that helps the reader stay hopeful and curious, like "God's Love in Tough Commands" or "Finding Grace in Ancient Laws."  
[/MAIN_HEADING]  

[TIMELINE_INFO]  
Just the historical date range (like: "c. 1440–1400 BCE")  
[/TIMELINE_INFO]  

[CULTURAL_CONTEXT]  
Describe the world and culture of that time. What were people’s lives like? What kind of society did they live in? How does this help us understand what’s happening in the chapter? Share sights, sounds, and other sensory details that bring it to life. Help us see how God was working in that time and place.  

[/CULTURAL_CONTEXT]  

[WHAT_MIGHT_SEEM_STRANGE]  
Talk about anything that feels odd, harsh, or confusing to today’s readers. This might include ancient customs, laws, or violence. Gently explain why those parts are there, how they made sense in that time, and what they show us about God's patience, justice, or love. Show that even hard verses have a purpose in God’s bigger story.  

[/WHAT_MIGHT_SEEM_STRANGE]  

[KEY_INSIGHTS]  
Point out 2–3 big spiritual truths or lessons that stand out in the chapter. What does this show us about God’s heart, His plan, or how He helps people? Include anything that points ahead to Jesus or the New Testament. Make the reader feel excited to know God more.  

[/KEY_INSIGHTS]  

[WHY_THIS_MATTERS_TODAY]  
Connect this chapter to our lives now. How does it help us trust God more, love others better, or live faithfully? Give one or two takeaways that help believers walk with God today. End with an invitation to reflect or pray.  

[/WHY_THIS_MATTERS_TODAY]  
"""
            }
        ]

        try:
            # Create streaming response WITHOUT structured output
            stream = self.client.chat.completions.create(
                model="gpt-4.1-2025-04-14",
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

    [ROOT_MEANINGS]
    Provide a comprehensive list of ALL the synonyms and root meanings for this Strong's number, formatted as a pipe-separated list. Include 8-12 different synonyms/meanings that capture the full semantic range of this word. For example: "love|affection|devotion|care|cherish|treasure|esteem|value|adore|embrace|favor|compassion". Focus on providing distinct but related meanings that show the word's richness.
    [/ROOT_MEANINGS]

    [CONTEXTUAL_MEANING]
    For this specific verse ({book} {chapter}:{verse}), provide:

    **Best-fit meaning:** [Select the most appropriate synonym from your Root Meanings list above]

    **Full verse text:** [Provide the complete verse text from {book} {chapter}:{verse} with the word "{word}" written in ALL CAPITALS for highlighting]

    **Rewritten verse:** [Provide the same complete verse text, but replace the word "{word}" with your selected best-fit meaning in parentheses, like "LOVED (cherished)"]

    **Context commentary:** [In 2-3 sentences, explain why this particular meaning fits best in this specific context and what it reveals about the passage's meaning]
    [/CONTEXTUAL_MEANING]

    [OTHER_USES]
    Provide 6-8 other significant biblical verses where this exact Strong's number appears. For each, format as:

    **Reference:** [Book Chapter:Verse]
    **Full Verse:** [Complete verse text with the translated word in CAPITALS]
    **Sense Used:** [Brief explanation of how the word functions in this context]
    **Best Synonym:** [Which synonym from the Root Meanings list fits best here]

    Example format:
    **Reference:** John 3:16
    **Full Verse:** For God so LOVED the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.
    **Sense Used:** Describes God's deep, sacrificial affection for humanity
    **Best Synonym:** cherish

    Ensure each example shows a different nuance or usage of the word across Scripture.
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
                model="gpt-4.1-2025-04-14",
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
                "RootMeanings": "",
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
                "RootMeanings": final_sections.get("RootMeanings", ""),
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
            "RootMeanings": r'\[ROOT_MEANINGS\]\s*(.*?)(?:\s*\[(?:CONTEXTUAL_MEANING|OTHER_USES|CULTURAL_SIGNIFICANCE|/ROOT_MEANINGS\])|$)',
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