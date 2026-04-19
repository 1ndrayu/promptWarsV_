import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';

describe('Login Page Smoke Tests', () => {
  it('renders the login portal correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('handles empty state submissions gracefully', () => {
    render(<LoginPage />);
    const submitButton = screen.getByText('Enter Portal');
    expect(submitButton).not.toBeDisabled(); // Button should be clickable initially
  });

  // Edge case: Testing mock missing components
  it('displays the abstract background element', () => {
    const { container } = render(<LoginPage />);
    const abstractBg = container.querySelector('.absolute.-top-24.-right-24');
    expect(abstractBg).toBeInTheDocument();
  });
});
