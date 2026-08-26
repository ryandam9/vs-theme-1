"""Exercises every Pylance semantic token type."""

from dataclasses import dataclass  # module
from enum import Enum

MAX_RETRIES: int = 3  # variable.readonly


class Status(Enum):  # class.declaration
    PENDING = "pending"  # enumMember
    ACTIVE = "active"


@dataclass  # decorator
class Store:
    data: dict[str, str]  # property
    limit: int = 10

    def __init__(self, limit: int) -> None:  # magicFunction, selfParameter, parameter
        self.data = {}
        self.limit = limit

    def get(self, key: str) -> str | None:  # method.declaration
        if key not in self.data:
            print(f"missing {key!r}")  # function.defaultLibrary
            return None
        return self.data[key]

    @classmethod
    def empty(cls) -> "Store":  # clsParameter
        return cls(limit=0)


assert Status.ACTIVE is not None  # builtinConstant / keyword
