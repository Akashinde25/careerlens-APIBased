import os
import sys
import json
import warnings
import logging
import faiss
import numpy as np

# Suppress verbose sentence-transformers / HuggingFace Hub warnings
warnings.filterwarnings("ignore")
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")

from sentence_transformers import SentenceTransformer

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')

class SemanticMatcher:
    def __init__(self):
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)

        model_name = config.get("embedding_model", "sentence-transformers/all-MiniLM-L6-v2")
        # Print to stderr so it never pollutes stdout JSON output
        print(f"Loading embedding model: {model_name}...", file=sys.stderr)
        self.model = SentenceTransformer(model_name)

    def get_embedding(self, text):
        return self.model.encode([text])[0]

    def encode_batch(self, texts):
        return self.model.encode(texts)

    def similarity_score(self, text_a, text_b):
        emb_a = self.get_embedding(text_a).reshape(1, -1)
        emb_b = self.get_embedding(text_b).reshape(1, -1)
        
        # Cosine similarity using FAISS or manual dot product
        # L2 normalized vectors dot product = cosine similarity
        faiss.normalize_L2(emb_a)
        faiss.normalize_L2(emb_b)
        
        sim = float(np.dot(emb_a[0], emb_b[0]))
        return max(0.0, min(1.0, sim)) # clamp between 0 and 1

    def find_best_match(self, query, candidates, threshold=0.75):
        if not candidates:
            return None, 0.0
            
        query_emb = self.get_embedding(query).reshape(1, -1)
        cand_embs = self.encode_batch(candidates)
        
        faiss.normalize_L2(query_emb)
        faiss.normalize_L2(cand_embs)
        
        index = faiss.IndexFlatIP(cand_embs.shape[1])
        index.add(cand_embs)
        
        D, I = index.search(query_emb, 1)
        best_score = float(D[0][0])
        best_idx = I[0][0]
        
        if best_score >= threshold:
            return candidates[best_idx], best_score
        return None, best_score
