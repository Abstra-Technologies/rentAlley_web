import '@testing-library/jest-dom';

jest.mock("lucide-react", () => ({
    AlertCircle: () => "Mocked Icon",
}));

jest.mock("lucide-react", () => ({
    AlertTriangle: () => "Mocked Icon",
}));