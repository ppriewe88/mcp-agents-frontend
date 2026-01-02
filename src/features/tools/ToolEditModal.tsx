"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema, ToolArg, EmptyDefault } from "@/models/toolSchema";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tool: StoredItem<ToolSchema> | null;
  onSave: (patch: ToolSchema) => Promise<void>; // NEW
};

type ParamFieldKey = "name_for_llm" | "description" | "type" | "default";
type ParamLlmDraft = Record<string, Record<ParamFieldKey, string>>;

const LABELS: Record<ParamFieldKey, string> = {
  name_for_llm: "Name (for LLM)",
  description: "Description",
  type: "Type",
  default: "Default",
};

function defaultToString(d: ToolArg["default"]): string {
  if (d === undefined || d === null) return "";
  if (typeof d === "string") return d;
  if (typeof d === "object" && (d as EmptyDefault)?.kind === "EmptyDefault")
    return "EmptyDefault";
  return JSON.stringify(d);
}

function parseDefaultValue(raw: string): string | EmptyDefault | null {
  const v = raw.trim();
  if (!v) return null;

  if (v === "EmptyDefault" || v === '{"kind":"EmptyDefault"}') {
    return { kind: "EmptyDefault" };
  }
  return v;
}

export function ToolEditModal({ isOpen, onClose, tool, onSave }: Props) {
  const serverUrl = tool?.server_url ?? "";
  const serverName = tool?.name_on_server ?? "";

  const [nameForLlm, setNameForLlm] = useState(tool?.name_for_llm ?? "");
  const [descriptionForLlm, setDescriptionForLlm] = useState(
    tool?.description_for_llm ?? ""
  );

  const [paramDraft, setParamDraft] = useState<ParamLlmDraft>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const properties = useMemo(() => {
    const props = tool?.args_schema?.properties ?? [];
    return props;
  }, [tool]);

  const getServerParamValue = (arg: ToolArg, field: ParamFieldKey): string => {
    switch (field) {
      case "name_for_llm":
        return arg.name_on_server;
      case "type":
        return arg.type ?? "";
      case "description":
        return ""; // ToolSchema has only description_for_llm; server desc is not stored here
      case "default":
        return ""; // server default is not stored separately; left column is mostly informational
      default:
        return "";
    }
  };

  const getLlmParamValue = (arg: ToolArg, field: ParamFieldKey): string => {
    const key = arg.name_on_server;
    const existing = paramDraft[key]?.[field];
    if (typeof existing === "string") return existing;

    switch (field) {
      case "name_for_llm":
        return arg.name_for_llm ?? arg.name_on_server;
      case "type":
        return arg.type ?? "";
      case "description":
        return arg.description_for_llm ?? "";
      case "default":
        return defaultToString(arg.default);
      default:
        return "";
    }
  };

  const setLlmParamValue = (
    arg: ToolArg,
    field: ParamFieldKey,
    value: string
  ) => {
    const key = arg.name_on_server;
    setParamDraft((prev) => ({
      ...prev,
      [key]: {
        name_for_llm:
          prev[key]?.name_for_llm ?? arg.name_for_llm ?? arg.name_on_server,
        description: prev[key]?.description ?? arg.description_for_llm ?? "",
        type: prev[key]?.type ?? arg.type ?? "",
        default: prev[key]?.default ?? defaultToString(arg.default),
        [field]: value,
      },
    }));
  };

  const handleClose = () => onClose();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      if (!tool) throw new Error("No tool selected.");

      const argList: ToolArg[] = (tool.args_schema?.properties ?? []).map(
        (arg) => {
          const llmName = getLlmParamValue(arg, "name_for_llm").trim();
          const llmType = getLlmParamValue(arg, "type").trim();
          const llmDescription = getLlmParamValue(arg, "description").trim();
          const llmDefaultRaw = getLlmParamValue(arg, "default");

          return {
            name_on_server: arg.name_on_server,
            required: arg.required, // keep as-is (MVP)
            name_for_llm: llmName ? llmName : arg.name_on_server,
            type: llmType ? llmType : arg.type ?? "string",
            description_for_llm: llmDescription ? llmDescription : "",
            default: parseDefaultValue(llmDefaultRaw),
          };
        }
      );

      const patch: ToolSchema = {
        server_url: tool.server_url,
        name_on_server: tool.name_on_server,
        name_for_llm: nameForLlm.trim()
          ? nameForLlm.trim()
          : tool.name_on_server,
        description_for_llm: descriptionForLlm.trim()
          ? descriptionForLlm.trim()
          : "",
        args_schema: {
          type: "object",
          properties: argList,
          additionalProperties: false,
        },
      };

      await onSave(patch);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title="Edit Tool" onClose={handleClose}>
      {!tool ? (
        <div className="formError">No tool selected.</div>
      ) : (
        <>
          {/* Server Url */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Server Url</div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {serverUrl || "-"}
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

          {/* Tool description: (no server desc in schema) vs llm */}
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
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>-</pre>
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
                  {properties.map((arg) => (
                    <div key={arg.name_on_server}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 8,
                          borderBottom: "1px solid #eee",
                          paddingBottom: 4,
                        }}
                      >
                        Parameter: {arg.name_on_server}
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
                        const serverVal = getServerParamValue(arg, row);
                        const llmVal = getLlmParamValue(arg, row);

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
                                onChange={(v) => setLlmParamValue(arg, row, v)}
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
          {/* Buttons (Save wired later) */}
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <Button
              label={isSaving ? "Saving..." : "Save"}
              onClick={handleSave}
              disabled={isSaving || !nameForLlm.trim()}
            />
            <Button label="Cancel" onClick={handleClose} disabled={isSaving} />
          </div>
        </>
      )}
    </Modal>
  );
}
