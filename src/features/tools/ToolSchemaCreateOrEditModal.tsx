"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import type { StoredItem } from "@/storage/storage";
import type { ServerTool } from "@/models/mcpServerTool";
import type { ToolSchema, ToolArg } from "@/models/toolSchema";
import {
  defaultToString,
  parseDefaultValue,
  normalizeToolSchema,
  validateToolSchema,
} from "@/features/tools/toolschemas.utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (toolSchema: ToolSchema) => Promise<void> | void;
  initialToolSchema?: StoredItem<ToolSchema> | null;
  tool?: ServerTool | null;
  serverUrl?: string | null;
  title?: string;
};

type ParamFieldKey = "name_for_llm" | "description" | "type" | "default";
type ParamLlmDraft = Record<string, Record<ParamFieldKey, string>>;

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

export function ToolSchemaCreateOrEditModal({
  isOpen,
  onClose,
  onSubmit,
  initialToolSchema = null,
  tool = null,
  serverUrl = null,
  title,
}: Props) {
  const isEditMode = Boolean(initialToolSchema);

  // --- Base values depending on mode (computed once per mount; remount later via key in page) ---
  const baseServerUrl = isEditMode
    ? initialToolSchema!.server_url ?? ""
    : serverUrl ?? "";
  const baseServerName = isEditMode
    ? initialToolSchema!.name_on_server ?? ""
    : tool?.function.name ?? "";
  const baseServerDescription = isEditMode
    ? "" // In stored ToolSchema we don't have server description separately
    : tool?.function.description ?? "";

  const baseNameForLlm = isEditMode
    ? initialToolSchema!.name_for_llm ?? ""
    : baseServerName;

  const baseDescriptionForLlm = isEditMode
    ? initialToolSchema!.description_for_llm ?? ""
    : baseServerDescription;

  // --- Form state (init from initialToolSchema) ---
  const [nameForLlm, setNameForLlm] = useState(baseNameForLlm);
  const [descriptionForLlm, setDescriptionForLlm] = useState(
    baseDescriptionForLlm
  );
  const [paramDraft, setParamDraft] = useState<ParamLlmDraft>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Properties list (server tool params in Create; stored args_schema in Edit) ---
  const createProperties = useMemo(() => {
    if (isEditMode) return [];
    const props = tool?.function.parameters?.properties ?? {};
    return Object.entries(props); // [paramName, def]
  }, [isEditMode, tool]);

  const editProperties = useMemo(() => {
    if (!isEditMode) return [];
    return initialToolSchema?.args_schema?.properties ?? [];
  }, [isEditMode, initialToolSchema]);

  // --- Helpers for Create mode (server tool param defs) ---
  const getServerParamValueCreate = (
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

  const getLlmParamValueCreate = (
    paramName: string,
    field: ParamFieldKey
  ): string => {
    const existing = paramDraft[paramName]?.[field];
    if (typeof existing === "string") return existing;
    return getServerParamValueCreate(paramName, field);
  };

  const setLlmParamValueCreate = (
    paramName: string,
    field: ParamFieldKey,
    value: string
  ) => {
    setParamDraft((prev) => ({
      ...prev,
      [paramName]: {
        name_for_llm:
          prev[paramName]?.name_for_llm ??
          getServerParamValueCreate(paramName, "name_for_llm"),
        description:
          prev[paramName]?.description ??
          getServerParamValueCreate(paramName, "description"),
        type:
          prev[paramName]?.type ?? getServerParamValueCreate(paramName, "type"),
        default:
          prev[paramName]?.default ??
          getServerParamValueCreate(paramName, "default"),
        [field]: value,
      },
    }));
  };

  // --- Helpers for Edit mode (stored ToolArg list) ---
  const getServerParamValueEdit = (
    arg: ToolArg,
    field: ParamFieldKey
  ): string => {
    // For Edit mode, "Server" column is informational only (ToolSchema doesn't store server description/default separately)
    switch (field) {
      case "name_for_llm":
        return arg.name_on_server;
      case "type":
        return arg.type ?? "";
      case "description":
        return "";
      case "default":
        return defaultToString(arg.default);
      default:
        return "";
    }
  };

  const getLlmParamValueEdit = (arg: ToolArg, field: ParamFieldKey): string => {
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

  const setLlmParamValueEdit = (
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

  // --- resetForm + handleClose (always reset on close; reset on create save) ---
  const resetForm = () => {
    setNameForLlm(baseNameForLlm);
    setDescriptionForLlm(baseDescriptionForLlm);
    setParamDraft({});
    setError(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- handleSave builds ToolSchema, normalize+validate, calls ONLY onSubmit ---
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Basic mode checks
      if (!baseServerUrl.trim()) throw new Error("No server url provided.");

      if (!isEditMode) {
        if (!tool) throw new Error("No tool selected.");
        if (!baseServerName.trim())
          throw new Error("Tool name (server) missing.");
      } else {
        if (!initialToolSchema) throw new Error("No tool schema selected.");
        if (!baseServerName.trim())
          throw new Error("Tool name (server) missing.");
      }

      let argList: ToolArg[] = [];

      if (!isEditMode) {
        // Create mode: derive args from server tool parameter schema
        const params = tool!.function.parameters;
        const requiredList = params?.required ?? [];
        const props = params?.properties ?? {};

        argList = Object.entries(props as Record<string, ServerParamDef>).map(
          ([paramName, def]) => {
            const llmName = getLlmParamValueCreate(paramName, "name_for_llm");
            const llmType = getLlmParamValueCreate(paramName, "type");
            const llmDescription = getLlmParamValueCreate(
              paramName,
              "description"
            );
            const llmDefaultRaw = getLlmParamValueCreate(paramName, "default");

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
      } else {
        // Edit mode: derive args from stored args_schema (keep required as-is MVP)
        const props = initialToolSchema!.args_schema?.properties ?? [];
        argList = props.map((arg) => {
          const llmName = getLlmParamValueEdit(arg, "name_for_llm").trim();
          const llmType = getLlmParamValueEdit(arg, "type").trim();
          const llmDescription = getLlmParamValueEdit(
            arg,
            "description"
          ).trim();
          const llmDefaultRaw = getLlmParamValueEdit(arg, "default");

          return {
            name_on_server: arg.name_on_server,
            required: arg.required,
            name_for_llm: llmName ? llmName : arg.name_on_server,
            type: llmType ? llmType : arg.type ?? "string",
            description_for_llm: llmDescription ? llmDescription : "",
            default: parseDefaultValue(llmDefaultRaw),
          };
        });
      }

      const schema: ToolSchema = {
        server_url: baseServerUrl,
        name_on_server: baseServerName,
        name_for_llm: nameForLlm.trim() ? nameForLlm.trim() : baseServerName,
        description_for_llm: descriptionForLlm.trim()
          ? descriptionForLlm.trim()
          : "",
        args_schema: {
          type: "object",
          properties: argList,
          additionalProperties: false,
        },
      };

      const normalized = normalizeToolSchema(schema);
      validateToolSchema(normalized);

      await onSubmit(normalized);

      // Step 4 rule: reset on save in create mode; always close via handleClose which resets anyway
      if (!isEditMode) {
        resetForm();
      }
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = title ?? (isEditMode ? "Edit Tool" : "Register Tool");

  return (
    <Modal isOpen={isOpen} title={modalTitle} onClose={handleClose}>
      {/* Mode-specific missing selection errors */}
      {!isEditMode && !tool ? (
        <div className="formError">No tool selected.</div>
      ) : (
        <>
          {/* Server Url */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Server Url</div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {baseServerUrl?.trim() ? baseServerUrl : "-"}
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
                {baseServerName || "-"}
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
                {isEditMode ? "-" : baseServerDescription || "-"}
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
              {!isEditMode ? (
                createProperties.length === 0 ? (
                  <div>-</div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}
                  >
                    {createProperties.map(([paramName]) => (
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
                          const serverVal = getServerParamValueCreate(
                            paramName,
                            row
                          );
                          const llmVal = getLlmParamValueCreate(paramName, row);

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
                                    setLlmParamValueCreate(paramName, row, v)
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
                )
              ) : editProperties.length === 0 ? (
                <div>-</div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {editProperties.map((arg) => (
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
                        const serverVal = getServerParamValueEdit(arg, row);
                        const llmVal = getLlmParamValueEdit(arg, row);

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
                                  setLlmParamValueEdit(arg, row, v)
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

          {/* Error-State render */}
          {error ? <div className="formError">{error}</div> : null}

          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <Button
              label={
                isSaving
                  ? "Saving..."
                  : isEditMode
                  ? "Save"
                  : "Save as tool for agents!"
              }
              onClick={handleSave}
              disabled={isSaving || !nameForLlm.trim() || !baseServerUrl.trim()}
            />
            <Button label="Cancel" onClick={handleClose} disabled={isSaving} />
          </div>
        </>
      )}
    </Modal>
  );
}
