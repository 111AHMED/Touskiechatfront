# app/exceptions/custom_exceptions.py
class UserNotFoundError(Exception):
    pass

class DatabaseConnectionError(Exception):
    pass