import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

export type HealthState = "ok" | "degraded" | "down" | "not_configured";

export type HealthCheckResult = {
  status: HealthState;
  latencyMs: number;
  details?: string;
};

export type HealthReport = {
  status: Exclude<HealthState, "not_configured">;
  timestamp: string;
  checks: Record<string, HealthCheckResult>;
};

const REQUEST_TIMEOUT_MS = 5000;

function createTimer() {
  const startedAt = Date.now();

  return {
    elapsedMs: () => Date.now() - startedAt,
  };
}

function isConfigured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value.trim()));
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

async function checkSelf(): Promise<HealthCheckResult> {
  return {
    status: "ok",
    latencyMs: 0,
    details: "Route handler responded successfully.",
  };
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const timer = createTimer();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfigured(url, serviceRoleKey)) {
    return {
      status: "not_configured",
      latencyMs: timer.elapsedMs(),
      details: "Supabase URL or service role key is missing.",
    };
  }

  try {
    const supabase = createSupabaseClient(url!, serviceRoleKey!);
    const { error } = await withTimeout(async () =>
      await supabase
        .from("students")
        .select("id", { head: true, count: "exact" })
        .limit(1)
    );

    if (error) {
      return {
        status: "down",
        latencyMs: timer.elapsedMs(),
        details: error.message,
      };
    }

    return {
      status: "ok",
      latencyMs: timer.elapsedMs(),
      details: "Supabase query succeeded.",
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: timer.elapsedMs(),
      details: errorMessage(error),
    };
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  const timer = createTimer();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!isConfigured(url, token)) {
    return {
      status: "not_configured",
      latencyMs: timer.elapsedMs(),
      details: "Upstash Redis URL or token is missing.",
    };
  }

  try {
    const redis = new Redis({
      url: url!,
      token: token!,
    });

    const response = await withTimeout(() => redis.ping());

    return {
      status: response === "PONG" ? "ok" : "degraded",
      latencyMs: timer.elapsedMs(),
      details:
        response === "PONG"
          ? "Redis ping returned PONG."
          : `Unexpected Redis ping response: ${String(response)}`,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: timer.elapsedMs(),
      details: errorMessage(error),
    };
  }
}

async function checkUploadthing(): Promise<HealthCheckResult> {
  const timer = createTimer();
  const token = process.env.UPLOADTHING_TOKEN;

  if (!isConfigured(token)) {
    return {
      status: "not_configured",
      latencyMs: timer.elapsedMs(),
      details: "UploadThing token is missing.",
    };
  }

  return {
    status: "degraded",
    latencyMs: timer.elapsedMs(),
    details: "UploadThing token is configured. Active probe not implemented yet.",
  };
}

async function checkOpenRouter(): Promise<HealthCheckResult> {
  const timer = createTimer();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!isConfigured(apiKey)) {
    return {
      status: "not_configured",
      latencyMs: timer.elapsedMs(),
      details: "OpenRouter API key is missing.",
    };
  }

  try {
    const response = await withTimeout((signal) =>
      fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey!}`,
        },
        signal,
        cache: "no-store",
      })
    );

    if (!response.ok) {
      return {
        status: "down",
        latencyMs: timer.elapsedMs(),
        details: `OpenRouter returned HTTP ${response.status}.`,
      };
    }

    return {
      status: "ok",
      latencyMs: timer.elapsedMs(),
      details: "OpenRouter models endpoint responded.",
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: timer.elapsedMs(),
      details: errorMessage(error),
    };
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const checks = {
    app: await checkSelf(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    openrouter: await checkOpenRouter(),
    uploadthing: await checkUploadthing(),
  };

  const hasDown = Object.values(checks).some((check) => check.status === "down");
  const hasDegraded = Object.values(checks).some((check) =>
    ["degraded", "not_configured"].includes(check.status)
  );

  return {
    status: hasDown ? "down" : hasDegraded ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    checks,
  };
}
