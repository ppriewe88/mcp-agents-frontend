"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import type { ServerTool } from "@/models/mcpServerTool";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tool: ServerTool | null;
  serverUrl: string | null;
};

export function ToolRegisterModal({ isOpen, onClose, tool, serverUrl }: Props) {
  const serverName = tool?.function.name ?? "";
  const serverDescription = tool?.function.description ?? "";
  const [nameForLlm, setNameForLlm] = useState(serverName);
  const [descriptionForLlm, setDescriptionForLlm] = useState(serverDescription);

  type ParamFieldKey = "description" | "title" | "type" | "default";
  type ParamLlmDraft = Record<
    string, // paramName
    Record<ParamFieldKey, string>
  >;
  const [paramDraft, setParamDraft] = useState<ParamLlmDraft>({});

  const properties = useMemo(() => {
    const props = tool?.function.parameters?.properties ?? {};
    return Object.entries(props);
  }, [tool]);

  const getServerParamValue = (
    paramName: string,
    field: ParamFieldKey
  ): string => {
    const def = tool?.function.parameters?.properties?.[paramName];
    if (!def) return "";

    switch (field) {
      case "title":
        return def.title ?? "";
      case "type":
        return def.type ?? "";
      case "description":
        // ServerToolParameterDefinition hat aktuell keine description
        return "";
      case "default":
        // ServerToolParameterDefinition hat aktuell kein default
        return "";
      default:
        return "";
    }
  };

  const getLlmParamValue = (
    paramName: string,
    field: ParamFieldKey
  ): string => {
    const existing = paramDraft[paramName]?.[field];
    if (typeof existing === "string") return existing;

    // Default: Serverwert als Vorbelegung
    return getServerParamValue(paramName, field);
  };

  const setLlmParamValue = (
    paramName: string,
    field: ParamFieldKey,
    value: string
  ) => {
    setParamDraft((prev) => ({
      ...prev,
      [paramName]: {
        description:
          prev[paramName]?.description ??
          getServerParamValue(paramName, "description"),
        title:
          prev[paramName]?.title ?? getServerParamValue(paramName, "title"),
        type: prev[paramName]?.type ?? getServerParamValue(paramName, "type"),
        default:
          prev[paramName]?.default ?? getServerParamValue(paramName, "default"),
        [field]: value,
      },
    }));
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title="Register Tool" onClose={handleClose}>
      {!tool ? (
        <div className="formError">No tool selected.</div>
      ) : (
        <>
          {/* Server Url */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Server Url</div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {serverUrl ?? "-"}
            </pre>
          </div>

          {/* Tool name: server vs llm */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            {/* LEFT: server */}
            <div className="formField">
              <div className="formLabel">Tool name (server)</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {serverName || "-"}
              </pre>
            </div>

            {/* RIGHT: llm */}
            <div>
              <TextInput
                label="Tool name (for llm)"
                value={nameForLlm}
                onChange={setNameForLlm}
                placeholder="e.g. add_numbers"
              />
            </div>
          </div>

          {/* Tool description: server vs llm */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            {/* LEFT: server */}
            <div className="formField">
              <div className="formLabel">Tool description (server)</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {serverDescription || "-"}
              </pre>
            </div>

            {/* RIGHT: llm */}
            <div>
              <TextArea
                label="Tool description (for llm)"
                value={descriptionForLlm}
                onChange={setDescriptionForLlm}
                placeholder="Describe what the tool does for the LLM..."
                rows={6}
              />
            </div>
          </div>

          {/* Parameters */}
          <div style={{ marginTop: 24 }}>
            <div className="formLabel" style={{ marginBottom: 12 }}>
              Parameters
            </div>

            <div className="scrollBox">
              {properties.length === 0 ? (
                <div>-</div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {properties.map(([paramName]) => (
                    <div key={paramName}>
                      {/* Parameter headline */}
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 8,
                          borderBottom: "1px solid #eee",
                          paddingBottom: 4,
                        }}
                      >
                        Parameter: {paramName}
                      </div>

                      {/* Matrix header */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                          marginBottom: 8,
                        }}
                      >
                        <div className="formLabel">Server</div>
                        <div className="formLabel">For LLM</div>
                      </div>

                      {/* Matrix rows */}
                      {["description", "title", "type", "default"].map(
                        (row) => (
                          <div
                            key={row}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 16,
                              marginBottom: 8,
                            }}
                          >
                            {/* Server column */}
                            <div className="formField">
                              <div className="formLabel">
                                {row.charAt(0).toUpperCase() + row.slice(1)}
                              </div>
                              <div>-</div>
                            </div>

                            {/* LLM column */}
                            <div className="formField">
                              <div className="formLabel">
                                {row.charAt(0).toUpperCase() + row.slice(1)}
                              </div>
                              <div>-</div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <Button label="Close" onClick={handleClose} />
          </div>
        </>
      )}
    </Modal>
  );
}
