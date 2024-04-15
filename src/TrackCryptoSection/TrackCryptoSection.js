import React, { useState } from "react";
import "./TrackCryptoSection.css";
import "../Modal/Modal.css";
import Modal from "../Modal/Modal.js";
import AiForm from "../AiForm/AiForm.js";

const TrackCryptoSection = ({
    cryptos,
    positions,
    showRemoveButton,
    onRemove,
    onAdd,
    formatNumber,
}) => {
    const [selectedCrypto, setSelectedCrypto] = useState("");
    const [interval, setInterval] = useState(""); // Default value as placeholder
    const [span, setSpan] = useState("");
    const [intervalWord, setIntervalWord] = useState("");
    const [spanWord, setSpanWord] = useState("");
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [graphImage, setGraphImage] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const intervals = [
        { value: "", label: "Interval" }, // Placeholder option
        { value: "15second", label: "15 seconds" },
        { value: "5minute", label: "5 minutes" },
        { value: "10minute", label: "10 minutes" },
        { value: "hour", label: "1 hour" },
        { value: "day", label: "1 day" },
        { value: "week", label: "1 week" },
    ];
    const spans = [
        { value: "", label: "Span" }, // Placeholder option
        { value: "hour", label: "1 hour" },
        { value: "day", label: "1 day" },
        { value: "week", label: "1 week" },
        { value: "month", label: "1 month" },
        { value: "3month", label: "3 months" },
        { value: "year", label: "1 year" },
        { value: "5year", label: "5 years" },
    ];

    const priceOptions = [
        { value: "high_price", label: "High" },
        { value: "low_price", label: "Low" },
        { value: "open_price", label: "Open" },
        { value: "close_price", label: "Close" },
    ];

    const handlePriceTypeChange = (priceValue) => {
        setSelectedPrices((currentPrices) =>
            currentPrices.includes(priceValue)
                ? currentPrices.filter((value) => value !== priceValue)
                : [...currentPrices, priceValue]
        );
    };

    const handleSelectChange = (event) => {
        setSelectedCrypto(event.target.value);
    };

    const handleIntervalChange = (event) => {
        const newInterval = event.target.value;
        setInterval(newInterval);
        const intervalObj = intervals.find(
            (item) => item.value === newInterval
        );
        setIntervalWord(intervalObj ? intervalObj.label : "");
    };

    const handleSpanChange = (event) => {
        const newSpan = event.target.value;
        setSpan(newSpan);
        const spanObj = spans.find((item) => item.value === newSpan);
        setSpanWord(spanObj ? spanObj.label : "");
    };

    const fetchCryptoGraph = async () => {
        if (!selectedCrypto) {
            alert("Please select a cryptocurrency.");
            return;
        }
        if (!interval) {
            alert("Please select an interval.");
            return;
        }
        if (!span) {
            alert("Please select a span.");
            return;
        }
        if (selectedPrices.length === 0) {
            alert("Please select at least one price data type.");
            return;
        }

        // Convert array to comma-separated string for the API call
        const priceDataString = selectedPrices.join(",");
        closeModal();
        try {
            const response = await fetch(
                `/get-crypto-graph/${selectedCrypto}/${interval}/${span}/${priceDataString}`
            );
            if (response.status === 500) {
                alert("Invalid interval/span pairing.");
                return;
            }
            if (!response.ok) {
                throw new Error("Network response was not ok.");
            }
            const data = await response.json();
            setGraphData(data.data);
            setGraphImage(data.image);
            setShowModal(true);
        } catch (error) {
            console.error(
                "There has been a problem with your fetch operation:",
                error
            );
        }
    };

    const closeModal = () => {
        setGraphImage(null);
        setShowModal(false);
    };

    const selectedPosition = positions[selectedCrypto];
    let current_holdings, current_price, og_value, curr_value, diff;

    if (selectedPosition) {
        current_holdings = parseFloat(selectedPosition.quantity);
        current_price = parseFloat(selectedPosition.curr_price);
        og_value = parseFloat(selectedPosition.og_value);
        curr_value = current_holdings * current_price;
        diff = curr_value - og_value;
    }

    const imageDiv = () => {
        return (
            <img
                src={`data:image/png;base64,${graphImage}`}
                alt="Crypto Graph"
            />
        );
    };

    return (
        <div className="track-crypto-section">
            <button onClick={onAdd} className="add-section-btn top-right">
                +
            </button>
            <h2>Track Crypto</h2>
            <select
                className="form-select"
                id="trackCryptoSymbol"
                value={selectedCrypto}
                onChange={handleSelectChange}>
                <option value="">Select Crypto</option>
                {cryptos.map((crypto, index) => (
                    <option key={index} value={crypto}>
                        {crypto}
                    </option>
                ))}
            </select>
            {selectedPosition && (
                <div className="crypto-info">
                    <div className="crypto-details-box">
                        <p>
                            <b>
                                Current Holdings:{" "}
                                {formatNumber(current_holdings)}{" "}
                                {selectedCrypto}
                            </b>
                        </p>
                        <p>
                            <b>Current Value: ${formatNumber(curr_value)}</b>
                        </p>
                        <p>
                            <b>Original Value: ${formatNumber(og_value)}</b>
                        </p>
                        <p>
                            <b>
                                Profit:{" "}
                                <span
                                    style={
                                        diff > 0
                                            ? { color: "#28a745" }
                                            : { color: "#a2332d" }
                                    }>
                                    ${formatNumber(diff)}
                                </span>
                            </b>
                        </p>
                    </div>
                </div>
            )}
            {selectedCrypto && (
                <div>
                    <h3>Crypto Data</h3>
                    <div className="price-type-checkboxes">
                        {priceOptions.map((option) => (
                            <label key={option.value}>
                                <input
                                    type="checkbox"
                                    checked={selectedPrices.includes(
                                        option.value
                                    )}
                                    onChange={() =>
                                        handlePriceTypeChange(option.value)
                                    }
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    <div className="interval-span-dropdowns">
                        <select
                            className={`form-select small-dropdown ${
                                interval ? "small-text-select" : ""
                            }`}
                            value={interval}
                            onChange={handleIntervalChange}>
                            {intervals.map((option, index) => (
                                <option
                                    key={index}
                                    value={option.value || option}>
                                    {option.label || option}
                                </option>
                            ))}
                        </select>
                        <select
                            className={`form-select small-dropdown ${
                                span ? "small-text-select" : ""
                            }`}
                            value={span}
                            onChange={handleSpanChange}>
                            {spans.map((option, index) => (
                                <option
                                    key={index}
                                    value={option.value || option}>
                                    {option.label || option}
                                </option>
                            ))}
                        </select>
                        <button
                            className="get-graph-btn"
                            onClick={fetchCryptoGraph}>
                            Graph
                        </button>
                    </div>
                </div>
            )}
            {showRemoveButton && (
                <button
                    onClick={onRemove}
                    className="remove-section-btn bottom-right">
                    -
                </button>
            )}
            {showModal && (
                <Modal
                    title={
                        selectedCrypto +
                        ": Time vs. Price (Every " +
                        intervalWord +
                        " over " +
                        spanWord +
                        ")"
                    }
                    image={imageDiv}
                    form={
                        <AiForm
                            selectedCrypto={selectedCrypto}
                            graphData={graphData}
                            interval={interval}
                            span={span}
                        />
                    }
                    onClose={closeModal}></Modal>
            )}
        </div>
    );
};

export default TrackCryptoSection;
