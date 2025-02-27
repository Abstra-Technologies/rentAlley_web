import { render, screen } from '@testing-library/react';
import Greeting from '../greeting';

test('renders greeting with provided name', () => {
    render(<Greeting name="Next.js" />);
    const greetingElement = screen.getByText(/Hello, Next.js!/i);
    expect(greetingElement).toBeInTheDocument();
});
