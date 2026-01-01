"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import type { ServerTool } from "@/models/mcpServerTool";
import type { ToolSchema, ToolArg, EmptyDefault } from "@/models/toolSchema";
import { saveToolSchema } from "@/features/tools/toolschemas.storage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tool: ServerTool | null;
  serverUrl: string | null;
};

type ParamFieldKey = "name_for_llm" | "description" | "type" | "default";
type ParamLlmDraft = Record<
  string, // paramName
  Record<ParamFieldKey, string>
>;

const LABELS: Record<ParamFieldKey, string> = {
  name_for_llm: "Name (for LLM)",
  description: "Description",
  type: "Type",
  default: "Default",
};

type ServerParamDef = {
  type?: string;
  description?: string;
  default?: unknown;
};

export function ToolRegisterModal({ isOpen, onClose, tool, serverUrl }: Props) {
  const serverName = tool?.function.name ?? "";
  const serverDescription = tool?.function.description ?? "";

  const [nameForLlm, setNameForLlm] = useState(serverName);
  const [descriptionForLlm, setDescriptionForLlm] = useState(serverDescription);

  const [paramDraft, setParamDraft] = useState<ParamLlmDraft>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const properties = useMemo(() => {
    const props = tool?.function.parameters?.properties ?? {};
    return Object.entries(props);
  }, [tool]);

  const getServerParamValue = (
    paramName: string,
    field: ParamFieldKey
  ): string => {
    const rawDef = tool?.function.parameters?.properties?.[paramName];
    if (!rawDef) return "";

    const def = rawDef as ServerParamDef;

    switch (field) {
      case "name_for_llm":
        return paramName;

      case "type":
        return def.type ?? "";

      case "description":
        return def.description ?? "";

      case "default": {
        const d = def.default;
        if (d === undefined || d === null) return "";
        return typeof d === "string" ? d : JSON.stringify(d);
      }

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
        name_for_llm:
          prev[paramName]?.name_for_llm ??
          getServerParamValue(paramName, "name_for_llm"),
        description:
          prev[paramName]?.description ??
          getServerParamValue(paramName, "description"),
        type: prev[paramName]?.type ?? getServerParamValue(paramName, "type"),
        default:
          prev[paramName]?.default ?? getServerParamValue(paramName, "default"),
        [field]: value,
      },
    }));
  };

  const parseDefaultValue = (raw: string): string | EmptyDefault | null => {
    const v = raw.trim();
    if (!v) return null;

    if (v === "EmptyDefault" || v === '{"kind":"EmptyDefault"}') {
      return { kind: "EmptyDefault" };
    }
    return v;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      if (!tool) throw new Error("No tool selected.");
      if (!serverUrl) throw new Error("No server url provided.");
      if (!serverName.trim()) throw new Error("Tool name (server) missing.");

      const params = tool.function.parameters;
      const requiredList = params?.required ?? [];
      const props = params?.properties ?? {};

      const argList: ToolArg[] = Object.entries(props).map(
        ([paramName, def]) => {
          const llmName = getLlmParamValue(paramName, "name_for_llm");
          const llmType = getLlmParamValue(paramName, "type");
          const llmDescription = getLlmParamValue(paramName, "description");
          const llmDefaultRaw = getLlmParamValue(paramName, "default");

          const required = requiredList.includes(paramName);

          return {
            name_on_server: paramName,
            name_for_llm: llmName?.trim() ? llmName.trim() : paramName,
            description_for_llm: llmDescription?.trim()
              ? llmDescription.trim()
              : "",
            type: llmType?.trim() ? llmType.trim() : def.type ?? "string",
            required,
            default: parseDefaultValue(llmDefaultRaw),
          };
        }
      );

      const schema: ToolSchema = {
        server_url: serverUrl,
        name_on_server: serverName,
        name_for_llm: nameForLlm.trim() ? nameForLlm.trim() : serverName,
        description_for_llm: descriptionForLlm?.trim()
          ? descriptionForLlm.trim()
          : "",
        args_schema: {
          type: "object",
          properties: argList,
          additionalProperties: false,
        },
      };

      await saveToolSchema(schema);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => onClose();

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
            <div className="formField">
              <div className="formLabel">Tool name (server)</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {serverName || "-"}
              </pre>
            </div>

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
            <div className="formField">
              <div className="formLabel">Tool description (server)</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {serverDescription || "-"}
              </pre>
            </div>

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

                      {(Object.keys(LABELS) as ParamFieldKey[]).map((row) => {
                        const label = LABELS[row];
                        const serverVal = getServerParamValue(paramName, row);
                        const llmVal = getLlmParamValue(paramName, row);

                        return (
                          <div
                            key={row}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 16,
                              marginBottom: 8,
                            }}
                          >
                            <div className="formField">
                              <div className="formLabel">{label}</div>
                              <div>{serverVal?.trim() ? serverVal : "-"}</div>
                            </div>

                            <div>
                              <TextInput
                                label={label}
                                value={llmVal}
                                onChange={(v) =>
                                  setLlmParamValue(paramName, row, v)
                                }
                                placeholder={serverVal}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {saveError ? <div className="formError">{saveError}</div> : null}

          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <Button
              label={isSaving ? "Saving..." : "Save as tool for agents!"}
              onClick={handleSave}
              disabled={isSaving || !tool || !serverUrl || !nameForLlm.trim()}
            />
            <Button label="Cancel" onClick={handleClose} disabled={isSaving} />
          </div>
        </>
      )}
    </Modal>
  );
}
