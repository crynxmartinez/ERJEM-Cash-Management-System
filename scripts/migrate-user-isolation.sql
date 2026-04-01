-- Migration script to prepare production database for multi-account isolation
-- Run this BEFORE deploying the new code

-- Step 1: Update jovanni@martinez.com user with branchId for erjem-glass
UPDATE "User"
SET "branchId" = 'erjem-glass'
WHERE email = 'jovanni@martinez.com';

-- Step 2: Delete the erjem-machine-shop branch (empty/dummy branch)
DELETE FROM "Branch"
WHERE id = 'erjem-machine-shop';

-- Step 3: Verify all transactions are linked to jovanni's userId
-- (This should already be the case based on our database check)
-- No action needed - all 734 transactions already have correct userId

-- Step 4: Verify the migration
SELECT 
  u.email,
  u."branchId",
  b.id as branch_id,
  b."displayName" as branch_name,
  COUNT(t.id) as transaction_count
FROM "User" u
LEFT JOIN "Branch" b ON u."branchId" = b.id
LEFT JOIN "Transaction" t ON t."userId" = u.id
WHERE u.email = 'jovanni@martinez.com'
GROUP BY u.email, u."branchId", b.id, b."displayName";

-- Expected result:
-- email: jovanni@martinez.com
-- branchId: erjem-glass
-- branch_id: erjem-glass
-- branch_name: ERJEM Glass
-- transaction_count: 734
