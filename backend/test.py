import requests
from table import plot_crypto_prices

symbol = 'BTC'
interval = '15second'
span = 'hour'
price_data = ['high_price', 'low_price']

url = f"http://127.0.0.1:5000/get-crypto-graph/{symbol}/{interval}/{span}/{','.join(price_data)}"

response = requests.get(url)
data = response.json()['data']
print(data)
