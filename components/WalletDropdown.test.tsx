import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WalletDropdown from './WalletDropdown';

describe('WalletDropdown Keyboard Navigation', () => {
  const mockOnClose = vi.fn();
  const mockOnConnect = vi.fn();
  const mockOnDisconnect = vi.fn();
  const mockButtonRef = { current: document.createElement('button') };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  it('should focus the first element on open when connected', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    // First interactive element should be the copy button
    const copyBtn = screen.getByLabelText('Copy full wallet address');
    expect(document.activeElement).toBe(copyBtn);
  });

  it('should focus the first element on open when disconnected', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={false}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    const connectBtn = screen.getByRole('button', { name: /connect wallet/i });
    expect(document.activeElement).toBe(connectBtn);
  });

  it('should navigate through elements with ArrowDown and ArrowUp with wrap-around', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    const copyBtn = screen.getByLabelText('Copy full wallet address');
    const accountBtn = screen.getByRole('button', { name: /account/i });
    const settingsBtn = screen.getByRole('button', { name: /settings/i });
    const disconnectBtn = screen.getByRole('button', { name: /disconnect/i });

    // Initial focus on first element (copyBtn)
    expect(document.activeElement).toBe(copyBtn);

    // ArrowDown should move to Account
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(accountBtn);

    // ArrowDown should move to Settings
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(settingsBtn);

    // ArrowDown should move to Disconnect
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(disconnectBtn);

    // ArrowDown should wrap around to copyBtn
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(copyBtn);

    // ArrowUp should wrap around backward to disconnectBtn
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(disconnectBtn);

    // ArrowUp should move back to Settings
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(settingsBtn);
  });

  it('should navigate directly to first and last elements using PageUp and PageDown', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    const copyBtn = screen.getByLabelText('Copy full wallet address');
    const disconnectBtn = screen.getByRole('button', { name: /disconnect/i });

    // Initial focus is on copyBtn. Press PageDown.
    fireEvent.keyDown(document.activeElement!, { key: 'PageDown' });
    expect(document.activeElement).toBe(disconnectBtn);

    // Press PageUp.
    fireEvent.keyDown(document.activeElement!, { key: 'PageUp' });
    expect(document.activeElement).toBe(copyBtn);
  });

  it('should trigger click on focused element when Enter is pressed', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    const disconnectBtn = screen.getByRole('button', { name: /disconnect/i });

    // Focus disconnect button
    disconnectBtn.focus();
    expect(document.activeElement).toBe(disconnectBtn);

    // Press Enter
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(mockOnDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should cycle focus with Tab key', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    const copyBtn = screen.getByLabelText('Copy full wallet address');
    const disconnectBtn = screen.getByRole('button', { name: /disconnect/i });

    // Focus last element
    disconnectBtn.focus();
    expect(document.activeElement).toBe(disconnectBtn);

    // Tab should wrap to first element
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(copyBtn);

    // Shift+Tab on first element should wrap to last element
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(disconnectBtn);
  });

  it('should call onClose when Escape is pressed', () => {
    render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('sad path: handles cases where there are no focusable elements without error', () => {
    // Render the dropdown but mock querySelectorAll to return nothing
    const { container } = render(
      <WalletDropdown
        isOpen={true}
        isConnected={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        buttonRef={mockButtonRef}
      />
    );

    // Spy on querySelectorAll on the dropdown container to return empty list
    const dropdownEl = container.firstChild as HTMLElement;
    const querySpy = vi.spyOn(dropdownEl, 'querySelectorAll').mockReturnValue(
      Object.assign([], { length: 0 }) as any
    );

    // Pressing ArrowDown should not throw
    expect(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowDown' });
    }).not.toThrow();

    querySpy.mockRestore();
  });
});
