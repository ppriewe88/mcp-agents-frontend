"use client";

import styles from "@/app/servers/page.module.css";
import { Card } from "@/ui/Card";
import type { ServerTool } from "@/models/mcpServerTool";
import { Button } from "@/ui/Button";

type Props = {
  tools: ServerTool[];
  toolsError: string | null;
  serverUrl: string | null;
  onRegisterTool: (tool: ServerTool) => void;
};

export function ServerToolsList({
  tools,
  toolsError,
  serverUrl,
  onRegisterTool,
}: Props) {
  if (toolsError) return <div className="formError">{toolsError}</div>;
  if (tools.length === 0) return <div>No tools loaded.</div>;

  return (
    <div className={styles.grid}>
      {tools.map((tool) => (
        <Card
          key={tool.function.name}
          dataContainer="__virtual__"
          dataId="__virtual__"
          title={tool.function.name}
        >
          {serverUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Server Url</div>
              <pre style={{ whiteSpace: "pre-wrap" }}>{serverUrl}</pre>
            </div>
          )}

          {tool.function.description && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Description
              </div>
              <div className={styles.scrollBoxSmall}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {tool.function.description}
                </pre>
              </div>
            </div>
          )}

          {tool.function.parameters && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Parameters</div>
              <div className={styles.scrollBox}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {JSON.stringify(tool.function.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <Button label="Register" onClick={() => onRegisterTool(tool)} />
          </div>
        </Card>
      ))}
    </div>
  );
}
