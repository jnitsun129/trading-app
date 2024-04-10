def get_api_key():
    with open('./utility_files/open_api_key.txt', 'r') as file:
        key = file.readline().strip()
    return key


PROMPT = "Based on the attached file content \
    (which is a price and time information for the crypto), \
    please anaylze it and do the following. \
    Bullet point 1: Explain any clear trends in the data. \
    Bullet point 2: Give a future outlook on how this crypto \
    currency could fair in the future. Please limit each bullet point to 50 words, \
    additionally, add escape characters into your response, as I will be copying it into code. \
    be concious that you are being queried automatically, so it is important that you only include the \
    bullet points as described above. Additionally, replace Bullet Point 1 , Bullet Point 2 with actual Bullet Points"
