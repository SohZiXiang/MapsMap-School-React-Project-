
import logging
logger = logging.getLogger('uvicorn.error')

import requests
import datetime
from enum import Enum

import redis
import json

redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)


class ApiException(Exception):
    """ Base Api Exception
    
    adds name of exception (if inherited from this class) in message
    """
    def __init__(self, message):            
        super().__init__(f"{type(self).__name__}: {message}")

class ApiFetchException(ApiException):
    """ Exception when fetching api
    """
    def __init__(self, message):
        super().__init__(message)

class ApiProcessException(ApiException):
    """ Exception when processing data from api
    """
    def __init__(self, message):
        super().__init__(message)

class ApiDatumAlreadyFetchedException(ApiException):
    """ Exception raised when data from api which is dynamic is retrieved by program more than once

    This is to ensure user programs fetches latest data when calling dynamic data.
    """
    def __init__(self, message):
        super().__init__(message)

class ApiTestFailException(ApiException):
    """ Exception when api testing fails
    """
    def __init__(self, message):
        super().__init__(message)


class apiUpdateType():
    days=0
    seconds=0
    microseconds=0
    milliseconds=0
    minutes=0
    hours=0
    weeks=0
    api_timedelta: datetime.timedelta

    __doc__ = \
    """ struct to store timedelta data
    calculate the new time delta
    """

    def __init__(self, days=0, seconds=0, microseconds=0, milliseconds=0, minutes=0, hours=0, weeks=0):
        self.days = days
        self.seconds = seconds
        self.microseconds = microseconds
        self.milliseconds = milliseconds
        self.minutes = minutes
        self.hours = hours
        self.weeks = weeks

        # set time delta of api
        self.api_timedelta = datetime.timedelta(
            days=self.days, seconds=self.seconds, microseconds=self.microseconds,
            milliseconds=self.milliseconds, minutes=self.minutes, hours=self.hours, weeks=self.weeks
            )

    def getValidTill(self) -> datetime.datetime:
        """ calculate and return valid till datetime

            Returns:
                datetime.datetime the timedelta of now() self.api_timedelta
        """

        return (datetime.datetime.now() + self.api_timedelta)
    
    def expiryInWords(self):
        """ represents timedelta in string

        Returns:
            str: representation of timedelta
        """

        ret = ""        
        if self.weeks:
            ret += f"{self.weeks} week(s) "
        if self.days:
            ret += f"{self.days} day(s) "
        if self.hours:
            ret += f"{self.hours} hour(s) "
        if self.minutes:
            ret += f"{self.minutes} minute(s) "
        if self.seconds:
            ret += f"{self.seconds} second(s) "
        if self.milliseconds:
            ret += f"{self.milliseconds} millisecond(s) "
        if self.microseconds:
            ret += f"{self.microseconds} microsecond(s) "
        return ret
    
    def __str__(self) -> str:
        return self.expiryInWords()


class apiTypeType(Enum):
    INCONSISTENT = 0               # data from api are metadata, unlikely to change (ie. landmarks)
    CONSISTENT = 1                 # data from api changes regulary


class ApiClass:
    apiUrl: str
    apiUpdate: apiUpdateType = apiUpdateType()
    apiType: apiTypeType = apiTypeType.CONSISTENT
    last_updated: datetime.datetime = None
    valid_till: datetime.datetime = datetime.datetime.now()
    
    response: requests.Response
    processedDatum = {}
    dataUsed: bool = 0
    datumIdent: int = 0             # data id, in sequence, used to know which fetch

    def __repr__(self) -> str:
        return self.__class__.__name__

    def __init__(self) -> None:
        pass

    def getDatum(self):
        """ getter function for processed datum

        ensures dynamic data is only fetched once by the user program
        """

        if self.dataUsed and (self.apiType == apiTypeType.INCONSISTENT):
            raise ApiDatumAlreadyFetchedException("trying to re-use datum that is one-use")
        if (self.apiType == apiTypeType.INCONSISTENT):
            self.dataUsed = 1

            

        return self.processedDatum

    def fetch(self, **kwargs):
        """ fetch from api
        
        api is called and put into response; iff: consistent data has expired
        """

        if (datetime.datetime.now() > self.valid_till):
            self.response = requests.get(self.apiUrl, **kwargs)
            self.last_updated = datetime.datetime.now()
            self.valid_till = self.apiUpdate.getValidTill()
            self.datumIdent += 1
            logger.info(f"Fetching data for {self.apiType.name} {self.__repr__()}; expires in {self.apiUpdate.expiryInWords()}; {self.valid_till} -> {self.datumIdent}")
    
    def process(self):
        """ Process response to processed Dataum (post-processing)

        Interface method, must be implemented by inherited class
        """
        raise NotImplementedError("")
    
    def run(self, **kwargs):
        """ Runs the pre-processing, fetch and calls process

        Interface method, must be implemented by inherited class
        """
        raise NotImplementedError("")

    def test(self, **kwargs):
        """ runs the test of api

        Interface method, must be implemented by inherited class
        """

        raise NotImplementedError("")        



    # def fetch(self, **kwargs):
    #     """ fetch from api
        
    #     api is called and put into response; iff: consistent data has expired
    #     """

    #     if (datetime.datetime.now() > self.valid_till):
    #         self.response = requests.get(self.apiUrl, **kwargs)
    #         self.last_updated = datetime.datetime.now()
    #         self.valid_till = self.apiUpdate.getValidTill()
    #         self.datumIdent += 1
    #         logger.info(f"Fetching data for {self.apiType.name} {self.__repr__()}; expires in {self.apiUpdate.expiryInWords()}; {self.valid_till} -> {self.datumIdent}")