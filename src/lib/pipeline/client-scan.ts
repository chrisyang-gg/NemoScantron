export type AttachedJson = {
  name: string;
  text: string;
  mime?: string;
};

let locked = false;

export function submissionsLocked(): boolean {
  return locked;
}

export function unlockSubmissions(): void {
  locked = false;
}

export function lockSubmissions(): void {
  locked = true;
}
