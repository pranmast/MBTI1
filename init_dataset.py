from datasets import Dataset, DatasetDict
import datetime

# Define schema fields
schema = {
    "time": ["2026-04-27T00:18:00"],   # ISO timestamp
    "user": ["नमस्कार! तुम्ही कसे आहात?"],  # Example Marathi input
    "bot": ["मी ठीक आहे, धन्यवाद!"],       # Example bot reply
    "mbti_guess": [["Introverted", "Feeling"]]  # Example MBTI traits
}

# Create dataset
ds = Dataset.from_dict(schema)
ds_dict = DatasetDict({"train": ds})

# Push to Hugging Face Hub (requires HF login)
ds_dict.push_to_hub("pranilm/chatlogs", private=True)
