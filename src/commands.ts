import mitt from "mitt";

/**
 * class for managing the commands sent from the admin dashboard to the rocket
 */
class Commands {
  public events = mitt<{
    commandsAdded: { flightId: string; command: string; args?: unknown }[];
    commandsReceived: { flightId: string; command: string; args?: unknown }[];
  }>();

  private commands: Record<
    string,
    // completed is currently unused, because the rocket doesn't give feedback on which commands were completed
    { command: string; args?: unknown; sent: boolean; completed: boolean }[]
  > = {};
  constructor() {}

  public processFromQueue(flightId: string) {
    const receivedCommands = this.commands[flightId]?.filter((i) => !i.sent);

    this.commands[flightId] = this.commands[flightId]?.map((i) => ({
      ...i,
      sent: true,
    }));

    if (receivedCommands?.length) {
      this.events.emit(
        "commandsReceived",
        receivedCommands.map((i) => ({
          flightId,
          command: i.command,
          args: i.args,
        }))
      );
    }
    return (
      receivedCommands?.map((i) => ({ command: i.command, args: i.args })) ?? []
    );
  }

  public removeFromQueue(flightId: string, command: string) {
    this.commands[flightId] = this.commands[flightId]?.filter(
      (i) => i.command !== command
    );
  }

  public addToQueue(flightId: string, command: string, args?: unknown) {
    if (!this.commands[flightId]) {
      this.commands[flightId] = [];
    }
    this.commands[flightId].push({
      command,
      args,
      sent: false,
      completed: false,
    });
    this.events.emit("commandsAdded", [{ flightId, command, args }]);
  }
}
export const commands = new Commands();
