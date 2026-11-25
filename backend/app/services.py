import io, re, uuid, requests
from pathlib import Path
from typing import List
from pypdf import PdfReader
from docx import Document as DocxDocument
from .config import (
    OLLAMA_BASE_URL, CHAT_MODEL, EMBEDDING_MODEL,
    CHUNK_SIZE, CHUNK_OVERLAP, OLLAMA_TIMEOUT_SECONDS
)
from .store import collection

def ollama_request(path: str, payload: dict):
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}{path}",
            json=payload,
            timeout=OLLAMA_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Cannot connect to Ollama. Install/start Ollama and run `ollama serve` if needed."
        )
    except requests.exceptions.Timeout:
        raise RuntimeError("Ollama request timed out. Try a smaller model or increase OLLAMA_TIMEOUT_SECONDS.")
    except requests.exceptions.HTTPError as exc:
        detail = response.text[:500] if response is not None else str(exc)
        if response is not None and response.status_code == 404:
            raise RuntimeError(
                f"Ollama model not found. Pull required model with `ollama pull {CHAT_MODEL}` "
                f"and `ollama pull {EMBEDDING_MODEL}`. Details: {detail}"
            )
        raise RuntimeError(f"Ollama returned an error: {detail}")

def extract_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if suffix == ".docx":
        doc = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    if suffix in {".txt", ".md"}:
        return content.decode("utf-8", errors="replace")
    raise ValueError("Supported formats: PDF, DOCX, TXT and MD.")

def split_chunks(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    chunks, start = [], 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            boundary = text.rfind(" ", start, end)
            if boundary > start + int(CHUNK_SIZE * .65):
                end = boundary
        part = text[start:end].strip()
        if part:
            chunks.append(part)
        if end >= len(text):
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return chunks

def embed_texts(texts: List[str]) -> List[List[float]]:
    vectors = []
    # Ollama /api/embed supports a batch input list.
    for i in range(0, len(texts), 32):
        result = ollama_request("/api/embed", {
            "model": EMBEDDING_MODEL,
            "input": texts[i:i+32]
        })
        vectors.extend(result.get("embeddings", []))
    if len(vectors) != len(texts):
        raise RuntimeError("Ollama did not return an embedding for every text chunk.")
    return vectors

def ingest_document(filename: str, content: bytes):
    extracted = extract_text(filename, content)
    if len(extracted.strip()) < 40:
        raise ValueError("Not enough readable text found. Scanned PDFs need OCR and are not supported yet.")
    chunks = split_chunks(extracted)
    vectors = embed_texts(chunks)
    document_id = str(uuid.uuid4())
    ids = [f"{document_id}-{i}" for i in range(len(chunks))]
    metadatas = [
        {"document_id": document_id, "document_name": filename, "chunk_index": i}
        for i in range(len(chunks))
    ]
    collection.add(ids=ids, documents=chunks, embeddings=vectors, metadatas=metadatas)
    return {"id": document_id, "name": filename, "chunks": len(chunks), "characters": len(extracted)}

def get_documents():
    data = collection.get(include=["metadatas"])
    grouped = {}
    for meta in data.get("metadatas") or []:
        if not meta:
            continue
        did = meta["document_id"]
        if did not in grouped:
            grouped[did] = {"id": did, "name": meta["document_name"], "chunks": 0}
        grouped[did]["chunks"] += 1
    return list(grouped.values())

def delete_document(document_id: str):
    found = collection.get(where={"document_id": document_id}, include=[])
    if not found["ids"]:
        return False
    collection.delete(ids=found["ids"])
    return True

def retrieve(query: str, limit: int = 6, document_id: str = None):
    vector = embed_texts([query])[0]
    kwargs = {"query_embeddings": [vector], "n_results": limit}
    if document_id:
        kwargs["where"] = {"document_id": document_id}
    result = collection.query(**kwargs, include=["documents", "metadatas", "distances"])
    hits = []
    ids = result.get("ids", [[]])[0]
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    for i, chunk in enumerate(docs):
        meta = metas[i] or {}
        hits.append({
            "id": ids[i], "text": chunk,
            "document_id": meta.get("document_id"),
            "document_name": meta.get("document_name", "Unknown"),
            "chunk_index": meta.get("chunk_index", 0),
            "distance": round(float(distances[i]), 4) if distances else None
        })
    return hits

def complete(system: str, prompt: str):
    result = ollama_request("/api/chat", {
        "model": CHAT_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "options": {"temperature": 0.2}
    })
    return result.get("message", {}).get("content", "")

def document_text(document_id: str):
    result = collection.get(where={"document_id": document_id}, include=["documents", "metadatas"])
    if not result["ids"]:
        return None
    pairs = sorted(
        zip(result["documents"], result["metadatas"]),
        key=lambda x: x[1].get("chunk_index", 0)
    )
    return pairs

def make_summary(document_id: str):
    pairs = document_text(document_id)
    if pairs is None:
        return None
    context = "\n\n".join(text for text, _ in pairs[:18])
    output = complete(
        "You are a careful research analyst. Return concise structured JSON with keys: "
        "executive_summary (string), key_findings (array of strings), topics (array of strings), "
        "entities (array of strings), limitations (array of strings). Do not invent information.",
        f"Analyze this document content:\n{context[:18000]}"
    )
    return output

def analytics():
    data = collection.get(include=["metadatas"])
    docs = {}
    for meta in data.get("metadatas") or []:
        if not meta:
            continue
        did = meta["document_id"]
        docs.setdefault(did, {"id": did, "name": meta["document_name"], "chunks": 0})
        docs[did]["chunks"] += 1
    return {
        "document_count": len(docs),
        "chunk_count": len(data.get("ids") or []),
        "documents": list(docs.values()),
        "storage": "ChromaDB persistent collection",
        "llm_provider": "Ollama",
        "chat_model": CHAT_MODEL,
        "embedding_model": EMBEDDING_MODEL
    }
