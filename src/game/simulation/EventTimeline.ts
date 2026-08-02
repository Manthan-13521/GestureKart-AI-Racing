type EventHandler = (data: unknown) => void;

export class EventTimeline {
  private listeners: Map<string, EventHandler[]> = new Map();

  public subscribe(eventType: string, handler: EventHandler): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  public unsubscribe(eventType: string, handler: EventHandler): void {
    if (!this.listeners.has(eventType)) return;
    const handlers = this.listeners.get(eventType)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  public publish(eventType: string, data: unknown): void {
    if (!this.listeners.has(eventType)) return;
    for (const handler of this.listeners.get(eventType)!) {
      handler(data);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
