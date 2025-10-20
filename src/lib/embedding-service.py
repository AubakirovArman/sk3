"""
Embedding Generation Microservice
FastAPI service for generating embeddings using BAAI/bge-m3 model
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer
import torch

app = FastAPI(title="Embedding Service")

# Load model on startup
print("Loading BAAI/bge-m3 model...")
device = torch.device("mps" if torch.backends.mps.is_available() else 
                     ("cuda" if torch.cuda.is_available() else "cpu"))
model = SentenceTransformer("BAAI/bge-m3", device=device)
model.max_seq_length = 8192
print(f"Model loaded on device: {device}")


class EmbeddingRequest(BaseModel):
    texts: List[str]
    normalize: bool = True


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str = "BAAI/bge-m3"
    dimension: int = 1024


@app.post("/embed", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for input texts
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        
        if len(request.texts) > 100:
            raise HTTPException(status_code=400, detail="Too many texts (max 100)")
        
        # Generate embeddings
        embeddings = model.encode(
            request.texts,
            normalize_embeddings=request.normalize,
            convert_to_numpy=False
        )
        
        # Convert to list
        embeddings_list = [emb.tolist() for emb in embeddings]
        
        return EmbeddingResponse(
            embeddings=embeddings_list,
            dimension=len(embeddings_list[0]) if embeddings_list else 0
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "BAAI/bge-m3",
        "device": str(device),
        "dimension": 1024
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
