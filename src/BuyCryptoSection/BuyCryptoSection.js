import React, { useState, useEffect } from "react";
import "./BuyCryptoSection.css";
import DropdownCheckbox from "../CustomDropdown/CustomDropdown.js";
const { createHeaders } = require("../headers.js");

const API_URL = "http://127.0.0.1:5000";

const BuyCryptoSection = ({ cryptos, availableCash, formatNumber }) => {
    const [selectedBuyCrypto, setSelectedBuyCrypto] = useState("");
    const [cryptoValue, setCryptoValue] = useState(0);
    const [enteredAmount, setEnteredAmount] = useState("");
    const [postMessage, setPostMessage] = useState("");
    const [canAfford, setCanAfford] = useState(true);
    const [buyError, setBuyError] = useState(false);
    const [pending, setPending] = useState(false);
    const [textStyle, setTextStyle] = useState({ color: "white" });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPostMessage("");
            setTextStyle({ color: "white" });
        }, 10000); // Clear the postMessage after 10 seconds

        return () => {
            clearTimeout(timeoutId);
        };
    }, [postMessage]);

    const handleBuySelectChange = async (selectedCrypto) => {
        setSelectedBuyCrypto(selectedCrypto);

        if (selectedCrypto !== "") {
            try {
                const response = await fetch(
                    `${API_URL}/crypto-info/${selectedCrypto}`,
                    { headers: createHeaders(), method: "GET" }
                );
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
                    `${API_URL}/buy-crypto/${selectedBuyCrypto}/${enteredAmount}`,
                    { headers: createHeaders(), method: "POST" }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPending(false);
                setPostMessage(data.message.Message);
                console.log(postMessage);
                if (
                    data.message.status === "Not Enough Crypto" ||
                    data.message.status === "rejected" ||
                    data.message.status === "Insufficient Funds"
                ) {
                    setTextStyle({ color: "red" });
                } else {
                    setTextStyle({ color: "green" });
                }
                console.log(data);
            } catch (error) {
                console.error("Failed to fetch crypto info:", error);
                setBuyError(true); // This might be a better place to indicate an error than setting crypto value to 0
                setPending(false);
            }
        } else {
            setBuyError(true);
            setTextStyle({ color: "red" });
        }
    };

    const handleAmountChange = (event) => {
        const amount = event.target.value;
        setEnteredAmount(amount);
        const total = calculateTotal(amount);
        setCanAfford(total <= parseFloat(availableCash));
        if (total <= parseFloat(availableCash)) {
            setTextStyle({ color: "white" });
        } else {
            setTextStyle({ color: "red" });
        }
    };

    const calculateTotal = (amount) => {
        return parseFloat(amount) * cryptoValue;
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
            <h2>Buy Crypto</h2>
            <form id="buyCryptoForm">
                <DropdownCheckbox
                    options={cryptos.map((crypto) => ({
                        label: crypto,
                        value: crypto,
                    }))}
                    selectedOptions={
                        selectedBuyCrypto
                            ? [
                                  {
                                      label: selectedBuyCrypto,
                                      value: selectedBuyCrypto,
                                  },
                              ]
                            : []
                    }
                    setSelectedOptions={(option) =>
                        handleBuySelectChange(option ? option.value : "")
                    }
                    isMulti={false}
                    placeholder="Select a Crypto"
                />
                {selectedBuyCrypto && (
                    <div>
                        <div className="buy-form-group">
                            <input
                                type="number"
                                className="form-control amount-input"
                                placeholder={`Enter amount in ${selectedBuyCrypto}`}
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
            <p style={pending ? { color: "blue" } : textStyle}>
                <b>
                    {enteredAmount > 0 && cryptoValue > 0 && !postMessage
                        ? `Total: $${formatNumber(
                              calculateTotal(enteredAmount)
                          )} ${message()}`
                        : ""}
                </b>
                <b>{postMessage && postMessage}</b>
            </p>
        </div>
    );
};

export default BuyCryptoSection;
