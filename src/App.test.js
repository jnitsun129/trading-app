import { render, screen } from "@testing-library/react";
import App from "./App";

test("Trade Log", () => {
    render(<App />);
    const linkElement = screen.getByText(/Trade Log/i);
    expect(linkElement).toBeInTheDocument();
});
