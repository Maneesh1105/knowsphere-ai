import chromadb
from .config import CHROMA_PATH

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(
    name="knowsphere_knowledge",
    metadata={"hnsw:space": "cosine"}
)
