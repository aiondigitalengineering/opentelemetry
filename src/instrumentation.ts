import {
  NodeTracerProvider,
  BatchSpanProcessor,
  SamplingResult,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressInstrumentation } from 'opentelemetry-instrumentation-express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Context, SpanKind, Attributes, Link } from '@opentelemetry/api';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

import * as fs from 'fs';

/**
 * Retrieves the application name from the 'package.json' file.
 * @returns The application name or undefine if there is an error.
 */
const applicationName = () => {
  try {
    const data = fs.readFileSync('./package.json', 'utf8');
    const packageInfo: { name: string } = JSON.parse(data);
    return packageInfo.name;
  } catch (err) {
    console.error('Error:', err);
    return;
  }
};

// Configuration for Prometheus.
interface PrometheusConfig {
  enabled: boolean;
  endpoint: string;
  port: number;
}

// Configuration for Telemetry.
export interface TelemetryConfig {
  enabled: boolean;
  debug: boolean;
  appName?: string;
  jaeger?: string;
  jaeger_token?: string;
  prometheus: PrometheusConfig;
}

/**
 * Retrieves the telemetry configuration.
 * @returns The telemetry configuration.
 */
const telemetryConfig = (): TelemetryConfig => {
  return {
    enabled: process.env.ENV_RBX_TELEMETRY_ENABLED == 'true',
    debug: process.env.ENV_RBX_TELEMETRY_DEBUG_ENABLED == 'true',
    appName: process.env.ENV_RBX_APP_NAME || applicationName(),
    jaeger: process.env.ENV_RBX_JAEGER_URL,
    jaeger_token: process.env.ENV_RBX_JAEGER_TOKEN,
    prometheus: {
      enabled: process.env.ENV_RBX_PROMETHEUS_ENABLED == 'true',
      endpoint:
        process.env.ENV_RBX_PROMETHEUS_SCRAPPER_ENDPOINT ||
        PrometheusExporter.DEFAULT_OPTIONS.endpoint,
      port: Number.parseInt(
        process.env.ENV_RBX_PROMETHEUS_SCRAPPER_PORT || '0',
      ),
    },
  };
};

/**
 * Sets up telemetry with OpenTelemetry.
 */
export default function setup() {
  const config = telemetryConfig();

  // Do traces only if it's enabled.
  if (!config.enabled) {
    return;
  }

  // Debug OpenTelemetry only if it's enabled.
  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
  }

  setupNodeTracer(config);
  const meterProvider = metricsProvider(config);

  const instrumentation = new NestInstrumentation();

  registerInstrumentations({
    meterProvider: meterProvider,
    instrumentations: [
      instrumentation,
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-express': { enabled: false },
        '@opentelemetry/instrumentation-dataloader': { enabled: false },
      }),
      new ExpressInstrumentation(),
    ],
  });
}

/**
 * Sets up the Node.js tracer with OpenTelemetry.
 * @param config - The telemetry configuration.
 */
function setupNodeTracer(config: TelemetryConfig) {
  const serviceName = config.appName;

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    sampler: new RubixSampler({
      root: new TraceIdRatioBasedSampler(0.5),
    }),
  });

  provider.register();
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: config.jaeger,
        headers: {
          Authorization: config.jaeger_token,
        },
      }),
    ),
  );
}

/**
 * Sets up the metrics provider for Prometheus.
 * @param config - The telemetry configuration.
 * @returns The metrics provider.
 */
function metricsProvider(config: TelemetryConfig) {
  const { prometheus } = config;

  if (!prometheus.enabled) {
    return;
  }

  const metricExporter = new PrometheusExporter(
    {
      endpoint: prometheus.endpoint,
      port: prometheus.port,
    },
    () => {
      console.log(
        `Prometheus scrape endpoint: http://localhost:${prometheus.port}${prometheus.endpoint}`,
      );
    },
  );

  // Creates MeterProvider and installs the exporter as a MetricReader
  const meterProvider = new MeterProvider();
  meterProvider.addMetricReader(metricExporter);
  return meterProvider;
}

// Custom sampler for tracing (can be extended as per requirements)
class RubixSampler extends ParentBasedSampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    // if (attributes['http.url'] ?? "".includes(`${port}${endpoint}`)) {
    //     return {
    //         decision: SamplingDecision.NOT_RECORD
    //     }
    // }
    return super.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links,
    );
  }
}
