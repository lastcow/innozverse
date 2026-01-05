---
description: Test, build, and push Node.js project. Auto-fix failing tests.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: [commit-message]
---

# Node.js: Test, Build, Push

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Run Tests
```bash
npm test
```

**If tests fail:**
1. Read the error output carefully
2. Identify the failing test file and assertion
3. Determine if the bug is in the source code or the test
4. Fix the issue
5. Run `npm test` again
6. Repeat until passing (max 3 fix attempts)

## Step 3: Lint (if script exists)
```bash
npm run lint --if-present
```
If lint errors, run `npm run lint -- --fix` or fix manually.

## Step 4: Build
```bash
npm run build --if-present
```
If build fails, fix and retry.

## Step 5: Commit and Push
```bash
git add -A
git commit -m "$ARGUMENTS"
git push origin HEAD
```

If no commit message given, generate one from `git diff --staged` using conventional commit format (feat/fix/docs/refactor/test).

## Final Output
```
✅ Tests: passed
✅ Build: successful
✅ Pushed: [branch] @ [short-hash]
```