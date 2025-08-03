import json
import logging
from datetime import datetime
from config import Config
from models.schemas import LogEntry, TokenUsage, CostData

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Config.LOG_FILE),
        logging.StreamHandler()
    ]
)

class LoggingService:
    @staticmethod
    def calculate_cost(input_tokens: int, output_tokens: int) -> CostData:
        """
        Calculate cost based on OpenAI pricing:
        gpt-4o: $2.50/M input tokens, $10/M output tokens
        gpt-4o-mini: $0.15/M input tokens, $0.60/M output tokens
        """
        # Using gpt-4o-mini pricing as default
        input_cost = (input_tokens / 1_000_000) * 0.15
        output_cost = (output_tokens / 1_000_000) * 0.60
        total_cost = input_cost + output_cost
        
        return CostData(
            input_cost_usd=round(input_cost, 6),
            output_cost_usd=round(output_cost, 6),
            total_cost_usd=round(total_cost, 6)
        )

    @staticmethod
    def log_token_usage(function_name: str, book: str, chapter: int, word: str, 
                       token_data: dict, cost_data: CostData):
        """Log token usage and cost information."""
        token_usage = TokenUsage(
            input_tokens=token_data.get("prompt_tokens", 0),
            output_tokens=token_data.get("completion_tokens", 0),
            total_tokens=token_data.get("total_tokens", 0)
        )
        
        log_entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            function=function_name,
            book=book,
            chapter=chapter,
            word=word,
            tokens=token_usage,
            cost=cost_data
        )
        
        # Log to file
        try:
            with open(Config.TOKEN_USAGE_LOG, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry.model_dump(), indent=2) + '\n' + '-'*50 + '\n')
        except Exception as e:
            logging.error(f"Failed to write to log file: {e}")
        
        # Also log to console
        logging.info(f"{function_name} - Tokens: {token_usage.total_tokens} | Cost: ${cost_data.total_cost_usd:.6f}")