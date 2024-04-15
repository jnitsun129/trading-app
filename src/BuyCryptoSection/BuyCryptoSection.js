import React, { useState } from "react";
import "./BuyCryptoSection.css";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
const BuyCryptoSection = ({ cryptos, availableCash, formatNumber }) => {
    const [selectedBuyCrypto, setSelectedBuyCrypto] = useState("");
    const [cryptoValue, setCryptoValue] = useState(0);
    const [enteredAmount, setEnteredAmount] = useState("");
    const [postMessage, setPostMessage] = useState("");
    const [canAfford, setCanAfford] = useState(true);
    const [buyError, setBuyError] = useState(false);
    const [pending, setPending] = useState(false);
    const [textStyle, setTextStyle] = useState({ color: "white" });

    const handleBuySelectChange = async (selectedCrypto) => {
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
            <h2>Buy Cryptocurrency</h2>
            <form id="buyCryptoForm">
                <CustomDropdown
                    options={cryptos.map((crypto) => ({
                        label: crypto,
                        value: crypto,
                    }))}
                    selectedValue={selectedBuyCrypto}
                    onSelect={handleBuySelectChange}
                    placeholder="Select a Crypto"
                />
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
