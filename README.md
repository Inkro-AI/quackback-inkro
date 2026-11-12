# Inkro Quackback

Independent deployment of [Quackback](https://github.com/QuackbackIO/quackback),
based on v0.15.0, with complete Slovak and Czech message catalogs and an
SK / CS / EN language selector. This repository contains only Quackback and
its Inkro modifications. It is not a submodule or build dependency of the
main Inkro application.

- Browser language detection; explicit selection remembered for one year.
- 2,266 entries per catalog, including existing admin translations.
- Admin copy outside the existing catalogs is unchanged.
- Feedback posts and comments are not automatically translated.
- Source/license link in the account menu and public sign-in dialog and matching source archive in each image.

## License and source

AGPL-3.0; see [LICENSE](LICENSE) and [INKRO-CHANGES.txt](INKRO-CHANGES.txt).
Upstream notices are preserved. Changes are dated 2026-11-12.
Network users of the modified service must be offered its corresponding
source. The account menu and public sign-in dialog link to `/inkro-source.html`, which offers the
matching `/inkro-quackback-source.tar.gz` and license. Keep this source offer
accessible in deployments, including any additional customized interfaces.

The source archive is made from the exact Git commit before building, contains
build scripts and notices, and excludes credentials, `.git` and dependencies.
Retain corresponding source for every published/deployed image version.
This repository does not contain Inkro customer data or production settings.

## Build

```sh
python3 scripts/inkro-source-archive.py
docker build -t quackback-inkro:local -f apps/web/Dockerfile .
```

Use a clean checkout and enough build memory (16 GB recommended). Docker
builds the widget, web application and runtime migration tools using Bun 1.4.0.
The source preparation script requires Python 3 and Git. See
[UPSTREAM-README.md](UPSTREAM-README.md) for upstream configuration and local
application development.

## GHCR and Dokploy

The `Inkro image` workflow validates the localization, builds on native AMD64
and ARM64 runners, and publishes a multi-architecture image to
`ghcr.io/inkro-ai/quackback-inkro:0.15.0-inkro-COMMIT_SHA`.
It uses the repository's short-lived `GITHUB_TOKEN`; no production credentials
or Dokploy tokens are needed. Publication does not redeploy Dokploy.

After a successful build, update only the existing Dokploy application's
image reference to the published digest. Preserve its environment, database
volume, networks and domain. Test readiness, sign-in, file uploads and language
selection. The customization adds no database migrations; the original
`ghcr.io/quackbackio/quackback:0.15.0` remains the rollback image.

The upstream workflows are retained in `.github/upstream-workflows` for
reference and are not enabled for this independent repository.
