import React, { useState } from "react";
import "./AiForm.css";

const AiForm = ({ selectedCrypto, graphData, interval, span }) => {
    const [showTextArea, setShowTextArea] = useState(false);
    const [responseText, setResponseText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleButtonClick = async () => {
        setResponseText("");
        setShowTextArea(false);
        setIsLoading(true);
        try {
            const response = await fetch(
                `/ask-ai/${selectedCrypto}/${interval}/${span}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(graphData),
                }
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const responseData = await response.json();
            setResponseText(responseData.response); // Assuming the response contains a "response" field
            setShowTextArea(true);
        } catch (error) {
            console.error("Failed to fetch AI response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-form">
            <button className="ai-button" onClick={handleButtonClick}>
                Ask AI about {selectedCrypto || "Select a Crypto"}
            </button>
            {isLoading && (
                <div className="loading-container">
                    <img src="./public/loading.gif" alt="Loading" />
                </div>
            )}
            {showTextArea && (
                <div className="ai-response-container">
                    <div className="ai-response-content">{responseText}</div>
                </div>
            )}
        </div>
    );
};

export default AiForm;
