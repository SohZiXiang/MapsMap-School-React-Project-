""" Loads api keys from environment automatically
"""

from dotenv import load_dotenv
import os

load_dotenv()

APIKEY_LTADataMall = os.getenv("APIKEY_LTADataMall")
APIKEY_GOOGLE = os.getenv("APIKEY_GOOGLE")
ONEMAP_API_KEY = os.getenv("APIKEY_ONEMAP")

REDISDB_HOST = os.getenv('REDISDB_HOST')
REDISDB_PASSWORD = os.getenv('REDISDB_PASSWORD')

