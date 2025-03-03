import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../src/app/pages/auth/login/page";
import { useRouter } from "next/navigation";
import useAuthStore from "../src/zustand/authStore";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("../src/zustand/authStore", () => ({
    __esModule: true,
    default: () => ({ user: null, admin: null }),
}));

jest.mock("../src/lib/firebaseMessaging", () => ({
    getMessaging: jest.fn(() => ({
        usePublicVapidKey: jest.fn(),
    })),
}));


describe("Login Component", () => {
    let mockPush;

    beforeEach(() => {
        mockPush = jest.fn();
        useRouter.mockReturnValue({ push: mockPush });

        render(<Login />);
    });

    test("renders the login form", () => {
        expect(screen.getByText(/Rentahan Logo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    test("updates state when user types in input fields", () => {
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: "bryanqlim@gmail.com" } });
        fireEvent.change(passwordInput, { target: { value: "admin123" } });

        expect(emailInput.value).toBe("bryanqlim@gmail.com");
        expect(passwordInput.value).toBe("admin123");
    });

    test("displays validation error when email is invalid", () => {
        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.blur(emailInput); // Simulate user clicking away

        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    test("triggers form submission", async () => {
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const loginButton = screen.getByRole("button", { name: /login/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalled();
        });
    });
});