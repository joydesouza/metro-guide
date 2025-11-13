# Deployment Runbook: GitHub Pages

## Overview

This runbook provides operational procedures for managing the automated GitHub Pages deployment workflow. The deployment pipeline builds the static site and publishes it to GitHub Pages on merges to `main` or manual dispatch.

## Workflow Location

- **Workflow File**: `.github/workflows/deploy-pages.yml`
- **Workflow Name**: `Deploy Pages`
- **GitHub Actions**: `Actions → Deploy Pages`

## Normal Operations

### Automated Deployment

1. **Trigger**: Merges to `main` branch automatically trigger deployment
2. **Process**:
   - Code checkout with full commit history
   - Node.js 18 setup with npm cache
   - Dependency installation via `npm ci`
   - Quality gates: lint, format check, type check, test coverage
   - Production build via `npm run build`
   - Artifact upload (7-day retention)
   - Deployment to `github-pages` environment
3. **Expected Duration**: <10 minutes total, <5 minutes for build
4. **Verification**: Check workflow run summary for deployment status and live site URL

### Manual Redeployment

1. **Access**: `Actions → Deploy Pages → Run workflow`
2. **Input**: Optional branch/ref (defaults to `main`)
3. **Use Cases**:
   - Recover from transient failures
   - Redeploy current `main` without new commits
   - Test deployment of specific branch/commit
4. **Process**: Identical to automated deployment

## Failure Recovery

### Common Failure Scenarios

#### 1. Quality Gate Failures

**Symptoms**:
- Workflow fails at `Lint`, `Format check`, `Type check`, or `Test with coverage` steps
- Error messages in workflow logs

**Recovery Steps**:
1. Review failed step logs in workflow run
2. Fix issues locally:
   ```bash
   npm run lint          # Fix linting errors
   npm run format:write  # Auto-fix formatting
   npm run typecheck     # Fix type errors
   npm run test          # Fix test failures
   ```
3. Commit fixes and push to `main` (triggers new deployment)
4. Or use manual dispatch to retry after fixes

**Prevention**: Run quality checks locally before pushing:
```bash
npm run lint && npm run format && npm run typecheck && npm run test
```

#### 2. Build Failures

**Symptoms**:
- Workflow fails at `Build` step
- TypeScript compilation errors or Vite build errors

**Recovery Steps**:
1. Check build logs for specific error messages
2. Reproduce locally: `npm run build`
3. Fix build issues (missing dependencies, type errors, configuration problems)
4. Test build locally before pushing
5. Push fix to `main` or use manual dispatch

#### 3. Deployment Failures

**Symptoms**:
- Workflow fails at `Deploy to GitHub Pages` step
- GitHub Pages environment errors

**Recovery Steps**:
1. Verify repository has GitHub Pages enabled:
   - `Settings → Pages → Build and deployment → GitHub Actions`
2. Check workflow permissions:
   - Ensure `pages: write` and `id-token: write` permissions are set
3. Verify `github-pages` environment exists and is accessible
4. Check for quota limits or GitHub Pages service issues
5. Retry via manual dispatch after verifying configuration

#### 4. Dependency Installation Failures

**Symptoms**:
- Workflow fails at `Install dependencies` step
- `npm ci` errors (lockfile mismatches, network issues)

**Recovery Steps**:
1. Verify `package-lock.json` is committed and up-to-date
2. Check for network/registry issues (temporary GitHub Actions issues)
3. If lockfile is corrupted:
   ```bash
   rm package-lock.json
   npm install
   git add package-lock.json
   git commit -m "fix: regenerate package-lock.json"
   ```
4. Retry deployment after fixing lockfile

### Failure Notification Process

1. **Automatic Notifications**:
   - Failed deployments post a comment on the triggering commit
   - GitHub sends notifications to repository watchers
   - Workflow run summary includes failure diagnostics

2. **Manual Investigation**:
   - Access workflow run: `Actions → Deploy Pages → [Failed Run]`
   - Review step logs for detailed error messages
   - Check run summary for recovery guidance

### Rollback Procedures

#### Option 1: Redeploy Previous Version

1. Identify last successful deployment commit from workflow history
2. Use manual dispatch to deploy that specific commit:
   - `Actions → Deploy Pages → Run workflow`
   - Input ref: `<commit-sha-of-successful-deployment>`
3. Verify rollback deployment succeeds

#### Option 2: Revert Code Changes

1. Revert problematic commit(s) on `main`:
   ```bash
   git revert <commit-sha>
   git push origin main
   ```
2. Automatic deployment triggers with reverted code
3. Verify deployment succeeds

#### Option 3: Use Retained Artifacts

1. Access successful workflow run from history
2. Download artifact from run summary (available for 7 days)
3. Manually upload to GitHub Pages if needed (via repository settings)

## Monitoring and Observability

### Deployment Status

- **Workflow Badge**: See README.md for deployment status badge
- **Run History**: `Actions → Deploy Pages` shows all deployment runs
- **Environment Status**: `Settings → Environments → github-pages` shows deployment history

### Key Metrics

- **Deployment Frequency**: Track via workflow run history
- **Success Rate**: Monitor failed vs successful runs
- **Deployment Duration**: Review workflow run durations
- **Time to Recovery**: Track time from failure to successful redeployment

### Logs and Artifacts

- **Workflow Logs**: Available in each workflow run
- **Build Artifacts**: Retained for 7 days, downloadable from run summary
- **Deployment Outputs**: Commit SHA, artifact URL, page URL available in run summary

## Troubleshooting

### Workflow Not Triggering

**Check**:
1. Verify workflow file is in `.github/workflows/deploy-pages.yml`
2. Confirm branch is `main` (or adjust workflow trigger)
3. Check repository Actions are enabled: `Settings → Actions → General`

### Site Not Updating

**Check**:
1. Verify deployment completed successfully (green checkmark)
2. Wait up to 10 minutes for GitHub Pages propagation
3. Clear browser cache or use incognito mode
4. Verify correct branch is deployed in GitHub Pages settings

### Concurrent Deployment Issues

**Note**: Workflow includes concurrency guard (`cancel-in-progress: true`) to prevent overlapping deployments. If issues occur:
1. Check concurrency group configuration in workflow
2. Verify only one deployment runs at a time
3. Review workflow logs for cancellation messages

## Emergency Contacts

- **Repository Maintainers**: Check repository settings for maintainer list
- **GitHub Support**: For GitHub Pages service issues
- **Documentation**: See [quickstart guide](../../specs/001-deploy-gh-pages/quickstart.md) for operational procedures

## Maintenance

### Regular Tasks

- **Weekly**: Review deployment success rate and failure patterns
- **Monthly**: Audit retained artifacts and clean up if needed
- **As Needed**: Update workflow actions to latest versions (pin to major versions)

### Workflow Updates

When updating the deployment workflow:
1. Test changes in a feature branch first
2. Verify workflow syntax: `Actions → [Workflow] → [Run] → View workflow file`
3. Test manual dispatch before merging to `main`
4. Monitor first automated deployment after changes
