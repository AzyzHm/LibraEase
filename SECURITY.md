# Security Policy

## Supported Versions

LibraEase is developed on a single `main` branch with no maintained release lines. Security fixes are applied to `main` only, there is no backport policy for older commits or tags.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Publicly disclosing a vulnerability before it's fixed puts every deployment of this project at risk.

If you discover a serious vulnerability, anything that could let someone bypass authentication or authorization, access or modify another user's data, execute arbitrary code, escalate privileges (for example, a patron obtaining `ADMIN`/`EMPLOYEE` access), or otherwise compromise the confidentiality, integrity, or availability of the system, report it directly and privately by email:

**elhammemi001@gmail.com**

Please include as much of the following as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce it (a minimal example, request/response pair, or proof-of-concept script helps a lot)
- The affected file(s), endpoint(s), or component(s), if known
- Whether you're aware of it being exploited in the wild

### What to expect

- **Acknowledgment**: within 3 business days of your report.
- **Assessment**: a follow-up on whether the issue is confirmed, its severity, and a rough timeline for a fix.
- **Disclosure**: once a fix is available, we'll coordinate with you on when and how the issue is disclosed publicly (for example, via a GitHub Security Advisory). We ask that you not disclose the issue publicly until a fix has shipped.

### Scope

This policy covers the code in this repository both `Server/` (the Express/Supabase API) and `Web/` (the Angular client). Vulnerabilities in third-party dependencies should generally be reported to the maintainers of that dependency directly, but feel free to also flag them here (via email, not a public issue) if you believe LibraEase's usage of that dependency makes it exploitable.

Non-security bugs, feature requests, and general questions should go through the normal [issue tracker](../../issues) instead see [CONTRIBUTING.md](CONTRIBUTING.md).

Thank you for taking the time to report responsibly.