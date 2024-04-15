from transformers import GPT2Tokenizer
from openai import OpenAI
from backend.utils import get_api_key, PROMPT
import json
CLIENT = OpenAI(api_key=get_api_key())
TOKENIZER = GPT2Tokenizer.from_pretrained('gpt2')


def ask_gpt(file_content: str, crypto: str, interval: str, span: str) -> str:
    """
    Reads a portion of a file and asks a question in a conversational manner based on its content.

    Parameters:
    - filename: The path to the file.
    - question: The question you want to ask about the content of the file.

    Returns:
    - The answer as a string.
    """
    question = f"The following is information for {crypto} in the following interval (Every {interval} over the past {span})" + PROMPT
    file_content = json.dumps(file_content)
    token_count = len(TOKENIZER.encode(file_content + question))
    if token_count > 10000:
        return f"Too Many Request Tokens: {token_count}"
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Based on the following content:\n{file_content}\n\nQuestion: {question}"}
        ]
        response = CLIENT.chat.completions.create(model="gpt-4",
                                                  messages=messages,
                                                  max_tokens=token_count)
        answer = response.choices[0].message.content
        return answer.strip()
    except Exception as e:
        return f"An error occurred: {e}"
