import mitt from "mitt";

/**
 * class for managing the commands sent from the admin dashboard to the rocket
 */
class Commands {
  public events = mitt<{
    commandsAdded: { flightId: string; command: string }[];
    commandsReceived: { flightId: string; command: string }[];
  }>();

  private commands: Record<
    string,
    // completed is currently unused, because the rocket doesn't give feedback on which commands were completed
    { command: string; sent: boolean; completed: boolean }[]
  > = {};
  constructor() {}

  public processFromQueue(flightId: string) {
    this.commands[flightId] = this.commands[flightId]?.map((i) => ({
      ...i,
      sent: true,
    }));

    const receivedCommands = this.commands[flightId]?.filter((i) => !i.sent);

    if (receivedCommands?.length) {
      this.events.emit(
        "commandsReceived",
        receivedCommands.map((i) => ({ flightId, command: i.command }))
      );
    }
    return receivedCommands?.map((i) => ({ command: i.command })) ?? [];
  }

  public removeFromQueue(flightId: string, command: string) {
    this.commands[flightId] = this.commands[flightId]?.filter(
      (i) => i.command !== command
    );
  }

  public addToQueue(flightId: string, command: string) {
    if (!this.commands[flightId]) {
      this.commands[flightId] = [];
    }
    this.commands[flightId].push({
      command,
      sent: false,
      completed: false,
    });
    this.events.emit("commandsAdded", [{ flightId, command }]);
  }
}
export const commands = new Commands();
