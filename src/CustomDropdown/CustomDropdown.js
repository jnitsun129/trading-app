// CustomDropdown.js
import React, { useState, useRef, useEffect } from "react";
import "./CustomDropdown.css"; // Ensure you create this CSS file with styles for your custom dropdown
const CustomDropdown = ({ options, selectedValue, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    return (
        <div className="custom-dropdown-container" ref={containerRef}>
            <div
                className={`custom-dropdown-selected ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}>
                {selectedValue || placeholder}
            </div>
            {isOpen && (
                <div className="custom-dropdown-list">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-dropdown-item ${
                                selectedValue === option.value ? "selected" : ""
                            }`}
                            onClick={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}>
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
