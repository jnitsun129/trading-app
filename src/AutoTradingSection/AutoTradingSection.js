import React, { useState, useEffect } from "react";
import "./AutoTradingSection.css";
import DropdownCheckbox from "../CustomDropdown/CustomDropdown.js";
const { createHeaders } = require("../headers.js");
const API_URL = "http://127.0.0.1:5000";

const AutoTradingSection = ({ cryptos }) => {
    const [selectedCryptos, setSelectedCryptos] = useState([]);
    const [duration, setDuration] = useState("");
    const [timeUnit, setTimeUnit] = useState("seconds");
    const [autoTrading, setAutoTrading] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [intervalId, setIntervalId] = useState(null);

    useEffect(() => {
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [intervalId]);

    const toggleAutoTrading = async () => {
        try {
            const cryptosArray = selectedCryptos.map((option) => option.value);
            const cryptosAsString = cryptosArray.join(",");
            const method = autoTrading ? "POST" : "GET";
            const response = await fetch(
                `${API_URL}/auto-trade/${duration}/${timeUnit}/${cryptosAsString}`,
                {
                    method: method,
                    headers: createHeaders(),
                }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setAutoTrading(!autoTrading);

            if (!autoTrading) {
                startCountdown();
            } else {
                stopCountdown();
            }
        } catch (error) {
            console.error(
                `Failed to ${autoTrading ? "stop" : "start"} auto trading:`,
                error
            );
        }
    };

    const cryptoOptions = cryptos.map((crypto) => ({
        label: crypto,
        value: crypto,
    }));

    const startCountdown = () => {
        const totalSeconds =
            duration *
            (timeUnit === "minutes" ? 60 : timeUnit === "hours" ? 3600 : 1);
        setCountdown(totalSeconds);
        const id = setInterval(() => {
            setCountdown((prevCountdown) => {
                if (prevCountdown <= 1) {
                    clearInterval(id);
                    setAutoTrading(false);
                    setSelectedCryptos([]);
                    return null;
                }
                return prevCountdown - 1;
            });
        }, 1000);
        setIntervalId(id);
    };

    const stopCountdown = () => {
        clearInterval(intervalId);
        setCountdown(null);
    };

    const formatTime = () => {
        let seconds = countdown % 60;
        let minutes = Math.floor(countdown / 60) % 60;
        let hours = Math.floor(countdown / 3600);
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="auto-trading-section">
            <h2>Auto Trading</h2>
            {countdown !== null && (
                <div className="countdown">{formatTime()}</div>
            )}
            <DropdownCheckbox
                options={cryptoOptions}
                selectedOptions={selectedCryptos}
                setSelectedOptions={setSelectedCryptos}
                isMulti={true}
                placeholder="Select Cryptos"
            />
            <div className="time-input">
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="#"
                    className="duration-input"
                />
                <DropdownCheckbox
                    options={[
                        { label: "seconds", value: "seconds" },
                        { label: "minutes", value: "minutes" },
                        { label: "hours", value: "hours" },
                    ]}
                    selectedOptions={{ label: timeUnit, value: timeUnit }}
                    setSelectedOptions={(option) => setTimeUnit(option.value)}
                    isMulti={false}
                    placeholder="Select Time Unit"
                    className="dropdown-container"
                />
                <button
                    onClick={toggleAutoTrading}
                    className={`auto-trading-button ${
                        autoTrading ? "stop" : ""
                    }`}>
                    {autoTrading ? "Stop" : "Start"} Auto Trading
                </button>
            </div>
        </div>
    );
};

export default AutoTradingSection;
