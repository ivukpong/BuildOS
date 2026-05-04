import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { fetchLeaveTypes } from "../api/leave-types";
import { fetchClaimTypes } from "../api/claim-types";

// ─── Leave Types ──────────────────────────────────────────────────────────────

export type LeaveGender = "all" | "male" | "female";

export interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
  carryOver: boolean;
  maxCarryOver: number;
  paid: boolean;
  approvalsRequired: 1 | 2;
  color: string;
  gender: LeaveGender;
}

// ─── Claim Types ──────────────────────────────────────────────────────────────

export interface ClaimType {
  id: string;
  name: string;
  description: string;
  isProjectBased: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface HRConfigContextValue {
  leaveTypes: LeaveType[];
  setLeaveTypes: React.Dispatch<React.SetStateAction<LeaveType[]>>;
  claimTypes: ClaimType[];
  setClaimTypes: React.Dispatch<React.SetStateAction<ClaimType[]>>;
}

const HRConfigContext = createContext<HRConfigContextValue | null>(null);

export function HRConfigProvider({ children }: { children: ReactNode }) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>([]);

  useEffect(() => {
    fetchLeaveTypes().then(setLeaveTypes).catch(console.error);
    fetchClaimTypes().then(setClaimTypes).catch(console.error);
  }, []);

  return (
    <HRConfigContext.Provider
      value={{ leaveTypes, setLeaveTypes, claimTypes, setClaimTypes }}
    >
      {children}
    </HRConfigContext.Provider>
  );
}

export function useHRConfig() {
  const ctx = useContext(HRConfigContext);
  if (!ctx) throw new Error("useHRConfig must be used within HRConfigProvider");
  return ctx;
}
