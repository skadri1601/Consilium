"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { WelcomeModal } from "./welcome-modal";

interface OnboardingContextType {
  isFirstVisit: boolean;
  completeOnboarding: () => void;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem("consilium_onboarding_completed");
    const isFirst = !hasCompleted;

    setIsFirstVisit(isFirst);
    setShowWelcome(isFirst);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("consilium_onboarding_completed", "true");
    setIsFirstVisit(false);
    setShowWelcome(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isFirstVisit,
        completeOnboarding,
        showWelcome,
        setShowWelcome,
      }}
    >
      {children}
      <WelcomeModal open={showWelcome} onClose={completeOnboarding} />
    </OnboardingContext.Provider>
  );
}
