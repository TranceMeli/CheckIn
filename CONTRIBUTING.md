# Contributing

Thanks for helping with CheckIn. This is a small demo project, so the process is light.

## Set up

Follow the [Quick start](README.md#quick-start) in the README. You need the .NET 10 SDK, Node.js 20.19 or newer and SQL Server LocalDB.

## Before you open a pull request

Run the checks for the part you changed:

```bash
# Backend
dotnet test backend.Tests/backend.Tests.csproj

# Frontend
cd frontend
npm test
npm run lint
```

`npm run lint` currently reports one known error in `src/contexts/AuthContext.jsx` (fast refresh rule). Please do not add new ones.

## Guidelines

- Work on a branch such as `feature/short-description` or `fix/short-description`, not on `main`.
- Add or update tests for changed behaviour. Bug fixes should come with a test that fails without the fix.
- Keep user-facing texts in German and code identifiers consistent with the existing code.
- Comment the *why*, not the *what*: a business rule, a constraint, a workaround. Delete commented-out code, Git keeps the history.
- Never commit secrets. `appsettings.Development.json` and `.env` files are git-ignored.
- Write commit messages in the imperative, for example `Add check-in correction endpoint`.

## Reporting bugs

Open a [GitHub issue](https://github.com/TranceMeli/CheckIn/issues) with the steps to reproduce, what you expected and what happened. Include the browser and the .NET and Node.js versions.
