import Select from "react-select";

const getCustomStyles = (textSize) => ({
    control: (provided) => ({
        ...provided,
        backgroundColor: "white",
        borderColor: "#ccc",
        minHeight: textSize === "big" ? "48px" : "36px",
        height: textSize === "big" ? "48px" : "36px",
        boxShadow: "none",
        "&:hover": {
            borderColor: "#aaa",
        },
        fontSize: textSize === "big" ? "1.2rem" : "0.9rem",
    }),
    valueContainer: (provided) => ({
        ...provided,
        height: textSize === "big" ? "48px" : "36px",
        padding: "0 6px",
    }),
    input: (provided) => ({
        ...provided,
        margin: "0px",
        caretColor: "transparent",
    }),
    indicatorSeparator: () => ({
        display: "none",
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        padding: textSize === "big" ? "8px" : "5px",
    }),
    option: (provided, { isFocused, isSelected }) => ({
        ...provided,
        backgroundColor: isFocused ? "lightgray" : "white",
        color: "black",
        cursor: "pointer",
        "&:active": {
            backgroundColor: !isSelected ? "lightgray" : "darkblue",
        },
        fontSize: textSize === "big" ? "1.2rem" : "0.9rem",
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 5,
    }),
});

const DropdownCheckbox = ({
    options,
    selectedOptions,
    isMulti,
    setSelectedOptions,
    placeholder,
    textSize = "small", // Default value
}) => {
    const customStyles = getCustomStyles(textSize);

    return (
        <Select
            options={options}
            value={selectedOptions}
            onChange={setSelectedOptions}
            isMulti={isMulti}
            closeMenuOnSelect={!isMulti}
            styles={customStyles}
            placeholder={placeholder}
        />
    );
};

export default DropdownCheckbox;
