import { BaseChain } from './base-chain.js';

/**
 * Chain that routes to different chains based on input
 *
 * Example:
 *   const router = new RouterChain({
 *       destinationChains: {
 *           "technical": technicalChain,
 *           "casual": casualChain
 *       },
 *       defaultChain: defaultChain,
 *       routerChain: classifierChain  // Determines which route
 *   });
 */
export class RouterChain extends BaseChain {
  constructor(options = {}) {
    super();

    if (!options.destinationChains) {
      throw new Error('RouterChain requires destinationChains');
    }

    this.destinationChains = options.destinationChains;
    this.defaultChain = options.defaultChain || null;
    this.routerChain = options.routerChain || null;
    this.routeKey = options.routeKey || 'route';
  }

  get inputKeys() {
    // Collect all input keys from all destination chains
    const keys = new Set();
    for (const chain of Object.values(this.destinationChains)) {
      chain.inputKeys.forEach(key => keys.add(key));
    }
    return Array.from(keys);
  }

  get outputKeys() {
    // All destination chains should have same output keys
    const firstChain = Object.values(this.destinationChains)[0];
    return firstChain ? firstChain.outputKeys : ['output'];
  }

  /**
   * Determine route and execute appropriate chain
   */
  async _call(inputs, config) {
    let route;

    if (this.routerChain) {
      // Use router chain to determine route
      const routeResult = await this.routerChain.invoke(inputs, config);
      route = typeof routeResult === 'string'
          ? routeResult
          : routeResult[this.routeKey];
    } else {
      // Look for route in inputs
      route = inputs[this.routeKey];
    }

    // Get the appropriate chain
    const destinationChain = this.destinationChains[route];

    if (!destinationChain) {
      if (this.defaultChain) {
        return await this.defaultChain.invoke(inputs, config);
      } else {
        throw new Error(
            `No chain found for route "${route}" and no default chain provided`
        );
      }
    }

    // Execute the destination chain
    return await destinationChain.invoke(inputs, config);
  }

  get _chainType() {
    return 'router_chain';
  }
}