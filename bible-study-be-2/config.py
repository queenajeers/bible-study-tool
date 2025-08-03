import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    LOG_FILE = "bible_study_usage.log"
    TOKEN_USAGE_LOG = "token_usage_log.txt"