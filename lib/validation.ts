// lib/validation.ts
// Type guards and safe null-checking utilities

import type { VaultNode, VaultNodeType, VaultNodeStatus } from './types';

/**
 * Type guard: node has a valid domain
 */
export function hasDomain(node: VaultNode): node is VaultNode & { domain: string } {
  return !!(node.domain && node.domain.trim());
}

/**
 * Type guard: node has pressure score
 */
export function hasPressureScore(
  node: VaultNode
): node is VaultNode & { pressure_score: number } {
  return typeof node.pressure_score === 'number' && !isNaN(node.pressure_score);
}

/**
 * Type guard: node has word count
 */
export function hasWordCount(
  node: VaultNode
): node is VaultNode & { word_count: number } {
  return typeof node.word_count === 'number' && node.word_count > 0;
}

/**
 * Safely get domain or fallback to 'unknown'
 */
export function safeDomain(node: VaultNode | null | undefined): string {
  return node?.domain?.trim() || 'unknown';
}

/**
 * Safely get pressure score or fallback to 0
 */
export function safePressureScore(node: VaultNode | null | undefined): number {
  const score = node?.pressure_score;
  return typeof score === 'number' && !isNaN(score) ? score : 0;
}

/**
 * Safely get excerpt or fallback to empty string
 */
export function safeExcerpt(node: VaultNode | null | undefined): string {
  return node?.excerpt?.trim() || '';
}

/**
 * Validate a node ID exists and is non-empty
 */
export function isValidNodeId(id: string | null | undefined): id is string {
  return !!(id && typeof id === 'string' && id.trim());
}

/**
 * Validate an array of node IDs
 */
export function filterValidNodeIds(ids: (string | null | undefined)[]): string[] {
  return ids.filter(isValidNodeId);
}

/**
 * Safely check if node is of a specific type
 */
export function nodeIsType(
  node: VaultNode | null | undefined,
  type: VaultNodeType
): boolean {
  return node?.type === type;
}

/**
 * Safely check if node has a specific status
 */
export function nodeHasStatus(
  node: VaultNode | null | undefined,
  status: VaultNodeStatus
): boolean {
  return node?.status === status;
}
