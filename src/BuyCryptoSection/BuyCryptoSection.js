import React, { useState } from "react";
import "./BuyCryptoSection.css";
const BuyCryptoSection = ({ cryptos, availableCash, formatNumber }) => {
    const [selectedBuyCrypto, setSelectedBuyCrypto] = useState("");
    const [cryptoValue, setCryptoValue] = useState(0);
    const [enteredAmount, setEnteredAmount] = useState("");
    const [canAfford, setCanAfford] = useState(true);
    const [buyError, setBuyError] = useState(false);
    const [pending, setPending] = useState(false);

    const handleBuySelectChange = async (event) => {
        const selectedCrypto = event.target.value;
        setSelectedBuyCrypto(selectedCrypto);

        if (selectedCrypto !== "") {
            try {
                const response = await fetch(`/crypto-info/${selectedCrypto}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCryptoValue(parseFloat(data.data.ask_price));
            } catch (error) {
                console.error("Failed to fetch crypto info:", error);
                setCryptoValue(0);
            }
        } else {
            setCryptoValue(0);
            setSelectedBuyCrypto("");
        }
    };

    const handleBuy = async (event) => {
        event.preventDefault();
        if (canAfford) {
            setBuyError(false);
            setPending(true);
            try {
                const response = await fetch(
                    `/buy-crypto/${selectedBuyCrypto}/${enteredAmount}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                setTimeout(() => {
                    setPending(false); // Set the variable to false after 30 seconds
                }, 30000);
            } catch (error) {
                console.error("Failed to fetch crypto info:", error);
                setCryptoValue(0);
                setPending(false);
            }
        } else {
            setBuyError(true);
        }
    };

    const handleAmountChange = (event) => {
        const amount = event.target.value;
        setEnteredAmount(amount);
        const total = calculateTotal(amount);
        setCanAfford(total <= parseFloat(availableCash));
    };

    const calculateTotal = (amount) => {
        return parseFloat(amount) * cryptoValue;
    };

    const numStyle = () => {
        if (!canAfford) {
            return { color: "red" };
        } else if (pending) {
            return { color: "blue" };
        } else {
            return {};
        }
    };

    const message = () => {
        if (buyError) {
            return "**Not Enough Cash**";
        } else if (pending) {
            return "**Pending**";
        } else {
            return "";
        }
    };

    return (
        <div className="buy-crypto-section">
            <h2>Buy Cryptocurrency</h2>
            <form id="buyCryptoForm">
                <select
                    className="form-select"
                    id="cryptoSymbol"
                    value={selectedBuyCrypto}
                    onChange={handleBuySelectChange}>
                    <option value="">Select a Crypto</option>
                    {cryptos.map((crypto, index) => (
                        <option key={index} value={crypto}>
                            {crypto}
                        </option>
                    ))}
                </select>
                {selectedBuyCrypto && (
                    <div>
                        <div className="buy-form-group">
                            <input
                                type="number"
                                className="form-control amount-input"
                                placeholder={
                                    selectedBuyCrypto
                                        ? `Enter amount in ${selectedBuyCrypto}`
                                        : "Select a Crypto"
                                }
                                value={enteredAmount}
                                onChange={handleAmountChange}
                            />
                            <button
                                onClick={handleBuy}
                                type="submit"
                                className="btn btn-primary">
                                Buy
                            </button>
                        </div>
                    </div>
                )}
            </form>
            <p>
                <b>
                    {cryptoValue > 0
                        ? `Current Price: $${formatNumber(cryptoValue)}`
                        : ""}
                </b>
            </p>
            <p style={numStyle()}>
                <b>
                    {enteredAmount > 0 && cryptoValue > 0
                        ? `Total: $${formatNumber(
                              calculateTotal(enteredAmount)
                          )} ${message()}`
                        : ""}
                </b>
            </p>
        </div>
    );
};

export default BuyCryptoSection;
