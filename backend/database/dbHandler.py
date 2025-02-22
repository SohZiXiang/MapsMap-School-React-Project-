

class DatabaseBaseClass:

    def __init__(self, **kwargs) -> None:
        pass

    def put(self, key: str, value: object):
        raise NotImplementedError("")

    def update(self, obj: object):
        raise NotImplementedError("")

    def get(self, key:str, default = None):
        raise NotImplementedError("")
