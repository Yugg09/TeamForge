import { useContext } from "react";
import { IdentityContext } from "@/context/identity-context";

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return context;
}
