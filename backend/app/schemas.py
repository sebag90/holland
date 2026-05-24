from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    name: str


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBase


BookingKind = Literal["internal", "external"]


class BookingIn(BaseModel):
    start_date: date
    end_date: date
    kind: BookingKind = "internal"
    note: str = ""


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user: UserBase
    start_date: date
    end_date: date
    kind: str
    note: str
    created_at: datetime


class TodoIn(BaseModel):
    text: str = Field(min_length=1)
    description: str = ""


class TodoPatch(BaseModel):
    text: str | None = None
    description: str | None = None
    done: bool | None = None


class TodoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    description: str
    done: bool
    created_by: UserBase | None
    created_at: datetime
    updated_at: datetime


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    content_type: str
    size: int


class PollOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    votes: int
    voters: list[int]


class PollOut(BaseModel):
    id: int
    question: str
    multiple: bool
    options: list[PollOptionOut]


class PollIn(BaseModel):
    question: str
    multiple: bool = False
    options: list[str]


class ThreadIn(BaseModel):
    title: str
    body: str = ""
    poll: PollIn | None = None
    attachment_ids: list[int] = []


class PostIn(BaseModel):
    body: str
    attachment_ids: list[int] = []


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user: UserBase
    body: str
    created_at: datetime
    attachments: list[AttachmentOut]


class ThreadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    user: UserBase
    created_at: datetime
    reply_count: int
    has_poll: bool


class ThreadDetail(BaseModel):
    id: int
    title: str
    body: str
    user: UserBase
    created_at: datetime
    posts: list[PostOut]
    poll: PollOut | None
    attachments: list[AttachmentOut]


class VoteIn(BaseModel):
    option_ids: list[int]
