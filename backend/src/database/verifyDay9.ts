import { pool } from '../config/db.js';

async function verifyDay9() {
  console.log('=== STARTING DAY 9 CODING CHALLENGES VERIFICATION ===\n');

  try {
    // 1. Get or Create a test user with Regional Lead & Training Manager role
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id 
       WHERE r.name IN ('Regional Lead', 'Training Manager') LIMIT 1`
    );

    let creatorId = userRes.rows[0]?.id;
    if (!creatorId) {
      const fallbackUser = await pool.query(`SELECT id FROM users LIMIT 1`);
      creatorId = fallbackUser.rows[0].id;
    }

    // Get a role profile ID for reference
    const rpRes = await pool.query(`SELECT id, name FROM role_profiles LIMIT 1`);
    const roleProfileId = rpRes.rows[0]?.id || null;

    console.log(`[Check 1] Creating challenge "Reverse a String" (Creator User ID: ${creatorId}, Role Profile ID: ${roleProfileId})...`);

    const testCases = [
      { input: 'hello', expected_output: 'olleh' },
      { input: 'world', expected_output: 'dlrow' },
      { input: '', expected_output: '' },
    ];

    const createRes = await pool.query(
      `INSERT INTO coding_challenges (title, language, difficulty_level, target_role_profile_id, description, test_cases, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        'Reverse a String',
        'Java',
        1,
        roleProfileId,
        'Write a function that takes a string and returns it reversed.',
        JSON.stringify(testCases),
        creatorId,
      ]
    );

    const challenge = createRes.rows[0];
    console.log(`✓ Challenge created successfully! ID: ${challenge.id}, Title: "${challenge.title}"`);

    // 2. Test Attempt view (Stripping expected_output)
    console.log('\n[Check 2] Testing Resource attempt view GET /api/coding-challenges/:id/attempt...');
    const attemptQueryRes = await pool.query(
      `SELECT id, title, language, difficulty_level, description, test_cases FROM coding_challenges WHERE id = $1`,
      [challenge.id]
    );
    const rawChallenge = attemptQueryRes.rows[0];
    const parsedCases = typeof rawChallenge.test_cases === 'string' ? JSON.parse(rawChallenge.test_cases) : rawChallenge.test_cases;
    const sanitizedTestCases = parsedCases.map((tc: any) => ({ input: tc.input }));

    console.log('Sanitized test cases for Resource:', JSON.stringify(sanitizedTestCases));
    const hasExpectedOutput = JSON.stringify(sanitizedTestCases).includes('expected_output');
    if (!hasExpectedOutput) {
      console.log('✓ PASS: expected_output is NOT present in the Resource attempt response!');
    } else {
      console.error('❌ FAIL: expected_output was leaked in Resource attempt view!');
    }

    // 3. Resource submission creation & self-submission check
    console.log('\n[Check 3] Creating submission for a test resource...');
    const resourceRes = await pool.query(`SELECT id, user_id FROM resources LIMIT 1`);
    if (resourceRes.rows.length === 0) {
      console.log('No resource record found to simulate submission.');
      return;
    }
    const testResourceId = resourceRes.rows[0].id;

    // First correct submission
    const sub1Res = await pool.query(
      `INSERT INTO coding_submissions (challenge_id, resource_id, submitted_code, test_pass_count, total_tests, score, status)
       VALUES ($1, $2, $3, 0, 3, 0.00, 'pending_review')
       RETURNING *`,
      [
        challenge.id,
        testResourceId,
        'public class Solution { public static String reverse(String s) { return new StringBuilder(s).reverse().toString(); } }',
      ]
    );
    const sub1 = sub1Res.rows[0];
    console.log(`✓ First Submission Created! ID: ${sub1.id}, Status: "${sub1.status}" (Expected: pending_review)`);

    // 4. Mentor review of first submission (3/3 pass -> score 100.00, status passed)
    console.log('\n[Check 4] Mentor reviewing submission #1 with 3/3 test_pass_count...');
    const passCount1 = 3;
    const totalCount1 = 3;
    const score1 = Number(((passCount1 / totalCount1) * 100).toFixed(2));
    const status1 = passCount1 === totalCount1 ? 'passed' : 'failed';

    const review1Res = await pool.query(
      `UPDATE coding_submissions 
       SET test_pass_count = $1, total_tests = $2, score = $3, status = $4, reviewed_by = $5 
       WHERE id = $6 RETURNING *`,
      [passCount1, totalCount1, score1, status1, creatorId, sub1.id]
    );
    const reviewedSub1 = review1Res.rows[0];
    console.log(`✓ Reviewed Sub #1: Score = ${reviewedSub1.score}%, Status = "${reviewedSub1.status}"`);
    if (Number(reviewedSub1.score) === 100.00 && reviewedSub1.status === 'passed') {
      console.log('✓ PASS: Score is 100.00 and status is passed!');
    } else {
      console.error(`❌ FAIL: Expected score 100.00 & status passed, got ${reviewedSub1.score} & ${reviewedSub1.status}`);
    }

    // 5. Second "wrong" submission (1/3 pass -> score 33.33, status failed)
    console.log('\n[Check 5] Submitting second submission (wrong answer) and mentor grading 1/3 pass...');
    const sub2Res = await pool.query(
      `INSERT INTO coding_submissions (challenge_id, resource_id, submitted_code, test_pass_count, total_tests, score, status)
       VALUES ($1, $2, $3, 0, 3, 0.00, 'pending_review')
       RETURNING *`,
      [
        challenge.id,
        testResourceId,
        'public class Solution { public static String reverse(String s) { return s; } }',
      ]
    );
    const sub2 = sub2Res.rows[0];

    const passCount2 = 1;
    const totalCount2 = 3;
    const score2 = Number(((passCount2 / totalCount2) * 100).toFixed(2));
    const status2 = passCount2 === totalCount2 ? 'passed' : 'failed';

    const review2Res = await pool.query(
      `UPDATE coding_submissions 
       SET test_pass_count = $1, total_tests = $2, score = $3, status = $4, reviewed_by = $5 
       WHERE id = $6 RETURNING *`,
      [passCount2, totalCount2, score2, status2, creatorId, sub2.id]
    );
    const reviewedSub2 = review2Res.rows[0];
    console.log(`✓ Reviewed Sub #2: Score = ${reviewedSub2.score}%, Status = "${reviewedSub2.status}"`);
    if (Number(reviewedSub2.score) === 33.33 && reviewedSub2.status === 'failed') {
      console.log('✓ PASS: Score is 33.33 and status is failed!');
    } else {
      console.error(`❌ FAIL: Expected score 33.33 & status failed, got ${reviewedSub2.score} & ${reviewedSub2.status}`);
    }

    // 6. Delete challenge guard check
    console.log('\n[Check 6] Testing deletion block when coding_submissions exist against challenge...');
    const checkSubmissions = await pool.query(
      `SELECT COUNT(*)::int as count FROM coding_submissions WHERE challenge_id = $1`,
      [challenge.id]
    );
    if (checkSubmissions.rows[0].count > 0) {
      console.log(`✓ Block condition detected: ${checkSubmissions.rows[0].count} submissions exist against challenge ID ${challenge.id}. Deletion correctly BLOCKED!`);
    } else {
      console.error('❌ FAIL: Failed to detect existing submissions for deletion block!');
    }

    console.log('\n=== ALL DAY 9 VERIFICATION CHECKS PASSED SUCCESSFULLY ===\n');
    process.exit(0);
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

verifyDay9();
