"use client";

import { NavButton } from "./NavButton";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="navTitle">MCP Playground</div>

      <nav className="navList">
        <NavButton href="/agents" label="Agents" />
        <NavButton href="/servers" label="MCP-Servers" />
        <NavButton href="/tools" label="MCP-Tools (registered)" />
        <NavButton href="/chat" label="Chat" />
      </nav>
    </aside>
  );
}
