/* eslint-disable max-lines */
import { OneField, OneType } from 'dynamodb-onetable';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import { MergeDeep } from 'type-fest';

type JSONSchema7TypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

type OverrideOptions = Record<string, Partial<OneField>>;

// this list is not complete
// to support other type add it here ...
type StringSchema = { type: 'string'; enum?: readonly string[] };
type NumberSchema = { type: 'number'; default?: number };
type BooleanSchema = { type: 'boolean'; default?: boolean };
type ArraySchema = {
  type: 'array';
  items: JSONSchema;
};
type NestedObjectSchema = {
  type: 'object';
  properties: Record<string, JSONSchema>;
};

// ... and match the case of you new Type here.
// To test this typescript code, open './jsonSchemaToOneTable.typescriptTest.ts
// and check generated type with your IDE
type TransformToType<T> = T extends StringSchema
  ? {
      readonly type: StringConstructor;
      readonly default?: string;
    } & (T['enum'] extends readonly string[] ? { enum: T['enum'] } : unknown)
  : T extends NumberSchema
  ? {
      readonly type: NumberConstructor;
      readonly default?: number;
    }
  : T extends BooleanSchema
  ? {
      readonly type: BooleanConstructor;
      readonly default?: boolean;
    }
  : T extends ArraySchema
  ? {
      readonly type: ArrayConstructor;
      readonly items: {
        type: ObjectConstructor;
        schema: DialogOneModel<T['items']>;
      };
      readonly default?: FromSchema<T['items']>[];
    }
  : T extends NestedObjectSchema
  ? {
      readonly type: ObjectConstructor;
      readonly schema: DialogOneModel<T>;
      readonly default?: FromSchema<T>[];
    }
  : never;

type AddRequired<T, K, Req extends readonly string[]> = K extends Req[number]
  ? T & { readonly required: true }
  : T;

type DialogOneModel<T extends JSONSchema> = T extends {
  properties?: Record<string, JSONSchema>;
}
  ? {
      [K in keyof T['properties']]: AddRequired<
        TransformToType<T['properties'][K]>,
        K,
        T extends { required: readonly string[] } ? T['required'] : never
      >;
    }
  : never;

class JsonSchemaToOneTableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonSchemaToOneTableError';
  }
}

const typeMapping: Record<JSONSchema7TypeName, OneType> = {
  string: String,
  number: Number,
  integer: Number,
  boolean: Boolean,
  object: Object,
  array: Array,
  null: 'null',
} as const;

const mapTypes = (
  type:
    | JSONSchema7TypeName
    | JSONSchema7TypeName[]
    | readonly JSONSchema7TypeName[],
): OneType => (!(type instanceof Array) ? typeMapping[type] : 'null');

const appendRequired = (
  fieldName: string,
  requiredFields: readonly string[],
): { required: true } | undefined =>
  requiredFields.includes(fieldName) ? { required: true } : undefined;

const appendEnum = (json: JSONSchema): { enum: unknown[] } | undefined =>
  typeof json === 'object' && json.enum instanceof Array
    ? { enum: json.enum }
    : undefined;

const appendPattern = (json: JSONSchema): { validate: RegExp } | undefined =>
  typeof json === 'object' && json.pattern !== undefined
    ? { validate: new RegExp(json.pattern) }
    : undefined;

const appendItems = (
  json: JSONSchema,
):
  | { items: { type: OneType }; schema?: Record<string, OneType> }
  | undefined => {
  return typeof json === 'object' &&
    json.type !== undefined &&
    json.type === 'array' &&
    typeof json.items === 'object' &&
    !(json.items instanceof Array) &&
    json.items.type !== undefined
    ? {
        items: {
          type: mapTypes(json.items.type),
          ...appendSchema(json.items),
        },
      }
    : undefined;
};

const appendSchema = (
  json: JSONSchema,
): { schema: Record<string, OneType> } | undefined =>
  typeof json === 'object' &&
  json.type === 'object' &&
  json.properties !== undefined
    ? { schema: jsonSchemaToOneTable(json) }
    : undefined;

export const jsonSchemaToOneTable = <
  T extends JSONSchema,
  O extends OverrideOptions = Record<string, never>,
>(
  contract: T,
  override?: O,
): MergeDeep<DialogOneModel<T>, O> => {
  if (typeof contract === 'object' && contract.type === 'object') {
    if (contract.additionalProperties === true) {
      throw new JsonSchemaToOneTableError(
        'additionalProperties=true is not supported yet',
      );
    }
    const { required = [], properties } = contract;

    //@ts-ignore this part is covered by unit test
    return merge(
                             mapValues(properties, (value: JSONSchema, key: string) => {
        if (typeof value === 'object' && value.type !== undefined) {
          return {
            type: mapTypes(value.type),
            ...appendRequired(key, required),
            ...appendEnum(value),
            ...appendPattern(value),
            ...appendItems(value),
            ...appendSchema(value),
          };
        }

        throw new JsonSchemaToOneTableError(
          `Description for field "${key}" is not valid`,
        );
      }),
      override ?? {},
    );
  }

  throw new JsonSchemaToOneTableError(
    'Only object type (and not nested) are supported yet',
  );
};
