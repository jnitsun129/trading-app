import base64
from io import BytesIO
from matplotlib.ticker import MaxNLocator
from datetime import datetime
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')


interval_dict = {'15second': {'name': '15 seconds', 'type': 'seconds', 'value': 15},
                 '5minute': {'name': '5 minutes', 'type': 'minutes', 'value': 5},
                 '10minute': {'name': '10 minutes', 'type': 'minutes', 'value': 10},
                 'hour': {'name': '1 hour', 'type': 'hour', 'value': 1},
                 'day': {'name': '1 day', 'type': 'days', 'value': 1},
                 'week': {'name': '1 week', 'type': 'week', 'value': 1}, }
span_dict = {'hour': {'name': '1 hour', 'type': 'hour', 'value': 1},
             'day': {'name': '1 day', 'type': 'days', 'value': 1},
             'week': {'name': '1 week', 'type': 'week', 'value': 1},
             'month:': {'name': '1 month', 'type': 'month', 'value': 1},
             '3month': {'name': '3 months', 'type': 'month', 'value': 3},
             'year': {'name': '1 year', 'type': 'year', 'value': 1},
             '5year': {'name': '5 year', 'type': 'year', 'value': 5}}
date_formats = {
    'minutes': '%Y-%m-%d %H:%M',
    'hour': '%Y-%m-%d %H:%M',
    'seconds': '%Y-%m-%d %H:%M:%S',
    'days': '%Y-%m-%d'
}


def plot_crypto_prices(data, crypto_title, interval, span, price_data):
    interval = interval_dict[interval]
    span = span_dict[span]
    dates = [datetime.fromisoformat(
        item['begins_at'].replace('Z', '')) for item in data]
    plt.figure(figsize=(10, 5))
    if 'close_price' in price_data:
        close_prices = [float(item['close_price']) for item in data]
        plt.plot(dates, close_prices, label='Close Price', marker='o')
    if 'high_price' in price_data:
        high_prices = [float(item['high_price']) for item in data]
        plt.plot(dates, high_prices, label='High Price', marker='x')
    if 'low_price' in price_data:
        low_prices = [float(item['low_price']) for item in data]
        plt.plot(dates, low_prices, label='Low Price', marker='^')
    if 'open_price' in price_data:
        low_prices = [float(item['open_price']) for item in data]
        plt.plot(dates, low_prices, label='Open Price', marker='*')
    plt.gca().xaxis.set_major_formatter(
        mdates.DateFormatter(date_formats[interval['type']]))
    plt.gca().xaxis.set_major_locator(MaxNLocator(nbins=10))
    plt.gcf().autofmt_xdate()
    plt.tight_layout()
    plt.ylabel('Price')
    plt.legend()
    plt.grid(True)
    buf = BytesIO()
    plt.savefig(buf, format='png')
    image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    buf.close()
    return image_base64
