import robin_stocks.robinhood as r
import time
import json
import threading
import csv
import requests
from datetime import datetime
from termcolor import colored

MINS = {
    'DOGE': 1.0,
    'XLM': 1.0,
    'BTC': 0.000001,
    'SHIB': 500,
    'XTZ': 0.01,
    'ETH': 0.0001
}

STOP_SIGNAL = threading.Event()


def hours_to_seconds(hours: int) -> int:
    return hours * 3600


def minutes_to_seconds(minutes) -> int:
    return minutes * 60


def get_current_time() -> str:
    now = datetime.now()
    current_time = now.strftime("%I:%M %p")
    return current_time


CRYPTOS = ['DOGE', 'BTC', 'SHIB', 'XTZ', 'XLM', 'ETH']
RUN_TIME = hours_to_seconds(8)


def get_login_info() -> dict:
    with open("./utility_files/account.json", 'r') as file:
        data = json.load(file)
    return data


def login_to_robinhood() -> None:
    INFO = get_login_info()
    r.login(INFO['email'], INFO['password'])


def get_crypto_price(crypto: str) -> float:
    data = r.crypto.get_crypto_quote(crypto)
    return float(data['mark_price'])


def get_crypto_data(crypto) -> dict:
    return r.crypto.get_crypto_quote(crypto)


def get_crypto_position() -> dict:
    return r.crypto.get_crypto_positions()


def get_crypto_historical(crypto: str, interval: str, span: str) -> dict:
    return r.crypto.get_crypto_historicals(symbol=crypto, interval=interval, span=span)


def get_account_info() -> dict:
    account_profile = r.profiles.load_account_profile()
    return account_profile


def execute_sell_order(sell_amount: str, crypto: str) -> dict:
    # print(colored(f"Attempting to sell {sell_amount} {crypto}", 'blue'))
    return r.orders.order_sell_crypto_by_quantity(crypto, sell_amount)


def get_order_info(order_id: str) -> dict:
    return r.orders.get_crypto_order_info(order_id)


def format_value(value: float) -> float:
    # Format the float with commas as thousands separators and 2 decimal places
    formatted_value = "{:,.2f}".format(value)
    return float(formatted_value)


def round_value(value: float, price=False) -> float:
    if price:
        return float(round(value, 6))
    else:
        return float(round(value, 2))


def get_crypto_holding(crypto: str) -> int:
    crypto_positions = r.crypto.get_crypto_positions()
    for position in crypto_positions:
        if position['currency']['code'] == crypto:
            quantity = float(position['quantity'])
            break
    return quantity if quantity is not None else "N/A"


def is_greater_than(value: float, threshold: float, tol=1e-9) -> bool:
    adjusted_threshold = threshold - tol
    return value > adjusted_threshold


def check_if_sell(crypto: str, amount_quantity: float) -> bool:
    return is_greater_than(amount_quantity, MINS[crypto])


def log_sell(crypto: str, data: dict) -> None:
    amount = float(data['price']) * float(data['quantity'])
    time = get_current_time()
    # print(colored(f"\n\n**SELL**", 'green'))
    # print(
    # colored(f'**{crypto} sold for ${round(amount, 2)} ({time})**', 'green'))
    # print(colored("**SELL**\n\n", 'green'))
    with open('./orders/log.csv', 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([crypto, amount])
    with open('./orders/time.txt', 'a', newline='') as file:
        file.write(time + '\n')


def make_request(crypto: str, quantity: float, price: float, status: str, data: dict, type="sell") -> None:
    dollar_value = '$' + str(round_value((quantity * price)))
    quantity = str(round_value(quantity))
    price = '$' + str(round_value(price, True))
    requests.post('http://127.0.0.1:5000/record-trade', json={
        'id': data['id'],
        'type': type,
        'crypto': crypto,
        'amount': quantity,
        'price': price,
        'status': status,
        'data': data,
        'time': get_current_time(),
        'value': dollar_value
    })


def execute_buy_order(crypto: str, buy_amount: str) -> None:
    buy_amount = float(buy_amount)
    if buy_amount < MINS[crypto]:
        return {'Message': f'Must buy more than {MINS[crypto]} {crypto} at a time', 'status': 'Not Enough Crypto'}
    account_profile = r.profiles.load_account_profile()
    available_cash = account_profile['cash']
    if available_cash[0] == '$':
        available_cash = available_cash[1:]
    price = get_crypto_price(crypto)
    cost = price * float(buy_amount)
    if float(available_cash) - 0.01 >= cost:
        # print(f"Buying {crypto} for ${buy_amount}")
        initial_data = r.orders.order_buy_crypto_by_quantity(
            crypto, buy_amount)
        id = initial_data['id']
        make_request(crypto, buy_amount, price,
                     'pending', initial_data, type="buy")
        time.sleep(30)
        post_data = get_order_info(id)
        if post_data['state'] == 'filled':
            make_request(crypto, buy_amount,
                         price, 'filled', post_data, type="buy")
        else:
            make_request(crypto, buy_amount,
                         price, 'failed', post_data, type="buy")
        return {'Message': f'Order for {buy_amount} {crypto} {" was filled" if post_data["state"] == "filled" else " failed"}', 'status': post_data['state']}
    else:
        # print(f"Insufficient funds to buy \
        # {buy_amount} {crypto}. Available cash: ${available_cash}")
        return {'Message': f'Insufficient funds to buy {buy_amount} {crypto}', 'status': 'Insufficient Funds'}


def run_crypto(crypto: str, start_time: int, run_time: int) -> None:
    initial_holdings = get_crypto_holding(crypto)
    current_price = get_crypto_price(crypto)
    initial_value = initial_holdings * current_price
    # print(f"Initial {crypto} Holdings: {initial_holdings}")
    account_profile = r.profiles.load_account_profile()
    available_cash = account_profile['cash']
    if available_cash[0] == '$':
        available_cash = available_cash[1:]
    # print(f"Available Cash: ${available_cash}")
    current_price = get_crypto_price(crypto)
    while True:
        if STOP_SIGNAL.is_set() or time.time() - start_time >= run_time:
            print('Stopped Auto Trading Process')
            break
        current_price = get_crypto_price(crypto)
        # print(f"Current {crypto} price: ${current_price}")
        current_holdings = get_crypto_holding(crypto)
        current_value = current_price * current_holdings
        to_sell = current_value - initial_value
        if is_greater_than(to_sell, 1.0):
            to_sell = to_sell * 0.75
        to_sell_quantity = to_sell / current_price
        if is_greater_than(current_value, initial_value) and check_if_sell(crypto, to_sell_quantity):
            intial_data = execute_sell_order(
                round_value(to_sell_quantity), crypto)
            id = intial_data['id']
            make_request(crypto, to_sell_quantity,
                         current_price, 'pending', intial_data)
            time.sleep(30)
            post_data = get_order_info(id)
            if post_data['state'] == 'filled':
                make_request(crypto, to_sell_quantity,
                             current_price, 'filled', post_data)
            else:
                # print(colored("\n\n**FAILED**", 'red'))
                # print(
                # colored(f"Order for ${round(to_sell, 2)} of {crypto} was not filled ({get_current_time()})", 'red'))
                # print(colored("**FAILED**\n\n", 'red'))
                make_request(crypto, to_sell_quantity,
                             current_price, 'failed', post_data)
        time.sleep(2.5)


def get_last_order_time() -> str:
    last_time = ''
    with open('./orders/time.txt', 'r') as file:
        for line in file:
            last_time = line.strip()
    return last_time


def running_sum(start_time: int) -> None:
    while True:
        if time.time() - start_time > RUN_TIME:
            break
        total_amount = 0
        with open('./orders/log.csv', 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                try:
                    total_amount += float(row[' amount'])
                except:
                    pass
        # print(colored(f'Total amount: ${round(total_amount, 2)}', 'yellow'))
        # print(colored(f"Last Sale: {get_last_order_time()}", 'yellow'))
        time.sleep(20)


def run(run_time, interval, cryptos) -> None:
    if interval == 'minutes':
        run_time = minutes_to_seconds(run_time)
    elif interval == 'hours':
        run_time = hours_to_seconds(run_time)
    threads = []
    start_time = time.time()
    print(run_time)
    for crypto in cryptos:
        time.sleep(3)
        thread = threading.Thread(
            target=run_crypto, args=(crypto, start_time, run_time))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()
