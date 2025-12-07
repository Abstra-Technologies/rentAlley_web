import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";

interface OnboardingOptions {
  tourId: string;
  steps: any[];
  autoStart?: boolean;
  onComplete?: () => void;
}

export const useOnboarding = ({
  tourId,
  steps,
  autoStart = false,
  onComplete,
}: OnboardingOptions) => {
  useEffect(() => {
    // Check if user has already seen this tour
    const hasSeenTour = localStorage.getItem(`onboarding_${tourId}`);

    if (!hasSeenTour && autoStart) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTour();
      }, 500);
    }
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: steps,
      onDestroyed: () => {
        // Mark tour as completed
        localStorage.setItem(`onboarding_${tourId}`, "true");
        if (onComplete) onComplete();
      },
      popoverClass: "driverjs-theme-upkyp",
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding_${tourId}`);
  };

  return { startTour, resetTour };
};
