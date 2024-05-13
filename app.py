from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
import csv
import os
from threading import Thread
from backend.robin import get_account_info, run, get_crypto_data, execute_buy_order, get_crypto_position, get_crypto_historical, login_to_robinhood, CRYPTOS, STOP_SIGNAL
from backend.table import plot_crypto_prices
from backend.gpt import ask_gpt
app = Flask(__name__, static_folder="public")
CORS(app)
login_to_robinhood()
TRADES_FILE = 'trades.csv'


def read_trades():
    trades = []
    if os.path.exists(TRADES_FILE):
        with open(TRADES_FILE, mode='r', newline='') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                trades.append(row)
    return trades


@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight request successful'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add(
            'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type, Authorization')
        return response


def write_trades(trades):
    fieldnames = ['id', 'type', 'crypto', 'amount',
                  'price', 'value', 'status', 'time']
    with open(TRADES_FILE, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for trade in trades:
            writer.writerow(trade)


@app.route('/auto-trade/<time>/<interval>/<cryptos>', methods=['GET', 'POST'])
def auto_trade(time: int, interval: str, cryptos: str):
    cryptos = cryptos.split(',')
    time = float(time)
    if request.method == 'GET':
        STOP_SIGNAL.clear()
        # Start the run function in a new thread
        thread = Thread(target=run, args=(time, interval, cryptos))
        print('Started Auto Trading Process')
        thread.start()
        return jsonify({'auto-trade': True}), 200
    if request.method == 'POST':
        STOP_SIGNAL.set()
        return jsonify({'auto-trade': False}), 200


@app.route('/account_info', methods=['GET', 'POST'])
def account_info():
    app.logger.info('Entering Account Info Endpoint')
    account_info = get_account_info()
    return jsonify({'account_info': account_info})


@app.route('/positions', methods=['GET', 'POST'])
def positions():
    app.logger.info('Entering Positions Endpoint')
    info = {}
    positions = get_crypto_position()
    for position in positions:
        currency = position['currency']['code']
        og_value = position['cost_bases'][0]['direct_cost_basis']
        quantity = position['cost_bases'][0]['direct_quantity']
        if float(quantity) > 0:
            current_data = get_crypto_data(currency)
            curr_price = current_data['bid_price']
            info[currency] = {
                'quantity': quantity,
                'og_value': og_value,
                'curr_price': curr_price
            }
    return jsonify({'positions': info})


@app.route('/get-crypto-graph/<crypto>/<interval>/<span>/<price_data>', methods=['GET', 'POST'])
def get_crypto_graph(crypto: str, interval: str, span: str, price_data: str):
    app.logger.info('Entering Crytpo Graph Endpoint')
    data = get_crypto_historical(crypto, interval, span)
    price_data = price_data.split(',')
    base64_image = plot_crypto_prices(data, interval, span, price_data)
    return jsonify({'data': data, 'image': base64_image})


@app.route('/todays-change', methods=['GET'])
def successful_trades_sum():
    app.logger.info('Entering Change Endpoint')
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


@app.route('/get-cryptos', methods=['GET'])
def get_cryptos():
    app.logger.info('Entering Get Cryptos Endpoint Endpoint')
    return jsonify({"cryptos": CRYPTOS})


@app.route('/crypto-info/<crypto>', methods=['GET'])
def get_crypto_info(crypto):
    app.logger.info('Entering Crypto Info Endpoint')
    data = get_crypto_data(crypto)
    return jsonify({'data': data})


@app.route('/buy-crypto/<crypto>/<amount>', methods=['GET', 'POST'])
def buy_crypto(crypto, amount):
    app.logger.info('Entering Buy Crypto Endpoint')
    message = execute_buy_order(crypto, amount)
    return jsonify({"message": message})


@app.route('/ask-ai/<crypto>/<interval>/<span>', methods=['POST', 'GET'])
def ask_ai(crypto, interval, span):
    app.logger.info('Entering AI Endpoint')
    data = request.json
    response = ask_gpt(data, crypto, interval, span)
    response = response.replace("Bullet", "")
    response = response.replace("Points", "")
    response = response.strip()
    response = response.replace("\"", " ")
    return jsonify({"response": response})


@app.route('/record-trade', methods=['POST', 'GET'])
def record_trade():
    app.logger.info('Entering Record Trade Endpoint')
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


@app.route('/get-trades', methods=['GET'])
def get_trades():
    app.logger.info('Entering Get Trades Endpoint')
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


@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())


if __name__ == '__main__':
    app.run(debug=True)
