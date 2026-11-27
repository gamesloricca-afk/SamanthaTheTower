/**
 * Samantha GKB — TypeScript Origin Declaration Parser
 *
 * Supports only exported named string-literal union declarations.
 * Unsupported syntax is reported as NOT_INSPECTED; values are never guessed.
 */

export function parseStringUnionDeclaration(source, typeName) {
  if (typeof source !== 'string' || typeof typeName !== 'string' || !typeName.trim()) {
    throw new TypeError('source and typeName must be strings; typeName must not be empty');
  }

  const escapedName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    'export\\s+type\\s+' + escapedName + '\\s*=([\\s\\S]*?);',
    'g'
  );
  const matches = [...source.matchAll(pattern)];

  if (matches.length !== 1) {
    return {
      status: 'NOT_INSPECTED',
      reason: matches.length === 0 ? 'DECLARATION_NOT_FOUND' : 'MULTIPLE_DECLARATIONS_FOUND',
      values: [],
      declarationLocations: []
    };
  }

  const match = matches[0];
  const body = match[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\r\n]*/g, '');
  const members = body.split('|').map(value => value.trim()).filter(Boolean);
  const values = [];

  for (const member of members) {
    const literal = member.match(/^(['"])([^'"]+)\1$/);
    if (!literal) {
      return {
        status: 'NOT_INSPECTED',
        reason: 'UNSUPPORTED_UNION_MEMBER_SYNTAX',
        values: [],
        declarationLocations: []
      };
    }
    values.push(literal[2]);
  }

  if (values.length === 0 || new Set(values).size !== values.length) {
    return {
      status: 'NOT_INSPECTED',
      reason: 'EMPTY_OR_DUPLICATE_UNION_VALUES',
      values: [],
      declarationLocations: []
    };
  }

  const startLine = source.slice(0, match.index).split('\n').length;
  return {
    status: 'INSPECTED',
    method: 'AUTOMATIC_DTS_PARSE',
    values,
    declarationLocations: [{
      path: null,
      typeName,
      startLine,
      endLine: startLine + match[0].split('\n').length - 1
    }]
  };
}

export function runSelfTest() {
  const valid = parseStringUnionDeclaration(
    "export type ClaimOrigin =\n  'game'\n  | 'code'\n  | 'wiki';",
    'ClaimOrigin'
  );
  if (valid.status !== 'INSPECTED' ||
      valid.values.join(',') !== 'game,code,wiki' ||
      valid.declarationLocations[0]?.startLine !== 1) {
    throw new Error('Parser self-test failed: valid multiline string union');
  }

  const unsupported = parseStringUnionDeclaration(
    "export type ClaimOrigin = 'game' | SomeOrigin;",
    'ClaimOrigin'
  );
  if (unsupported.status !== 'NOT_INSPECTED' ||
      unsupported.reason !== 'UNSUPPORTED_UNION_MEMBER_SYNTAX') {
    throw new Error('Parser self-test failed: unsupported syntax was not rejected');
  }

  const missing = parseStringUnionDeclaration(
    "export type OtherOrigin = 'game';",
    'ClaimOrigin'
  );
  if (missing.status !== 'NOT_INSPECTED' ||
      missing.reason !== 'DECLARATION_NOT_FOUND') {
    throw new Error('Parser self-test failed: missing declaration was not reported');
  }

  const duplicate = parseStringUnionDeclaration(
    "export type ClaimOrigin = 'game';\nexport type ClaimOrigin = 'wiki';",
    'ClaimOrigin'
  );
  if (duplicate.status !== 'NOT_INSPECTED' ||
      duplicate.reason !== 'MULTIPLE_DECLARATIONS_FOUND') {
    throw new Error('Parser self-test failed: duplicate declaration was not reported');
  }

  const duplicateMember = parseStringUnionDeclaration(
    "export type ClaimOrigin = 'game' | 'game';",
    'ClaimOrigin'
  );
  if (duplicateMember.status !== 'NOT_INSPECTED' ||
      duplicateMember.reason !== 'EMPTY_OR_DUPLICATE_UNION_VALUES') {
    throw new Error('Parser self-test failed: duplicate union member was not reported');
  }

  const output = {
    selfTest: 'PASSED',
    parser: 'typescript-origin-parser',
    cases: [
      'VALID_MULTILINE_STRING_UNION',
      'UNSUPPORTED_MEMBER_SYNTAX',
      'DECLARATION_NOT_FOUND',
      'MULTIPLE_DECLARATIONS_FOUND',
      'DUPLICATE_UNION_MEMBER'
    ]
  };
  console.log(JSON.stringify(output, null, 2));
  return output;
}

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runSelfTest();
}
