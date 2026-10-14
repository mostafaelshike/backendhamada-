/**
 * Enterprise Saga Orchestrator Pattern
 * Coordinates multi-step distributed operations (Order Creation -> Stock Reservation -> Payment Verification).
 * Automatically executes compensating transactions in reverse order if any step fails.
 */
class SagaStep {
  constructor({ name, action, compensate }) {
    this.name = name;
    this.action = action; // async function(context): Promise<any>
    this.compensate = compensate; // async function(context): Promise<void>
  }
}

class SagaOrchestrator {
  constructor(steps = []) {
    this.steps = steps;
    this.executedSteps = [];
  }

  addStep(step) {
    this.steps.push(step);
    return this;
  }

  async execute(initialContext = {}) {
    const context = { ...initialContext };

    for (const step of this.steps) {
      try {
        const stepOutput = await step.action(context);
        this.executedSteps.push(step);
        if (stepOutput && typeof stepOutput === 'object') {
          Object.assign(context, stepOutput);
        }
      } catch (stepError) {
        console.error(`[Saga Step Failed]: ${step.name} -> ${stepError.message}`);
        await this._compensate(context, stepError);
        throw stepError;
      }
    }

    return context;
  }

  async _compensate(context, originalError) {
    console.warn(`[Saga Compensate]: Rolling back ${this.executedSteps.length} executed steps due to: ${originalError.message}`);

    while (this.executedSteps.length > 0) {
      const step = this.executedSteps.pop();
      try {
        if (typeof step.compensate === 'function') {
          await step.compensate(context);
          console.warn(`[Saga Compensated]: Successfully rolled back ${step.name}`);
        }
      } catch (compensationError) {
        // Critical: In production, publish this to a Poison Pill / Dead Letter Queue for operator alerting
        console.error(`[Saga Compensation Error]: CRITICAL - Failed to roll back ${step.name}: ${compensationError.message}`);
      }
    }
  }
}

module.exports = {
  SagaStep,
  SagaOrchestrator,
};
