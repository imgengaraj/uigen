import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// create
test("shows 'Creating filename' for create command in progress", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create", path: "/workspace/Card.jsx" }}
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("shows 'Created filename' for create command when done", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/workspace/Card.jsx" }}
      result="success"
    />
  );
  expect(screen.getByText("Created Card.jsx")).toBeDefined();
});

// str_replace
test("shows 'Editing filename' for str_replace command in progress", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "str_replace", path: "/workspace/App.tsx" }}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Edited filename' for str_replace command when done", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "str_replace", path: "/workspace/App.tsx" }}
      result="success"
    />
  );
  expect(screen.getByText("Edited App.tsx")).toBeDefined();
});

// insert
test("shows 'Editing filename' for insert command in progress", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "insert", path: "/workspace/index.ts" }}
    />
  );
  expect(screen.getByText("Editing index.ts")).toBeDefined();
});

test("shows 'Edited filename' for insert command when done", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "insert", path: "/workspace/index.ts" }}
      result="success"
    />
  );
  expect(screen.getByText("Edited index.ts")).toBeDefined();
});

// view
test("shows 'Reading filename' for view command in progress", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "view", path: "/workspace/utils.ts" }}
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("shows 'Read filename' for view command when done", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "view", path: "/workspace/utils.ts" }}
      result="file content"
    />
  );
  expect(screen.getByText("Read utils.ts")).toBeDefined();
});

// undo_edit
test("shows 'Reverting filename' for undo_edit command in progress", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "undo_edit", path: "/workspace/styles.css" }}
    />
  );
  expect(screen.getByText("Reverting styles.css")).toBeDefined();
});

test("shows 'Reverted filename' for undo_edit command when done", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "undo_edit", path: "/workspace/styles.css" }}
      result="success"
    />
  );
  expect(screen.getByText("Reverted styles.css")).toBeDefined();
});

// Unknown / other tools
test("shows tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge toolName="some_other_tool" state="call" args={{}} />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

// Edge cases
test("handles missing path gracefully", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create" }}
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles unknown command gracefully", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "unknown_cmd", path: "/workspace/file.js" }}
    />
  );
  expect(screen.getByText("Processing file.js")).toBeDefined();
});

test("extracts filename from deeply nested path", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create", path: "/some/deep/nested/Component.tsx" }}
    />
  );
  expect(screen.getByText("Creating Component.tsx")).toBeDefined();
});

// Status indicators
test("shows spinner when in progress", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create", path: "/workspace/Card.jsx" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when done", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/workspace/Card.jsx" }}
      result="success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is result but result is null", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/workspace/Card.jsx" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
});
