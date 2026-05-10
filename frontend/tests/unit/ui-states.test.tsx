import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { ErrorAlert } from "../../src/components/ui/ErrorAlert";
import { FormField, TextInput } from "../../src/components/ui/FormField";
import { LoadingState } from "../../src/components/ui/LoadingState";

describe("UI state primitives", () => {
  it("renders loading, empty, error, and validation feedback states", () => {
    render(
      <>
        <LoadingState label="Loading tasks" />
        <EmptyState title="No tasks yet" />
        <ErrorAlert message="Something failed" />
        <FormField label="Project name" error="Required">
          <TextInput />
        </FormField>
      </>
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading tasks");
    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    const alerts = screen.getAllByRole("alert").map((alert) => alert.textContent).join(" ");
    expect(alerts).toMatch(/something failed/i);
    expect(alerts).toMatch(/required/i);
  });
});
