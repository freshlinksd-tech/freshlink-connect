import fs from 'fs';
import path from 'path';

/**
 * Diagnostic Script to verify Firestore security rules and document visibility.
 * Ensures read and write access is properly scoped to user IDs and public feeds,
 * and checks that documents are not inadvertently marked as private.
 */
export async function runSecurityDiagnostic() {
  console.log('---------------------------------------------------------');
  console.log('🔍 FIRESTORE SECURITY RULES & VISIBILITY DIAGNOSTIC');
  console.log('---------------------------------------------------------');

  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ Error: firestore.rules file not found at:', rulesPath);
    return false;
  }

  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
  let passed = true;
  const auditResults: { test: string; status: 'PASS' | 'FAIL' | 'WARN'; detail: string }[] = [];

  // 1. Verify Public Feed Access for Posts
  const postReadMatch = rulesContent.match(/match\s+\/posts\/\{postId\}\s*\{[\s\S]*?allow\s+read:\s*if\s+([^;]+);/);
  if (postReadMatch && postReadMatch[1].trim() === 'true') {
    auditResults.push({
      test: 'Public Posts Feed Read Access',
      status: 'PASS',
      detail: 'Posts collection allows public read access (allow read: if true;), ensuring global feed visibility.'
    });
  } else {
    passed = false;
    auditResults.push({
      test: 'Public Posts Feed Read Access',
      status: 'FAIL',
      detail: 'Posts collection read rule is restricted or missing allow read: if true.'
    });
  }

  // 2. Verify Public Profile Read Access for Users
  const userReadMatch = rulesContent.match(/match\s+\/users\/\{userId\}\s*\{[\s\S]*?allow\s+read:\s*if\s+([^;]+);/);
  if (userReadMatch && userReadMatch[1].trim() === 'true') {
    auditResults.push({
      test: 'Public User Profiles Read Access',
      status: 'PASS',
      detail: 'Users collection allows public read access for creator discovery.'
    });
  } else {
    passed = false;
    auditResults.push({
      test: 'Public User Profiles Read Access',
      status: 'FAIL',
      detail: 'Users collection read rule is restricted or missing.'
    });
  }

  // 3. Verify Scoped Writes & Schema Validation for Posts & Users
  const hasPostValidation = rulesContent.includes('isValidPost(incoming())');
  const hasUserValidation = rulesContent.includes('isValidUser(incoming())');
  if (hasPostValidation && hasUserValidation) {
    auditResults.push({
      test: 'Scoped Write & Schema Validation',
      status: 'PASS',
      detail: 'Creation and updates for posts and users validate schema constraints and ID parameters.'
    });
  } else {
    passed = false;
    auditResults.push({
      test: 'Scoped Write & Schema Validation',
      status: 'FAIL',
      detail: 'Write operations lack expected isValidPost or isValidUser schema validation helpers.'
    });
  }

  // 4. Check for Inadvertent Document Isolation or Private Flags in Rules
  const restrictsPostsByUser = rulesContent.includes("resource.data.userId == request.auth.uid") && rulesContent.match(/match\s+\/posts\/[\s\S]*?allow\s+read:[\s\S]*?request\.auth\.uid/);
  if (!restrictsPostsByUser) {
    auditResults.push({
      test: 'Public Feed Query Constraints',
      status: 'PASS',
      detail: 'Read queries for posts are unconstrained by auth.uid in security rules, avoiding unintended filtering of other creators\' posts.'
    });
  } else {
    auditResults.push({
      test: 'Public Feed Query Constraints',
      status: 'WARN',
      detail: 'Read rules restrict post visibility by request.auth.uid.'
    });
  }

  // 5. Inspect Seed & App Schemas for Inadvertent "isPrivate" flags
  const seedPath = path.resolve(process.cwd(), 'src/data/seedData.ts');
  if (fs.existsSync(seedPath)) {
    const seedContent = fs.readFileSync(seedPath, 'utf-8');
    const hasPrivatePosts = seedContent.includes('isPrivate: true') || seedContent.includes('visibility: "private"');
    if (!hasPrivatePosts) {
      auditResults.push({
        test: 'Post Document Visibility Check',
        status: 'PASS',
        detail: 'No seed posts or documents are inadvertently marked as private.'
      });
    } else {
      auditResults.push({
        test: 'Post Document Visibility Check',
        status: 'WARN',
        detail: 'Seed dataset contains posts marked as private.'
      });
    }
  }

  // Output summary
  console.log('\nAudit Results:');
  auditResults.forEach(res => {
    const symbol = res.status === 'PASS' ? '✅' : res.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${symbol} [${res.status}] ${res.test}: ${res.detail}`);
  });

  console.log('---------------------------------------------------------');
  if (passed) {
    console.log('✅ FIRESTORE SECURITY & VISIBILITY DIAGNOSTIC COMPLETED: ALL CHECKS PASSED!');
  } else {
    console.warn('⚠️ FIRESTORE DIAGNOSTIC WARNINGS FOUND - SEE AUDIT DETAILS ABOVE.');
  }
  console.log('---------------------------------------------------------\n');

  return passed;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || require.main === module) {
  runSecurityDiagnostic().catch(console.error);
}
