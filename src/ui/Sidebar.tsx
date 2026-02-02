"use client";

import { NavButton } from "./NavButton";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="navTitle">MCP Playground</div>

      <nav className="navList">
        <NavButton href="/servers" label="MCP-Tool Registration" />
        <NavButton href="/tools" label="Registered MCP-Tools" />
        <NavButton href="/agents" label="Agent Configuration" />
        <NavButton href="/chat" label="Chat" />
        <NavButton href="/test" label="Test" />
      </nav>
    </aside>
  );
}
