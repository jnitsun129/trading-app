from openai import OpenAI
from backend.utils import get_api_key, PROMPT
import json
client = OpenAI(api_key=get_api_key())


def ask_gpt(file_content, crypto):
    """
    Reads a portion of a file and asks a question in a conversational manner based on its content.

    Parameters:
    - filename: The path to the file.
    - question: The question you want to ask about the content of the file.

    Returns:
    - The answer as a string.
    """
    question = f"The following is information for {crypto} " + PROMPT
    file_content = json.dumps(file_content)
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Based on the following content:\n{file_content}\n\nQuestion: {question}"}
        ]
        response = client.chat.completions.create(model="gpt-4",
                                                  messages=messages,
                                                  max_tokens=100)
        answer = response.choices[0].message.content
        return answer.strip()
    except Exception as e:
        return f"An error occurred: {e}"
