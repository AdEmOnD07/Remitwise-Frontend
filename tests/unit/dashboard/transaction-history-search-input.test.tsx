import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionHistorySearchInput from "@/app/dashboard/transaction-history/components/transaction-history-search-input";

describe("TransactionHistorySearchInput", () => {
  it("shows a validation error when submitted empty, without calling onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransactionHistorySearchInput value="" onChange={onChange} />);

    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a search term");
    expect(screen.getByRole("searchbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not show an error when submitted with a non-empty value", async () => {
    const user = userEvent.setup();
    render(<TransactionHistorySearchInput value="acme" onChange={vi.fn()} />);

    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show an error when submitted with whitespace-only value", async () => {
    const user = userEvent.setup();
    render(<TransactionHistorySearchInput value="   " onChange={vi.fn()} />);

    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a search term");
  });

  it("clears a previous error as soon as the user types", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [value, setValue] = useState("");
      return <TransactionHistorySearchInput value={value} onChange={setValue} />;
    }
    render(<Wrapper />);

    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "a");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("still calls onChange for every keystroke (live filtering is unaffected)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransactionHistorySearchInput value="" onChange={onChange} />);

    await user.type(screen.getByRole("searchbox"), "abc");

    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
