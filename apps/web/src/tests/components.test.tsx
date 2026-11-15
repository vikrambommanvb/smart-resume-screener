import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Button,
  Badge,
  Progress,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui";

describe("UI Primitives Component Tests", () => {
  it("renders Button correctly and handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles Button disabled and loading states", () => {
    const handleClick = vi.fn();
    const { rerender } = render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const btn = screen.getByRole("button", { name: /disabled/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();

    rerender(<Button isLoading onClick={handleClick}>Loading</Button>);
    const loadingBtn = screen.getByRole("button", { name: /loading/i });
    expect(loadingBtn).toBeDisabled();
    expect(loadingBtn).toHaveAttribute("aria-busy", "true");
  });

  it("renders Badge variants with correct monospace tracking", () => {
    render(
      <>
        <Badge variant="warning">Missing Skill</Badge>
        <Badge variant="success">Matched</Badge>
      </>
    );

    const warnBadge = screen.getByText(/missing skill/i);
    expect(warnBadge).toHaveClass("font-mono");
    expect(warnBadge).toHaveClass("uppercase");
  });

  it("renders Progress with accessible ARIA values", () => {
    render(<Progress value={42} max={100} showLabel />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("switches Tab panels when clicking tab triggers", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabList>
          <TabTrigger value="tab1">First</TabTrigger>
          <TabTrigger value="tab2">Second</TabTrigger>
        </TabList>
        <TabContent value="tab1">First Content</TabContent>
        <TabContent value="tab2">Second Content</TabContent>
      </Tabs>
    );

    expect(screen.getByText("First Content")).toBeInTheDocument();
    expect(screen.queryByText("Second Content")).not.toBeInTheDocument();

    const secondTab = screen.getByRole("tab", { name: /second/i });
    fireEvent.click(secondTab);

    expect(screen.queryByText("First Content")).not.toBeInTheDocument();
    expect(screen.getByText("Second Content")).toBeInTheDocument();
  });

  it("toggles Accordion items on trigger click", () => {
    render(
      <Accordion type="single">
        <AccordionItem value="acc-1">
          <AccordionTrigger>Toggle Question</AccordionTrigger>
          <AccordionContent>Hidden Answer Text</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.queryByText("Hidden Answer Text")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: /toggle question/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden Answer Text")).toBeInTheDocument();
  });
});
