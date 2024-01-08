import get from 'lodash/get';

import { jsonSchemaToOneTable } from './jsonSchemaToOneTable';

describe('jsonSchemaToOneTable', () => {
  it('should handle basic types: number, string, boolean', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        isAdmin: { type: 'boolean' },
      },
      required: [],
      additionalProperties: false,
    } as const);
    expect(table.id.type).toBe(Number);
    expect(table.email.type).toBe(String);
    expect(table.isAdmin.type).toBe(Boolean);
  });

  it('should handle "required" option', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    } as const);
    expect(table.id.required).toBe(true);
    expect(get(table, 'name.required')).toBeFalsy();
  });

  it('should handle string enum', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        color: { type: 'string', enum: ['red', 'green'] },
      },
      required: [],
      additionalProperties: false,
    } as const);
    expect(table.color.enum).toEqual(['red', 'green']);
  });

  it('should handle RegExp with pattern attribute', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        email: {
          type: 'string',
          pattern: '^[w.]+@([w-]+.)+[w-]{2,4}$',
        },
      },
      required: ['email'],
      additionalProperties: false,
    });
    expect(get(table, 'email.validate')).toEqual(
      new RegExp('^[w.]+@([w-]+.)+[w-]{2,4}$'),
    );
  });

  it('should handle Array of string', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: [],
      additionalProperties: false,
    } as const);
    expect(table.tags.type).toBe(Array);
    expect(table.tags.items).toEqual({ type: String });
  });

  it('should add new properties by options', () => {
    const table = jsonSchemaToOneTable(
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
      { city: { type: String, required: true } },
    );
    expect(table).toHaveProperty('city');
    expect(table).toHaveProperty('name');
  });

  it('should fully override option', () => {
    const table = jsonSchemaToOneTable(
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
      { name: { type: String, required: false } }, // Override name's required
    );
    expect(table.name.required).toBe(false);
  });

  it('should override options with a deep merge', () => {
    const table = jsonSchemaToOneTable(
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
      { id: { generate: 'uuid' } }, // Override id generation
    );
    expect(table.id.type).toBe(String);
    expect(table.id.generate).toBe('uuid');
  });

  it('should handle RegExp with pattern attribute', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        email: {
          type: 'string',
          pattern: '^[w.]+@([w-]+.)+[w-]{2,4}$',
        },
      },
      required: ['email'],
      additionalProperties: false,
    });
    expect(get(table, 'email.validate')).toEqual(
      new RegExp('^[w.]+@([w-]+.)+[w-]{2,4}$'),
    );
  });

  it('should transform object array with his schema', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        cars: {
          type: 'array',
          items: {
            type: 'object',
            properties: { color: { type: 'string' } },
          },
        },
      },
    });
    expect(table).toEqual({
      cars: {
        type: Array,
        items: { type: Object, schema: { color: { type: String } } },
      },
    });
  });

  it('should transform object array recursively', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        cars: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              color: { type: 'string' },
              people: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(table.cars.type).toBe(Array);
    expect(table.cars.items.type).toBe(Object);
    expect(table.cars.items.schema.color.type).toBe(String);
    expect(table.cars.items.schema.people.type).toBe(Array);
    expect(table.cars.items.schema.people.items.schema.name.type).toBe(String);
  });

  it('should transform nested object', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: [],
          additionalProperties: false,
        },
      },
      required: [],
      additionalProperties: false,
    } as const);

    expect(table.user.type).toBe(Object);
    expect(table.user.schema.name.type).toBe(String);
  });

  it('should transform recursivly nested object', () => {
    const table = jsonSchemaToOneTable({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
              required: ['address'],
              additionalProperties: false,
            },
          },
          required: ['user'],
          additionalProperties: false,
        },
      },
      required: [],
      additionalProperties: false,
    } as const);

    expect(table.user.type).toBe(Object);
    expect(table.user.schema.name.type).toBe(String);
    expect(table.user.schema.address.type).toBe(Object);
    expect(table.user.schema.address.schema.city.type).toBe(String);
    expect(table.user.schema.address.schema.street.type).toBe(String);
  });

  it('should throw if additionalProperties is true', () => {
    expect(() =>
      jsonSchemaToOneTable({
        type: 'object',
        properties: { id: { type: 'number' } },
        required: [],
        additionalProperties: true,
      } as const),
    ).toThrow();
  });
});
