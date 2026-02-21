import React, { useMemo, useState } from "react";
import {
  Box,
  HStack,
  Input,
  Stack,
  Text,
  Tabs,
  IconButton,
  Code,
  Collapsible,
  useCollapsible,
  Icon,
  InputGroup,
} from "@chakra-ui/react";
import { ChevronDown, ChevronRight, Copy, Search } from "lucide-react";

interface DevOnlyProps {
  children?: React.ReactNode;
  summary?: React.ReactNode;
  json?: unknown;
  defaultOpen?: boolean;
  maxHeight?: string;
}

/* -------------------------------- Utilities -------------------------------- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const formatValue = (value: unknown) => {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (isObject(value)) return "Object";
  return String(value);
};

/* ----------------------------- Tree View Nodes ------------------------------ */

const TreeNode = ({
  label,
  value,
  depth = 0,
  filter,
}: {
  label: string;
  value: unknown;
  depth?: number;
  filter?: string;
}) => {
  const [open, setOpen] = useState(depth < 1);

  const isExpandable = isObject(value) || Array.isArray(value);

  if (
    filter &&
    !label.toLowerCase().includes(filter.toLowerCase()) &&
    !JSON.stringify(value).toLowerCase().includes(filter.toLowerCase())
  ) {
    return null;
  }

  return (
    <Box pl={depth * 12}>
      <HStack
        gap={1}
        cursor={isExpandable ? "pointer" : "default"}
        onClick={() => isExpandable && setOpen(!open)}
        align="center"
      >
        {isExpandable && (
          <Box>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Box>
        )}
        <Text fontWeight="medium" fontSize="sm">
          {label}:
        </Text>
        {!isExpandable && <Code fontSize="xs">{formatValue(value)}</Code>}
        {isExpandable && (
          <Text fontSize="xs" opacity={0.6}>
            {formatValue(value)}
          </Text>
        )}
      </HStack>

      {open && isExpandable && (
        <Box mt={1}>
          {Object.entries(value as any).map(([k, v]) => (
            <TreeNode
              key={k}
              label={k}
              value={v}
              depth={depth + 1}
              filter={filter}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

/* -------------------------------- Main UI -------------------------------- */

const DevOnly = ({
  children,
  summary = "dev-only debug",
  json,
  defaultOpen = false,
  maxHeight = "70vh",
}: DevOnlyProps) => {
  const inDevMode =
    import.meta.env.DEV || import.meta.env.MODE === "development";

  if (!inDevMode) return null;

  const collapsible = useCollapsible({defaultOpen});
  const [filter, setFilter] = useState("");

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return "Unable to stringify value";
    }
  }, [json]);

  const copy = () => navigator.clipboard.writeText(rawJson);

  return (
    <Collapsible.RootProvider
      overflow="hidden"
      rounded="sm"
      value={collapsible}
    >
      <Collapsible.Trigger
        px={3}
        py={2}
        cursor="pointer"
        bg={{
          _hover: "bg.muted",
          base: collapsible.open ? "bg.muted" : undefined,
        }}
        color="fg.subtle"
        w="full"
      >
        <HStack>
          <Collapsible.Indicator
            transition="transform 0.2s"
            _open={{ transform: "rotate(90deg)" }}
          >
            <ChevronRight size={14} />
          </Collapsible.Indicator>
          <Text fontSize="sm" fontWeight="medium">
            {summary}
          </Text>
        </HStack>
      </Collapsible.Trigger>
      <Collapsible.Content bg="bg.subtle" borderWidth={collapsible.open ? 1 : undefined} borderColor="bg.muted">
          <Tabs.Root defaultValue="tree">
            <Tabs.List>
              <Tabs.Trigger value="tree">Structured</Tabs.Trigger>
              <Tabs.Trigger value="raw" title="Uses JSON.stringify">
                Raw
              </Tabs.Trigger>
            </Tabs.List>
        <Box px={4} pb={4} maxH={maxHeight} overflow="auto">

            <Tabs.Content value="tree">
              <Stack gap={2}>
                <InputGroup startElement={<Icon size="xs" ml={-1}><Search /></Icon>}>
                    <Input
                      size="xs"
                      placeholder="Filter..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                </InputGroup>

                {json && (isObject(json) || Array.isArray(json)) ? (
                  <Box pl={1}>
                    {Object.entries(json as any).map(([key, value]) => (
                      <TreeNode
                        key={key}
                        label={key}
                        value={value}
                        filter={filter}
                      />
                    ))}
                  </Box>
                ) : json ? (
                  <Code>{formatValue(json)}</Code>
                ) : (
                  children
                )}
              </Stack>
            </Tabs.Content>

            <Tabs.Content value="raw">
              <Stack gap={2}>
                <HStack justify="flex-end">
                  <IconButton variant="ghost" size="xs" onClick={copy}>
                    <Copy size={14} />
                  </IconButton>
                </HStack>
                <Code whiteSpace="pre" display="block" p={2} overflowX="auto">
                  {rawJson}
                </Code>
              </Stack>
            </Tabs.Content>
        </Box>
          </Tabs.Root>
      </Collapsible.Content>
    </Collapsible.RootProvider>
  );
};

export default DevOnly;
