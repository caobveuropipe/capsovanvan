/**
 * Automated Verification Suite for fix-doc-deletion-sync-resilience
 * Tests core resilience algorithms:
 * 1. Tombstone-Wins & Conflict Resolution (mergeDocumentsAndTombstones)
 * 2. Prune Tombstones State Machine (storage.ts)
 * 3. Canonical Registry Resolution & Network Error Resilience (EFR-22)
 * 4. WebSocket Circuit Breaker status & reset
 */

import { mergeDocumentsAndTombstones, resolveCanonicalDriveDatabase } from '../src/services/googleDriveService.js';
import { pruneTombstones, type TombstoneRecord } from '../src/services/storage.js';
import { getRealtimeCircuitStatus, resetRealtimeCircuitBreaker } from '../src/services/realtimeService.js';
import type { DocumentRecord } from '../src/types.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing mergeDocumentsAndTombstones (Tombstone-Wins & CAS) ---');

  const docX: any = {
    id: 'doc-X',
    docNumber: '10/CV-2026',
    title: 'Công văn X',
    fileId: 'drive-file-x',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const docY: any = {
    id: 'doc-Y',
    docNumber: '11/CV-2026',
    title: 'Công văn Y',
    fileId: 'drive-file-y',
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  };

  // Case 1: Local deleted doc X (Tombstone-Wins over remote doc X)
  const localDb1 = {
    documents: [],
    deletedRecords: [{ id: 'doc-X', deletedAt: 1770000000 }],
    revision: 2,
  };
  const remoteDb1 = {
    documents: [docX],
    deletedRecords: [],
    revision: 1,
  };
  const merged1 = mergeDocumentsAndTombstones(localDb1, remoteDb1);
  assert(merged1.documents.length === 0, 'Doc X must NOT be in merged documents (Tombstone-Wins)');
  assert(merged1.deletedRecords?.some(d => d.id === 'doc-X'), 'Doc X must remain in merged deletedRecords');
  assert(merged1.revision === 3, 'Revision should be max(local, remote) + 1');

  // Case 2: Remote deleted doc Y, Local has doc Y in documents
  const localDb2 = {
    documents: [docY],
    deletedRecords: [],
    revision: 1,
  };
  const remoteDb2 = {
    documents: [],
    deletedRecords: [{ id: 'doc-Y', deletedAt: 1770001000 }],
    revision: 2,
  };
  const merged2 = mergeDocumentsAndTombstones(localDb2, remoteDb2);
  assert(merged2.documents.length === 0, 'Doc Y must NOT be in merged documents (Remote Tombstone-Wins)');
  assert(merged2.deletedRecords?.some(d => d.id === 'doc-Y'), 'Doc Y must remain in merged deletedRecords');

  // Case 3: Reconcile Duplicate Databases (EFR-20, EFR-21)
  // Registry A has tombstone for doc X
  // Registry B has doc X and new doc Y
  const registryA = {
    documents: [],
    deletedRecords: [{ id: 'doc-X', deletedAt: 1770002000 }],
  };
  const registryB = {
    documents: [docX, docY],
    deletedRecords: [],
  };
  const reconciled = mergeDocumentsAndTombstones(registryA, registryB);
  assert(
    reconciled.documents.length === 1 && reconciled.documents[0].id === 'doc-Y',
    'Reconciled result must contain doc Y and discard doc X'
  );
  assert(
    reconciled.deletedRecords?.some(d => d.id === 'doc-X'),
    'Reconciled result must keep doc X tombstone'
  );

  console.log('\n--- 2. Testing pruneTombstones State Machine (EFR-01, EFR-08) ---');
  const now = Date.now();
  const thirtyFiveDaysAgo = now - 35 * 24 * 60 * 60 * 1000;
  const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

  const sampleTombstones: TombstoneRecord[] = [
    {
      id: 'tomb-old-clean',
      docNumber: '01',
      deletedAt: thirtyFiveDaysAgo,
      registrySynced: true,
      assetCleaned: true,
    },
    {
      id: 'tomb-old-unsynced',
      docNumber: '02',
      deletedAt: thirtyFiveDaysAgo,
      registrySynced: false, // NOT synced to registry yet! Must NOT prune
      assetCleaned: true,
    },
    {
      id: 'tomb-old-uncleaned-asset',
      docNumber: '03',
      driveFileId: 'drive-lingering-asset',
      deletedAt: thirtyFiveDaysAgo,
      registrySynced: true,
      assetCleaned: false, // Asset still on Drive! Must NOT prune
    },
    {
      id: 'tomb-recent',
      docNumber: '04',
      deletedAt: fiveDaysAgo,
      registrySynced: true,
      assetCleaned: true, // Recent, within 30 days! Must NOT prune
    },
  ];

  const pruned = pruneTombstones(sampleTombstones);
  assert(pruned.length === 3, 'Exactly 1 eligible tombstone pruned (3 remaining)');
  assert(!pruned.some(t => t.id === 'tomb-old-clean'), 'Fully cleaned tombstone >30d pruned');
  assert(pruned.some(t => t.id === 'tomb-old-unsynced'), 'Unsynced tombstone >30d retained');
  assert(pruned.some(t => t.id === 'tomb-old-uncleaned-asset'), 'Tombstone with uncleaned Drive asset retained');
  assert(pruned.some(t => t.id === 'tomb-recent'), 'Recent tombstone retained');

  console.log('\n--- 3. Testing WebSocket Circuit Breaker (EFR-02) ---');
  const initialCircuit = getRealtimeCircuitStatus();
  assert(typeof initialCircuit.isBroken === 'boolean', 'Circuit status has boolean isBroken');
  resetRealtimeCircuitBreaker();
  const resetCircuit = getRealtimeCircuitStatus();
  assert(resetCircuit.isBroken === false, 'Circuit reset clears broken state');
  assert(resetCircuit.abnormalCloseCount === 0, 'Circuit reset zeroes counter');

  console.log('\n--- 4. Testing resolveCanonicalDriveDatabase Network Resilience (EFR-22) ---');
  // Mock global fetch to simulate HTTP 500 error from Google Drive API
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Server Error',
      } as any;
    };

    let caughtError: any = null;
    try {
      await resolveCanonicalDriveDatabase('mock-token');
    } catch (err) {
      caughtError = err;
    }

    assert(caughtError !== null, 'resolveCanonicalDriveDatabase MUST throw on HTTP 500');
    assert(
      caughtError?.message?.includes('500'),
      'Thrown error message mentions HTTP 500 to prevent duplicate file creation'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Mock global fetch to simulate successful listing with 0 files (legitimate empty)
  try {
    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ files: [] }),
      } as any;
    };

    const emptyResult = await resolveCanonicalDriveDatabase('mock-token');
    assert(emptyResult === null, 'resolveCanonicalDriveDatabase returns null ONLY on empty file list');
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log(`\n========================================`);
  console.log(`Tests finished: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
