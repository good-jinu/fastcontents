# Contributing to FastContents

We use [changesets](https://github.com/changesets/changesets) to manage our versioning and changelogs. When you contribute a change, you will need to add a changeset file.

## Adding a Changeset

To add a changeset, run the following command:

```bash
pnpm changeset
```

This will prompt you to select the packages that have been changed, the type of change (major, minor, or patch), and a description of the change. Once you have filled out the prompts, a new changeset file will be created in the `.changeset` directory.

## Submitting a Pull Request

Once you have added a changeset, you can commit it along with your other changes and submit a pull request. The changeset will be used to automatically update the version and changelog when the pull request is merged.
