# Harper Vance Repository Workflow

## Source of truth

`main` is the only long-lived development and release branch for the Harper Vance frontend. The former `dev` branch is retired and must not be recreated as part of the normal workflow.

The application deployed from `main` remains connected to the `goldensetups-dev` Firebase project and the `harpervanceqa` Hosting site. The Firebase project name is an infrastructure identifier; it does not change the repository branch policy.

## Standard change flow

1. Update the local `main` branch from `origin/main`.
2. Create a short-lived feature or fix branch from the updated `main` branch.
3. Make and test the change on that branch.
4. Push the branch and open a pull request targeting `main`.
5. Review the automatic Firebase preview linked in the pull request.
6. Merge the approved pull request into `main`.
7. Confirm the main deployment workflow completes successfully.
8. Delete the short-lived branch after the merge when it is no longer needed.

Do not begin new work from another feature branch, a stale local branch, or the retired `dev` branch.

## Pull request previews

The `Firebase Hosting Preview` workflow runs when a pull request is opened, updated, or reopened. It:

- installs locked dependencies;
- runs the complete frontend test suite;
- creates a production build;
- deploys a temporary Firebase Hosting preview; and
- adds the preview link to the pull request description.

The preview is the required review environment before a pull request is merged. It is not the live release.

## Main deployment

Every push to `main`, including every merged pull request, triggers `Deploy Firebase Hosting from Main`. The workflow:

- installs dependencies from the lockfile;
- runs the complete frontend test suite;
- creates the production build; and
- deploys the build to the Firebase Hosting live channel.

The deployment uses:

- Firebase project: `goldensetups-dev`
- Firebase Hosting site: `harpervanceqa`
- GitHub secret: `FIREBASE_SERVICE_ACCOUNT_GOLDENSETUPS_DEV`

A change is released only after the main deployment workflow succeeds.

## Direct pushes and branch protection

Repository contributors should use pull requests rather than pushing product changes directly to `main`. GitHub branch protection should require pull requests and successful checks for `main` when those controls are enabled for the repository.

The deployment intentionally listens to every push to `main`. This ensures that approved merges, authorized maintenance commits, and rollback commits all produce a matching Firebase release.

## Rollback

If a release causes a problem:

1. Revert the offending merge on a new branch created from the latest `main`.
2. Open and review a pull request for the revert.
3. Merge the revert into `main`.
4. Confirm the main deployment workflow succeeds.

Avoid rewriting `main` history or force-pushing an older commit. A revert preserves the audit trail and triggers the same tested deployment path as a normal release.

## Required checks before merge

- The pull request targets `main`.
- The branch started from a current `main` commit.
- The Firebase preview workflow passed.
- The preview was reviewed at the linked URL.
- The change does not expose private configuration or client data.
- The post-merge main deployment is monitored to completion.
