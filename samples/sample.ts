// Exercises TypeScript semantic tokens.
export const MAX_RETRIES = 3; // variable.readonly

export enum Status { // enum.declaration
  Pending = "pending", // enumMember
  Active = "active",
}

export interface Store<T> { // interface, typeParameter
  get(key: string): T | undefined; // method.declaration, parameter
}

export class MemStore<T> implements Store<T> {
  private data = new Map<string, T>(); // property

  constructor(readonly limit: number) {}

  get(key: string): T | undefined {
    if (!this.data.has(key)) {
      console.warn(`missing ${key}`); // variable.defaultLibrary
      return undefined;
    }
    return this.data.get(key);
  }

  /** @deprecated use get() */
  fetch(key: string) { return this.get(key); } // *.deprecated
}
