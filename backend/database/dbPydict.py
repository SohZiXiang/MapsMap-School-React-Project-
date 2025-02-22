from . import dbHandler


class DictAsDatabase(dbHandler.DatabaseBaseClass):

    processDatum: dict = {}
        
    def __init__(self) -> None:
        pass

    def put(self, key: str, value: object):
        self.processDatum[key] = value

    def update(self, obj: object):
        self.processDatum.update(obj)

    def get(self, key:str, default = None):
        return self.processDatum.get(key, default)
