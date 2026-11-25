from pydantic import BaseModel, Field
from typing import Optional

class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    limit: int = Field(default=6, ge=1, le=15)

class CompareRequest(BaseModel):
    document_id_a: str
    document_id_b: str

class ReportRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=1000)
    max_sources: int = Field(default=10, ge=2, le=20)
