// this file is here to validate the dynamic typescript type generated
// you do not need to run anything, just display the type
import { jsonSchemaToOneTable } from './';

// you can add new properties to this JSONSchema to test new types
export const jsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    countryCode: { type: 'string', enum: ['EN', 'FR'] },
    age: { type: 'number' },
    isGood: { type: 'boolean' },
    tags: { type: 'array', items: { type: 'string' } },
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
      required: [],
      additionalProperties: false,
    },
    cars: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          color: { type: 'string' },
          people: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                firstname: { type: 'string' },
              },
              additionalProperties: false,
              required: ['firstname'],
            },
          },
        },
        additionalProperties: false,
        required: ['color'],
      },
    },
  },
  required: ['name', 'age'],
  additionalProperties: false,
} as const;

//Check the type of this const with your IDE to validate the generated type
export const checkMyTypeWithYourIDE = jsonSchemaToOneTable(jsonSchema, {
  PK: { type: String },
});

//Check each type details
export type name = (typeof checkMyTypeWithYourIDE)['name'];
export type countryCode = (typeof checkMyTypeWithYourIDE)['countryCode'];
export type age = (typeof checkMyTypeWithYourIDE)['age'];
export type isGood = (typeof checkMyTypeWithYourIDE)['isGood'];
export type tags = (typeof checkMyTypeWithYourIDE)['tags'];
export type cars = (typeof checkMyTypeWithYourIDE)['cars'];
export type carsItems = (typeof checkMyTypeWithYourIDE)['cars']['items'];
export type user = (typeof checkMyTypeWithYourIDE)['user'];
export type address =
  (typeof checkMyTypeWithYourIDE)['user']['schema']['address'];
