// @nearfile

import { context, PersistentVector } from "near-runtime-ts";

import { PostedMessage } from "./model";

// --- contract code goes below

// The maximum number of latest messages the contract returns.
const MESSAGE_LIMIT = 10;

// Adds a new message under the name of the sender's account id.
// NOTE: This is a change method. Which means it will modify the state.
// But right now we don't distinguish them with annotations yet.
export function addMessage(text: string): void {
}

// Returns an array of last N messages.
// NOTE: This is a view method. Which means it should NOT modify the state.
export function getMessages(): void {
}
