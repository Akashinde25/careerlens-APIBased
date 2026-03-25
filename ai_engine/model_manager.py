import os
import json
from groq import Groq

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')

class LocalModelManager:
    def __init__(self):
        with open(CONFIG_PATH, 'r') as f:
            self.config = json.load(f)
            
        self.api_key = self.config.get("groq_api_key")
        self.model = self.config.get("llm_model", "mixtral-8x7b-32768")
        
        if not self.api_key:
            raise ValueError("Groq API key not found in config.json")
            
        self.client = Groq(api_key=self.api_key)

    def generate(self, prompt, system_prompt="You are a helpful AI assistant.", temperature=0.3, response_format=None):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}
            
        try:
            chat_completion = self.client.chat.completions.create(**kwargs)
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            return None

    def stream_generate(self, prompt, system_prompt="You are a helpful AI assistant.", temperature=0.7):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Error streaming from Groq API: {e}")
            yield f"Error: {e}"
