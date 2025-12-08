"""RAG service for auto-suggesting answers using LangChain + Groq."""

import logging
from typing import Optional

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


async def get_suggested_answer(
    question_message: str,
    previous_answers: list[str],
    context: Optional[str] = None,
) -> Optional[str]:
    """
    Generate a suggested answer using LangChain and Groq API.
    
    Args:
        question_message: The question to answer
        previous_answers: List of previous answers for context
        context: Optional additional context
    
    Returns:
        Suggested answer string or None if failed
    """
    if not settings.GROQ_API_KEY:
        logger.info("GROQ_API_KEY not configured, skipping RAG suggestion")
        return None

    try:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_groq import ChatGroq

        # Initialize Groq LLM
        llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name="llama-3.1-70b-versatile",
            temperature=0.7,
            max_tokens=500,
        )

        # Build context from previous answers
        answers_context = ""
        if previous_answers:
            answers_context = "\n\nPrevious answers in the system:\n" + "\n".join(
                f"- {ans[:200]}" for ans in previous_answers[:5]
            )

        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are a helpful Q&A assistant for QuerySync AI, a real-time Q&A dashboard.
Your task is to provide clear, concise, and helpful answers to user questions.
Keep your responses professional and to the point.
If you're unsure about something, acknowledge it rather than making things up."""
            ),
            (
                "human",
                """Question: {question}
{context}

Please provide a helpful answer to this question:"""
            ),
        ])

        # Generate response
        chain = prompt | llm
        response = await chain.ainvoke({
            "question": question_message,
            "context": answers_context + (f"\n\nAdditional context: {context}" if context else ""),
        })

        suggested = response.content.strip()
        logger.info(f"Generated RAG suggestion for question: {question_message[:50]}...")
        return suggested

    except ImportError as e:
        logger.error(f"LangChain/Groq not properly installed: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate RAG suggestion: {e}")
        return None
