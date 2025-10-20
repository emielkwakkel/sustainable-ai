# Sustainable AI Platform CLI

Command-line tooling to calculate energy use and carbon emissions for AI model token workloads, list available configurations, and manage local CLI settings.

## Installation

- Global (recommended during development):

```bash
npm install -g ./packages/cli
```

- Nx workspace (run without global install):

```bash
npx nx run cli:build && node packages/cli/dist/src/index.js --help
```

The executable name is `sustainable-ai`.

### Usage

```bash
sustainable-ai [command] [options]
```

Show help and version:

```bash
sustainable-ai --help
sustainable-ai --version
```

## Commands

- `calculate` — Calculate carbon emissions for AI model token usage
  - Options:
    - `-t, --tokens <number>`: Number of tokens to calculate for (default: `1000`)
    - `-m, --model <string>`: AI model id (default: `gpt-4`)
    - `-h, --hardware <string>`: Hardware id (default: `nvidia-a100`)
    - `-d, --datacenter <string>`: Data center provider id (default: `google-cloud`)
    - `-r, --region <string>`: Data center region id (default: `google-taiwan`)
    - `-p, --pue <number>`: Override PUE value
    - `-c, --carbon-intensity <number>`: Override carbon intensity in kg CO₂/kWh
    - `-o, --output <format>`: `json`, `table`, or `csv` (default: `table`)
    - `-v, --verbose`: Print additional details

- `list` — List available models, hardware, data centers and regions
  - Options:
    - `-m, --models`: List available AI models
    - `-h, --hardware`: List available hardware configurations
    - `-d, --datacenters`: List data center providers
    - `-r, --regions <provider>`: List regions for a provider id
    - `-a, --all`: List everything

- `config` — Manage CLI configuration (stubbed)
  - Options:
    - `--set <key=value>`: Set a configuration value
    - `--get <key>`: Get a configuration value
    - `--list`: List configuration values
    - `--reset`: Reset configuration to defaults

## Examples

- Calculate emissions for 10,000 tokens on default settings:

```bash
sustainable-ai calculate -t 10000
```

- Calculate using specific model, hardware, and region with table output:

```bash
sustainable-ai calculate \
  --tokens 5000 \
  --model gpt-4 \
  --hardware nvidia-a100 \
  --datacenter google-cloud \
  --region google-taiwan \
  --output table
```

- Calculate with custom PUE and carbon intensity, returning JSON:

```bash
sustainable-ai calculate -t 2500 -p 1.2 -c 0.35 -o json
```

- List everything available:

```bash
sustainable-ai list --all
```

- List regions for a specific provider:

```bash
sustainable-ai list --regions google-cloud
```

### Output

- Table (default): human-readable summary with energy (kWh), total emissions (g CO₂), per-token emissions, and equivalence metrics.
- JSON: structured object suitable for scripting.
- CSV: simple metric/value/unit rows.

### Exit Codes

- `0` success
- `1` validation or runtime error (e.g., invalid tokens, unknown ids)

### Notes

- The `config` command currently prints and accepts values but does not persist them yet.
- Models, hardware, and data center definitions are sourced from `@susai/config` shared package.


