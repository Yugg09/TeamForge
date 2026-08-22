import { useMemo, useState, type ReactNode } from "react";
import {
  IDENTITY_OPTIONS,
  IdentityContext,
  type IdentityContextValue,
} from "@/context/identity-context";

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [activeIdentityId, setActiveIdentityId] = useState(
    IDENTITY_OPTIONS[0].id,
  );

  const value = useMemo<IdentityContextValue>(() => {
    const activeIdentity =
      IDENTITY_OPTIONS.find((option) => option.id === activeIdentityId) ??
      IDENTITY_OPTIONS[0];

    return {
      activeIdentity,
      options: IDENTITY_OPTIONS,
      setActiveIdentityId,
    };
  }, [activeIdentityId]);

  return (
    <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
  );
}
