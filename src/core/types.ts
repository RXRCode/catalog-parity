export type CatalogRecord = Record<string, unknown>;

export type FieldMapping = {
  source: string;
  target: string;
  label: string;
};

export type CompareOptions = {
  key: FieldMapping;
  fields: FieldMapping[];
  ignoreCase: boolean;
  trimStrings: boolean;
  ignoreExtra: boolean;
};

export type MissingInTargetDifference = {
  kind: "missing_in_target";
  key: string;
};

export type ExtraInTargetDifference = {
  kind: "extra_in_target";
  key: string;
};

export type FieldMismatchDifference = {
  kind: "field_mismatch";
  key: string;
  field: FieldMapping;
  sourceValue: unknown;
  targetValue: unknown;
};

export type CatalogDifference =
  | MissingInTargetDifference
  | ExtraInTargetDifference
  | FieldMismatchDifference;

export type CompareResult = {
  parity: boolean;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  missingInTargetCount: number;
  extraInTargetCount: number;
  fieldMismatchCount: number;
  mismatchedRecordCount: number;
  key: FieldMapping;
  fields: FieldMapping[];
  differences: CatalogDifference[];
};
