const truthy = (v: string | undefined) =>
  v === "true" || v === "1" || (v || "").toLowerCase() === "true";

function loadTracing(): void {
  if (!truthy(process.env.OTEL_ENABLED)) {
    return;
  }
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { NodeSDK } =
    require("@opentelemetry/sdk-node") as typeof import("@opentelemetry/sdk-node");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { getNodeAutoInstrumentations } =
    require("@opentelemetry/auto-instrumentations-node") as typeof import("@opentelemetry/auto-instrumentations-node");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { OTLPTraceExporter } =
    require("@opentelemetry/exporter-trace-otlp-http") as typeof import("@opentelemetry/exporter-trace-otlp-http");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { resourceFromAttributes } =
    require("@opentelemetry/resources") as typeof import("@opentelemetry/resources");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { ATTR_SERVICE_NAME } =
    require("@opentelemetry/semantic-conventions") as typeof import("@opentelemetry/semantic-conventions");

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "consilium-api",
    }),
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
}

loadTracing();
