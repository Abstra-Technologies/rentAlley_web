import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LoginAdmin from "@/src/app/pages/admin_login/page";


// Mock next/router for testing
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

describe("Admin Login Page", () => {
    let mockPush;

    beforeEach(() => {
        mockPush = jest.fn();
        (useRouter).mockReturnValue({ push: mockPush });
    });

    test("renders login form correctly", () => {
        render(<LoginAdmin />);

        expect(screen.getByText("Rentahan Admin Portal")).toBeInTheDocument();
        expect(screen.getByLabelText("Email or Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    test("updates input fields correctly", () => {
        render(<LoginAdmin />);

        const loginInput = screen.getByLabelText("Email or Username");
        const passwordInput = screen.getByLabelText("Password");

        fireEvent.change(loginInput, { target: { value: "bryanqlim@gmail.com" } });
        fireEvent.change(passwordInput, { target: { value: "admin123" } });

        expect(loginInput.value).toBe("admin");
        expect(passwordInput.value).toBe("password123");
    });

    test("displays an error message on failed login", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: "Invalid credentials." }),
            })
        );

        render(<LoginAdmin />);

        fireEvent.change(screen.getByLabelText("Email or Username"), {
            target: { value: "wronguser" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "wrongpassword" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Login" }));

        await waitFor(() =>
            expect(screen.getByText("Invalid credentials.")).toBeInTheDocument()
        );
    });

    test("redirects to dashboard on successful login", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            })
        );

        render(<LoginAdmin />);

        fireEvent.change(screen.getByLabelText("Email or Username"), {
            target: { value: "admin" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "correctpassword" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Login" }));

        await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/pages/system_admin/dashboard"));
    });

    test("shows account lock message after 3 failed attempts", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: "Invalid credentials." }),
            })
        );

        render(<LoginAdmin />);

        const loginButton = screen.getByRole("button", { name: "Login" });

        for (let i = 0; i < 3; i++) {
            fireEvent.change(screen.getByLabelText("Email or Username"), {
                target: { value: "admin" },
            });
            fireEvent.change(screen.getByLabelText("Password"), {
                target: { value: "wrongpassword" },
            });

            fireEvent.click(loginButton);

            await waitFor(() =>
                expect(screen.getByText("Invalid credentials.")).toBeInTheDocument()
            );
        }

        await waitFor(() =>
            expect(
                screen.getByText("Too many failed attempts. Please try again later.")
            ).toBeInTheDocument()
        );
    });
});
