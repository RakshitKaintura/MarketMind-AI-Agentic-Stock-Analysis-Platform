// Circuit breaker — stops hammering a failing external service

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

const circuits = new Map<
  string,
  {
    state: CircuitState;
    failures: number;
    lastFailure: number;
  }
>();

export function getCircuit(name: string, threshold = 5, cooldownMs = 30_000) {
  if (!circuits.has(name)) {
    circuits.set(name, { state: "CLOSED", failures: 0, lastFailure: 0 });
  }
  const circuit = circuits.get(name)!;

  return {
    isOpen(): boolean {
      if (circuit.state === "OPEN") {
        if (Date.now() - circuit.lastFailure > cooldownMs) {
          circuit.state = "HALF_OPEN";
          return false;
        }
        return true;
      }
      return false;
    },
    recordSuccess() {
      circuit.state = "CLOSED";
      circuit.failures = 0;
    },
    recordFailure() {
      circuit.failures++;
      circuit.lastFailure = Date.now();
      if (circuit.failures >= threshold) {
        circuit.state = "OPEN";
      }
    },
  };
}
