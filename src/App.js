import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import TradeDataTable from "./TradeDataTable/TradeDataTable.js";
import TrackCryptoSection from "./TrackCryptoSection/TrackCryptoSection.js";
import BuyCryptoSection from "./BuyCryptoSection/BuyCryptoSection.js";

function formatNumber(value) {
    // Create an Intl.NumberFormat object for formatting
    const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2, // Ensure at least two digits after the decimal
        maximumFractionDigits: Math.abs(value) < 0.01 && value !== 0 ? 3 : 2, // Use 3 digits after the decimal for small non-zero values, otherwise 2
    });

    if (Math.abs(value) < 0.01 && value !== 0) {
        return value.toExponential(3); // Use exponential notation for very small non-zero values
    } else {
        return formatter.format(value); // Format the number with commas and fixed decimal places
    }
}

const App = () => {
    const [trades, setTrades] = useState([]);
    const [availableCash, setAvailableCash] = useState("");
    const [profit, setProfit] = useState("");
    const [cryptos, setCryptos] = useState([]);
    const [positions, setPositions] = useState({});
    const [trackSections, setTrackSections] = useState([{ id: 1 }]); // Initially one TrackCryptoSection

    const addTrackSection = () => {
        const newSection = { id: Date.now() + Math.random() };
        setTrackSections([...trackSections, newSection]);
    };

    const removeTrackSection = (id) => {
        setTrackSections(trackSections.filter((section) => section.id !== id));
    };

    const fetchPositions = useCallback(async () => {
        try {
            const response = await fetch("/positions");
            const data = await response.json();
            console.log(data);
            setPositions(data.positions); // Store the response in the positions state
        } catch (error) {
            console.error("Failed to fetch positions:", error);
        }
    }, []);

    const fetchTradesData = useCallback(async () => {
        try {
            const response = await fetch("/get-trades");
            const data = await response.json();
            // Check if the trades array size has changed
            if (data.length !== trades.length) {
                setTrades(data); // Update the trades state only if there's a change
                fetchPositions(); // Fetch positions if the trades array size has changed
            }
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        }
    }, [trades.length, fetchPositions]);

    const fetchAccountInfo = useCallback(async () => {
        try {
            const response = await fetch("/account_info");
            const data = await response.json();
            const cash = parseFloat(
                data.account_info.cash_available_for_withdrawal
            ).toFixed(2);
            setAvailableCash(cash);
        } catch (error) {
            console.error("Failed to fetch account info:", error);
        }
    }, []);

    const fetchCryptos = useCallback(async () => {
        try {
            const response = await fetch("/get-cryptos");
            const data = await response.json();
            setCryptos(data.cryptos);
        } catch (error) {
            console.error("Failed to fetch cryptos:", error);
        }
    }, []);

    const fetchProfit = useCallback(async () => {
        try {
            const response = await fetch("/todays-change");
            const data = await response.json();
            setProfit(data.successfulTradesSum.toFixed(2));
        } catch (error) {
            console.error("Failed to fetch profit:", error);
        }
    }, []);

    const currentDate = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });

    const fetchInitialData = useCallback(async () => {
        fetchTradesData();
        fetchAccountInfo();
        fetchCryptos();
        fetchProfit();
    }, [fetchTradesData, fetchAccountInfo, fetchCryptos, fetchProfit]);

    useEffect(() => {
        fetchInitialData();
        fetchPositions();
        const cashInterval = setInterval(fetchAccountInfo, 600000); // 10 minutes
        const profitInterval = setInterval(fetchProfit, 10000); // 10 seconds
        const tradeInterval = setInterval(fetchTradesData, 10000); // 10 seconds

        return () => {
            clearInterval(cashInterval);
            clearInterval(profitInterval);
            clearInterval(tradeInterval);
        };
    }, [
        fetchInitialData,
        fetchPositions,
        fetchAccountInfo,
        fetchProfit,
        fetchTradesData,
    ]);

    return (
        <div className="container">
            <div className="financial-info">
                <div className="available-cash">
                    Available Cash: ${availableCash}
                </div>
                <div className="profit">Profit: ${profit}</div>
            </div>
            <div className="sections-container">
                <div className="crypto-sections-container">
                    <BuyCryptoSection
                        cryptos={cryptos}
                        availableCash={availableCash}
                        formatNumber={formatNumber}
                    />
                    {trackSections.map((section, index) => (
                        <TrackCryptoSection
                            key={section.id}
                            cryptos={cryptos}
                            positions={positions}
                            showRemoveButton={index !== 0} // Show the button for all but the first section
                            onRemove={() => removeTrackSection(section.id)} // Pass the remove function
                            onAdd={addTrackSection}
                            formatNumber={formatNumber}
                        />
                    ))}
                </div>
                <div className="trade-log-section">
                    <h1>Trade Log</h1>
                    <div className="current-date">{currentDate}</div>
                    <TradeDataTable
                        trades={trades}
                        formatNumber={formatNumber}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
