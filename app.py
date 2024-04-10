from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import csv
import os
from threading import Thread
from backend.robin import get_account_info, run, get_crypto_data, execute_buy_order, get_crypto_position, get_crypto_historical, CRYPTOS
from backend.table import plot_crypto_prices
from backend.gpt import ask_gpt

app = Flask(__name__)
CORS(app)


TRADES_FILE = 'trades.csv'


def run_in_thread():
    print("Starting long-running function in a thread...")
    run()
    print("Long-running function has completed/terminated.")


thread = Thread(target=run_in_thread)
thread.start()


def read_trades():
    trades = []
    if os.path.exists(TRADES_FILE):
        with open(TRADES_FILE, mode='r', newline='') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                trades.append(row)
    return trades


def write_trades(trades):
    fieldnames = ['id', 'type', 'crypto', 'amount',
                  'price', 'value', 'status', 'time']
    with open(TRADES_FILE, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for trade in trades:
            writer.writerow(trade)


@app.route('/account_info')
def account_info():
    account_info = get_account_info()
    return jsonify({'account_info': account_info})


@app.route('/positions')
def positions():
    info = {}
    positions = get_crypto_position()
    for position in positions:
        currency = position['currency']['code']
        og_value = position['cost_bases'][0]['direct_cost_basis']
        quantity = position['cost_bases'][0]['direct_quantity']
        if float(quantity) > 0:
            current_data = get_crypto_data(currency)
            curr_price = current_data['bid_price']
            open_price = current_data['open_price']
            high_price = current_data['high_price']
            info[currency] = {
                'quantity': quantity,
                'og_value': og_value,
                'curr_price': curr_price
            }
    return jsonify({'positions': info})


@app.route('/get-crypto-graph/<crypto>/<interval>/<span>/<price_data>', methods=['GET', 'POST'])
def get_crypto_graph(crypto: str, interval: str, span: str, price_data: str):
    data = get_crypto_historical(crypto, interval, span)
    price_data = price_data.split(',')
    base64_image = plot_crypto_prices(data, crypto, interval, span, price_data)
    return jsonify({'data': data, 'image': base64_image})


@app.route('/todays-change')
def successful_trades_sum():
    trades = read_trades()
    running_sum = 0
    for trade in trades:
        if trade['status'] == 'filled':
            trade_gain = float(trade['amount']) * float(trade['price'][1:])
            if trade['type'] == 'sell':
                running_sum += trade_gain
            else:
                running_sum -= trade_gain
    return jsonify({"successfulTradesSum": running_sum})


@app.route('/get-cryptos')
def get_cryptos():
    return jsonify({"cryptos": CRYPTOS})


@app.route('/crypto-info/<crypto>')
def get_crypto_info(crypto):
    data = get_crypto_data(crypto)
    return jsonify({'data': data})


@app.route('/buy-crypto/<crypto>/<amount>')
def buy_crypto(crypto, amount):
    execute_buy_order(crypto, amount)
    return jsonify({"message": "Trade data processed successfully"}), 200


@app.route('/ask-ai/<crypto>', methods=['POST'])
def ask_ai(crypto):
    data = request.json
    response = ask_gpt(data, crypto)
    response = response.replace("'", "")
    response = response.replace("Bullet", "")
    response = response.replace("Points", "")
    return jsonify({"response": response})


@app.route('/record-trade', methods=['POST'])
def record_trade():
    trade_data = request.json
    trades = read_trades()
    if len(trades) > 0:
        existing_trade_index = next((index for index, trade in enumerate(
            trades) if trade['id'] == trade_data['id']), None)
    else:
        existing_trade_index = None

    if existing_trade_index is not None:
        trades[existing_trade_index]['status'] = trade_data['status']
    else:
        # Ensure all fields are present and add the trade
        trade_to_add = {field: trade_data.get(field, '') for field in [
            'id', 'type', 'crypto', 'amount', 'price', 'value', 'status', 'time']}
        trades.append(trade_to_add)

    write_trades(trades)
    return jsonify({"message": "Trade data processed successfully"}), 200


@app.route('/get-trades')
def get_trades():
    current_time = datetime.now()
    five_minutes_ago = current_time - timedelta(minutes=10)
    all_trades = read_trades()
    trades = []
    for trade in all_trades:
        if trade['status'] == 'failed':
            trade_time = trade['time'].replace(' ', '')
            trade_time = datetime.strptime(trade_time, "%I:%M%p").replace(
                year=current_time.year, month=current_time.month, day=current_time.day)
            if trade_time > five_minutes_ago:
                trades.append(trade)
        else:
            trades.append(trade)
    trades = list(reversed(trades))
    return jsonify(trades)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
