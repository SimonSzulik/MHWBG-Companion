import { useEffect, useState } from "react";
import { onSyncStatus, type SyncStatus } from "./engine";

/** Subscribe a component to the sync engine's status. */
export function useSyncStatus(): { status: SyncStatus; detail?: string } {
  const [state, setState] = useState<{ status: SyncStatus; detail?: string }>({
    status: "off",
  });
  useEffect(() => onSyncStatus((status, detail) => setState({ status, detail })), []);
  return state;
}
