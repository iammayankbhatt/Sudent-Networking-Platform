from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI(title="Connexa ML Matching Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserInput(BaseModel):
    id: str
    skills: List[str] = []
    bio: str = ""


class MatchRequest(BaseModel):
    user: UserInput
    candidates: List[UserInput]


class MatchResult(BaseModel):
    id: str
    mlScore: float


class MatchResponse(BaseModel):
    results: List[MatchResult]


def build_text(user: UserInput) -> str:
    return " ".join(user.skills + [user.bio])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=MatchResponse)
def match_users(req: MatchRequest):
    if not req.candidates:
        return MatchResponse(results=[])

    query_text = build_text(req.user)
    candidate_texts = [build_text(c) for c in req.candidates]

    # Handle empty texts gracefully
    all_texts = [query_text] + candidate_texts
    non_empty = any(t.strip() for t in all_texts)
    if not non_empty:
        return MatchResponse(results=[MatchResult(id=c.id, mlScore=0.0) for c in req.candidates])

    try:
        vectorizer = TfidfVectorizer(min_df=1, stop_words="english")
        matrix = vectorizer.fit_transform(all_texts)
        query_vec = matrix[0]
        candidate_vecs = matrix[1:]
        scores = cosine_similarity(query_vec, candidate_vecs).flatten()
    except Exception:
        scores = np.zeros(len(req.candidates))

    results = [
        MatchResult(id=req.candidates[i].id, mlScore=float(round(scores[i], 4)))
        for i in range(len(req.candidates))
    ]
    return MatchResponse(results=results)
