import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCoAdmin from "../src/app/pages/system_admin/co_admin/create/page";
import useAuth from "../hooks/useSession";

jest.mock("../hooks/useSession", () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Mock roles and permissions
jest.mock("../src/constant/adminroles", () => ({
    roles: [
        { value: "admin", label: "Admin" },
        { value: "co-admin", label: "co-admin" },
    ],
}));

jest.mock("../src/constant/adminPermission", () => ({
    availablePermissions: [
        { id: "add_co_admin", label: "Add Co-admin" },
        { id: "approve_properties", label: "Approve Properties" },
    ],
}));


describe("CreateCoAdmin Component", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({ admin: { username: "admin" }, loading: false, error: null });
        render(<CreateCoAdmin />);
    });

    test("renders the form elements", () => {
        expect(screen.getByText(/Add New Co-Admin/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Permissions/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Create Co-Admin/i })).toBeInTheDocument();
    });

    test("updates input fields on change", () => {
        const usernameInput = screen.getByLabelText(/Username/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const firstNameInput = screen.getByLabelText(/First Name/i);
        const lastNameInput = screen.getByLabelText(/Last Name/i);

        fireEvent.change(usernameInput, { target: { value: "testadmin" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(firstNameInput, { target: { value: "John" } });
        fireEvent.change(lastNameInput, { target: { value: "Doe" } });

        expect(usernameInput.value).toBe("testadmin");
        expect(emailInput.value).toBe("test@example.com");
        expect(firstNameInput.value).toBe("John");
        expect(lastNameInput.value).toBe("Doe");
    });

    test("selects a role from dropdown", () => {
        const roleSelect = screen.getByLabelText(/Role/i);
        fireEvent.change(roleSelect, { target: { value: "editor" } });

        expect(roleSelect.value).toBe("editor");
    });

    test("checks and unchecks permissions", () => {
        const permissionCheckbox = screen.getByLabelText(/Manage Users/i);

        fireEvent.click(permissionCheckbox);
        expect(permissionCheckbox.checked).toBe(true);

        fireEvent.click(permissionCheckbox);
        expect(permissionCheckbox.checked).toBe(false);
    });

    test("submits the form with valid data", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ message: "Admin registered successfully." }),
            })
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const firstNameInput = screen.getByLabelText(/First Name/i);
        const lastNameInput = screen.getByLabelText(/Last Name/i);
        const roleSelect = screen.getByLabelText(/Role/i);
        const submitButton = screen.getByRole("button", { name: /Create Co-Admin/i });

        fireEvent.change(usernameInput, { target: { value: "testadmin" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(firstNameInput, { target: { value: "John" } });
        fireEvent.change(lastNameInput, { target: { value: "Doe" } });
        fireEvent.change(roleSelect, { target: { value: "admin" } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Admin registered successfully.")).toBeInTheDocument();
        });
    });

    test("displays an error message on failed submission", async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve ({ error: "Something went wrong." }),
            })
        );

        const submitButton = screen.getByRole("button", { name: /Create Co-Admin/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
        });
    });
});