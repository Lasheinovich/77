import { captureError } from "@/lib/error-tracking";
import { performHealthCheck } from "@/lib/health-check";
import * as tf from "@tensorflow/tfjs"; // For AI/ML anomaly detection
import { fetchServiceList } from "@/lib/service-discovery"; // For auto-discovery
import axios from "axios"; // For real-time metrics

// Added missing typings for axios and node
// Ensure to install them using: npm install --save-dev @types/node @types/axios

interface ServiceConfig {
  name: string;
  healthCheckInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
  criticalService: boolean;
  restartStrategy: "immediate" | "exponential-backoff" | "manual";
  dependencies?: string[];
  onHealthCheck?: () => Promise<boolean>;
  onRestart?: () => Promise<void>;
}

interface ServiceStatus {
  isRunning: boolean;
  lastHealthCheck: Date | null;
  healthCheckStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  failedHealthChecks: number;
  restartAttempts: number;
  lastRestartAttempt: Date | null;
  lastError: Error | null;
}

interface ServiceHealth {
  status: string;
  // optionally: metrics, errorLogs, responseTime
}

interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  services: Record<string, ServiceHealth>;
}

// Metrics response from Prometheus
interface PrometheusQueryResult {
  data: {
    data: {
      result: Array<{
        value: [number, string]; // [timestamp, value]
      }>;
    };
  };
}

// Feedback data for anomaly detection
interface FeedbackData {
  serviceName: string;
  failedHealthChecks: number;
  restartAttempts: number;
  anomalyScore: number;
  timestamp: Date;
}

class ServiceManager {
  private services: Map<
    string,
    {
      config: ServiceConfig;
      status: ServiceStatus;
      healthCheckTimer?: NodeJS.Timeout;
    }
  > = new Map();
  private anomalyModel: tf.LayersModel | null = null;
  private feedbackData: FeedbackData[] = [];

  constructor() {
    // Start monitoring system health periodically
    setInterval(this.monitorSystemHealth.bind(this), 60000); // Check every minute
    // Start auto-discovery periodically
    setInterval(this.autoDiscoverServices.bind(this), 300000); // Every 5 minutes
    // Load anomaly detection model
    this.loadAnomalyModel();
    // Schedule periodic retraining of anomaly detection model
    setInterval(this.trainAnomalyModel.bind(this), 3600000); // every hour
    this.autoDiscoverServices(); // Initial discovery on startup

    // Added real-time self-healing hook
    setInterval(() => {
      try {
        this.monitorSystemHealth();
      } catch (error) {
        console.error("System monitor error:", error);
      }
    }, 60_000); // every 1 minute
  }

  /**
   * Registers a service for monitoring and self-healing
   */
  registerService(config: ServiceConfig): void {
    if (this.services.has(config.name)) {
      console.warn(`Service ${config.name} is already registered`);
      return;
    }

    const status: ServiceStatus = {
      isRunning: true, // Assume services start in running state
      lastHealthCheck: null,
      healthCheckStatus: "unknown",
      failedHealthChecks: 0,
      restartAttempts: 0,
      lastRestartAttempt: null,
      lastError: null,
    };

    this.services.set(config.name, { config, status });

    // Start health check timer
    this.startHealthCheck(config.name);

    console.log(`Service ${config.name} registered for monitoring`);
  }

  /**
   * Starts the health check timer for a service
   */
  private startHealthCheck(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (!service) return;

    // Clear any existing timer
    if (service.healthCheckTimer) {
      clearInterval(service.healthCheckTimer);
    }

    // Set up new timer
    service.healthCheckTimer = setInterval(
      () => this.checkServiceHealth(serviceName),
      service.config.healthCheckInterval
    );
  }

  /**
   * Loads or trains an AI/ML model for anomaly detection
   */
  private async loadAnomalyModel() {
    // Placeholder: Load a pre-trained model or train on feedbackData
    // In production, use real data and a robust model
    // this.anomalyModel = await tf.loadLayersModel('path/to/model.json');
    this.anomalyModel = null; // For now, no model loaded
  }

  /**
   * Auto-discovers and registers new backend services
   */
  private async autoDiscoverServices() {
    const discovered = await fetchServiceList();
    for (const config of discovered) {
      if (!this.services.has(config.name)) {
        this.registerService(config);
      }
    }
  }

  /**
   * Fetch real-time metrics for a service from Prometheus
   */
  private async fetchServiceMetrics(serviceName: string): Promise<number[]> {
    try {
      const response = await axios.get<PrometheusQueryResult>("http://monitoring:9090/api/v1/query", {
        params: { query: `rate(container_cpu_usage_seconds_total{container="${serviceName}"}[5m])` },
      });
      const values = response.data.data.result.map((r) => parseFloat(r.value[1]));
      return values;
    } catch {
      return [];
    }
  }

  /**
   * Retrains or fine-tunes the anomaly detection model using collected feedback data
   */
  private async trainAnomalyModel() {
    if (!this.feedbackData.length) return;
    // Placeholder: simple model retraining using feedbackData
    // In production, replace with robust training pipeline
    const xs = tf.tensor2d(this.feedbackData.map((d) => [d.failedHealthChecks, d.restartAttempts]));
    const ys = tf.tensor2d(this.feedbackData.map((d) => [d.anomalyScore]));
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: "relu", inputShape: [2] }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    model.compile({ loss: "meanSquaredError", optimizer: "adam" });
    await model.fit(xs, ys, { epochs: 10 });
    this.anomalyModel = model;
    // Clear feedback data to avoid retraining on stale data
    this.feedbackData = [];
    console.log("Anomaly detection model retrained successfully");
  }

  /**
   * Enhanced health check with metrics-driven anomaly detection
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) return;

    try {
      // Fetch metrics and integrate into health decision
      const cpuMetrics = await this.fetchServiceMetrics(serviceName);
      const avgCpu = cpuMetrics.length ? cpuMetrics.reduce((a, b) => a + b) / cpuMetrics.length : 0;

      let isHealthy = true;
      let anomalyScore = 0;

      // If service has a custom health check, use it
      if (service.config.onHealthCheck) {
        isHealthy = await service.config.onHealthCheck();
      } else {
        // Otherwise use the global health check
        const health = await performHealthCheck();
        isHealthy = health.services[serviceName]?.status === "healthy";
        // AI/ML anomaly detection (placeholder logic)
        if (this.anomalyModel) {
          const input = tf.tensor([service.status.failedHealthChecks, service.status.restartAttempts]);
          const prediction = this.anomalyModel.predict(input.reshape([1, 2])) as tf.Tensor;
          anomalyScore = (await prediction.data())[0];
          if (anomalyScore > 0.8) isHealthy = false;
        }
      }

      // incorporate cpu threshold
      if (avgCpu > 0.5) isHealthy = false;

      // Update service status
      service.status.lastHealthCheck = new Date();
      service.status.healthCheckStatus = isHealthy ? "healthy" : "unhealthy";

      if (isHealthy) {
        // Reset failure counters on success
        service.status.failedHealthChecks = 0;
      } else {
        // Increment failure counter
        service.status.failedHealthChecks++;

        console.warn(
          `Service ${serviceName} failed health check (${service.status.failedHealthChecks}/${service.config.maxRetries})`
        );

        // Attempt restart if max retries exceeded
        if (service.status.failedHealthChecks >= service.config.maxRetries) {
          this.restartService(serviceName);
        }
      }
      // Feedback loop: collect data for self-learning
      this.feedbackData.push({
        serviceName,
        failedHealthChecks: service.status.failedHealthChecks,
        restartAttempts: service.status.restartAttempts,
        anomalyScore,
        timestamp: new Date(),
      });
    } catch (error) {
      // Handle errors in the health check itself
      service.status.lastError = error instanceof Error ? error : new Error(String(error));
      service.status.failedHealthChecks++;

      captureError(service.status.lastError, undefined, {
        component: "ServiceManager",
        serviceName,
        operation: "healthCheck",
        severity: service.config.criticalService ? "high" : "medium",
      });

      console.error(`Error checking health of service ${serviceName}:`, error);
    }
  }

  /**
   * Attempts to restart a service
   */
  private async restartService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) return;

    service.status.restartAttempts++;
    service.status.lastRestartAttempt = new Date();

    console.log(`Attempting to restart service ${serviceName} (attempt ${service.status.restartAttempts})`);

    try {
      // If service has a custom restart handler, use it
      if (service.config.onRestart) {
        await service.config.onRestart();
      } else {
        // Default restart logic - simulate service restart
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Reset failure counter after successful restart
      service.status.failedHealthChecks = 0;
      service.status.isRunning = true;

      console.log(`Service ${serviceName} restarted successfully`);
    } catch (error) {
      service.status.lastError = error instanceof Error ? error : new Error(String(error));
      service.status.isRunning = false;

      captureError(service.status.lastError, undefined, {
        component: "ServiceManager",
        serviceName,
        operation: "restart",
        severity: service.config.criticalService ? "critical" : "high",
      });

      console.error(`Failed to restart service ${serviceName}:`, error);

      // If this is a critical service, alert administrators
      if (service.config.criticalService) {
        this.alertCriticalServiceFailure(serviceName, service.status.lastError);
      }
    }
  }

  /**
   * Alerts administrators about critical service failures
   */
  private alertCriticalServiceFailure(serviceName: string, error: Error): void {
    // In a real implementation, this would send alerts via email, SMS, etc.
    console.error(`CRITICAL SERVICE FAILURE: ${serviceName}`, error);

    // Log to error tracking with highest severity
    captureError(error, undefined, {
      component: "ServiceManager",
      serviceName,
      operation: "criticalFailure",
      severity: "critical",
    });
  }

  /**
   * Periodically monitors overall system health
   */
  async monitorSystemHealth(): Promise<void> {
    const health = (await performHealthCheck()) as HealthCheckResult;

    if (health.status !== "healthy") {
      console.warn(`System health is ${health.status}. Checking services...`);

      for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
        if (serviceHealth.status !== "healthy") {
          const service = this.services.get(serviceName);
          if (service) {
            this.checkServiceHealth(serviceName);
          }
        }
      }
    }
  }

  /**
   * Gets the status of all registered services
   */
  getServicesStatus(): Record<
    string,
    {
      config: Omit<ServiceConfig, "onHealthCheck" | "onRestart">;
      status: ServiceStatus;
    }
  > {
    const result: Record<string, {
      config: Omit<ServiceConfig, "onHealthCheck" | "onRestart">;
      status: ServiceStatus;
    }> = {};

    for (const [name, service] of this.services.entries()) {
      // Omit function properties from the config
      const { onHealthCheck, onRestart, ...configWithoutFunctions } = service.config;

      result[name] = {
        config: configWithoutFunctions,
        status: service.status,
      };
    }

    return result;
  }

  /**
   * Gets the status of a specific service
   */
  getServiceStatus(
    serviceName: string
  ): {
    config: Omit<ServiceConfig, "onHealthCheck" | "onRestart">;
    status: ServiceStatus;
  } | null {
    const service = this.services.get(serviceName);
    if (!service) return null;

    // Omit function properties from the config
    const { onHealthCheck, onRestart, ...configWithoutFunctions } = service.config;

    return {
      config: configWithoutFunctions,
      status: service.status,
    };
  }

  /**
   * Manually triggers a health check for a service
   */
  triggerHealthCheck(serviceName: string): Promise<void> {
    return this.checkServiceHealth(serviceName);
  }

  /**
   * Manually triggers a service restart
   */
  triggerRestart(serviceName: string): Promise<void> {
    return this.restartService(serviceName);
  }
}

// Create a singleton instance
export const serviceManager = new ServiceManager();

// Manual registrations removed: services will be auto-discovered and registered by ServiceManager
