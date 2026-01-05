"use client";
import { useState, useEffect, useRef } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/high-res.css";

interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

const MobileInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  onBlur,
}: MobileInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isButtonFocused, setIsButtonFocused] = useState(false);

  const handlePhoneChange = (newValue: string) => {
    if (!newValue.startsWith("+")) {
      newValue = "+" + newValue;
    }
    onChange(newValue);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Set up focus handlers for the button after component mounts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const flagButton = container.querySelector(
      ".flag-dropdown button"
    ) as HTMLElement;
    const textInput = container.querySelector(
      'input[type="tel"]'
    ) as HTMLElement;

    if (flagButton && textInput) {
      // Add focus handlers for the flag button
      const handleButtonFocus = () => setIsButtonFocused(true);
      const handleButtonBlur = () => setIsButtonFocused(false);

      flagButton.addEventListener("focus", handleButtonFocus);
      flagButton.addEventListener("blur", handleButtonBlur);

      // Set tab order: text input first, then button
      textInput.tabIndex = 0;
      flagButton.tabIndex = 1;

      // Cleanup event listeners
      return () => {
        flagButton.removeEventListener("focus", handleButtonFocus);
        flagButton.removeEventListener("blur", handleButtonBlur);
      };
    }
  }, []);

  // Get border color for button
  const getButtonBorderColor = () => {
    const color = hasError
      ? "#e40f1c"
      : isButtonFocused
        ? "#104e6a"
        : "#E5E6EB";
    console.log(
      "Button border color:",
      color,
      "isButtonFocused:",
      isButtonFocused,
      "hasError:",
      hasError
    );
    return color;
  };

  // Get border color for input
  const getInputBorderColor = () => {
    const color = hasError ? "#e40f1c" : isInputFocused ? "#104e6a" : "#E5E6EB";
    console.log(
      "Input border color:",
      color,
      "isInputFocused:",
      isInputFocused,
      "hasError:",
      hasError
    );
    return color;
  };

  return (
    <div ref={containerRef}>
      <PhoneInput
        countryCodeEditable={false}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={handlePhoneChange}
        onBlur={handleInputBlur} // Re-added for input handling
        onFocus={handleInputFocus} // Re-added for input handling
        country="lk"
        masks={{ lk: ".. ... ...." }}
        containerStyle={{
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          position: "relative",
          border: "none",
          borderRadius: "0px",
          height: 40,
        }}
        buttonStyle={{
          width: "52px",
          border: `1px solid ${getButtonBorderColor()}`,
          borderRadius: "5px",
        }}
        inputStyle={{
          marginLeft: 60,
          width: "100%",
          padding: "8px 12px",
          height: "100%",
          border: `1px solid ${getInputBorderColor()}`,
          borderRadius: "5px",
        }}
        dropdownClass="customDropdown"
        dropdownStyle={{
          left: 0,
          width: "100% !important",
          right: 0,
          borderRadius: "10px",
          position: "absolute",
          scrollbarWidth: "none",
          border: "1px solid #E5E6EB",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
      />
    </div>
  );
};

export default MobileInput;
