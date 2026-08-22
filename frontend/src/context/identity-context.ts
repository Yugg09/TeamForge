import { createContext } from "react";

export type IdentityOption = {
  id: string;
  label: string;
};

export type IdentityContextValue = {
  activeIdentity: IdentityOption;
  options: IdentityOption[];
  setActiveIdentityId: (id: string) => void;
};

export const IdentityContext = createContext<IdentityContextValue | null>(null);

export const IDENTITY_OPTIONS: IdentityOption[] = [
  { id: "organizer", label: "Organizer (demo)" },
  { id: "p_04", label: "Alex — Backend" },
  { id: "p_11", label: "Riya — Frontend" },
  { id: "p_23", label: "Sam — AI/ML" },
];
