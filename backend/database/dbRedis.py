import redis
import json

from . import dbHandler

from apis import apiKeys


class RedisAsDatabase(dbHandler.DatabaseBaseClass):

    redisClient: redis.Redis = None

    @staticmethod
    def _connect_to_redisClient(self):
        if self.redisClient is None:
            self.redisClient = redis.Redis(host=apiKeys.REDISDB_HOST, port=16449, password=apiKeys.REDISDB_PASSWORD)

    def __init__(self):
        pass

    def put(self, hashing_repr: str, key: str, value: object):
        redisKey = f"{hashing_repr}-{key}"
        self.redisClient.hset(redisKey, mapping=value)

    def update(self, obj: object):
        pass

    def get(self, hashing_repr: str, key:str, default = None):
        redisKey = f"{hashing_repr}-{key}"
        return self.redisClient.get(redisKey)
