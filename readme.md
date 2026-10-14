
# @aiondigitalengineering/opentelemetry

## introduction

`@aiondigitalengineering/opentelemetry` is an npm package for setting up OpenTelemetry tracing and metrics in Node.js applications. It provides an easy way to configure and initialize OpenTelemetry instrumentation and exporters.



## Installation


You can install this package using npm or yarn:

```bash
npm install @aiondigitalengineering/opentelemetry
```
    
## Usage/Examples

To use this package, you can follow these steps:

1. install the package
```
npm install @aiondigitalengineering/opentelemetry
```
2. import and setup
```
import { opentelemetry } from '@aiondigitalengineering/opentelemetry';
opentelemetry();
```
3. Configuration

You can configure the behavior of the package using environment variables. Here are the available configuration options:

- `ENV_RBX_TELEMETRY_ENABLED`: Enable or disable telemetry (true/false).
- `ENV_RBX_TELEMETRY_DEBUG_ENABLED`: Enable debug mode (true/false).
- `ENV_RBX_APP_NAME`: Specify the application name.
- `ENV_RBX_JAEGER_URL`: Specify the Jaeger endpoint.
- `ENV_RBX_JAEGER_TOKEN`: Specify the Jaeger token.
- `ENV_RBX_PROMETHEUS_ENABLED`: Enable or disable Prometheus metrics (true/false).
- `ENV_RBX_PROMETHEUS_SCRAPPER_ENDPOINT`: Specify the Prometheus scrape endpoint.
- `ENV_RBX_PROMETHEUS_SCRAPPER_PORT`: Specify the Prometheus scrape port.

Make sure to set these environment variables as needed.
## Registry

From 2.0.0 the package is published to GitHub Packages as `@aiondigitalengineering/opentelemetry`.
Versions up to 1.0.3 were published to npm as `@aiondigital/opentelemetry`.

Services that import `@aiondigital/opentelemetry` can keep their code unchanged with an npm alias:

```json
"@aiondigital/opentelemetry": "npm:@aiondigitalengineering/opentelemetry@^2.0.0"
```

The service `.npmrc` must map the `@aiondigitalengineering` scope to `https://npm.pkg.github.com` with a token that can read packages.

## License

This package is released under the [MIT License](https://choosealicense.com/licenses/mit/) 

