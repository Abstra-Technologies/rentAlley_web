import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useCallback } from "react";

interface OnboardingOptions {
  tourId: string;
  steps: any[];
  autoStart?: boolean;
  onComplete?: () => void;
}

// Inject custom styles for UpKyp theme
const injectCustomStyles = () => {
  const styleId = "upkyp-driver-styles";

  // Remove existing styles first to ensure fresh styles
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  const styles = document.createElement("style");
  styles.id = styleId;
  styles.textContent = `
    /* ========================================
       DRIVER.JS OVERLAY - Dark background
    ======================================== */
    .driver-overlay {
      background: rgba(0, 0, 0, 0.75) !important;
    }

    /* ========================================
       HIGHLIGHTED ELEMENT - Must be clearly visible
       The key is making it stand out from the dark overlay
    ======================================== */
    .driver-active-element {
      background-color: #ffffff !important;
      border-radius: 12px !important;
      box-shadow: 
        0 0 0 4px #3b82f6,
        0 0 0 8px rgba(59, 130, 246, 0.4),
        0 0 30px rgba(59, 130, 246, 0.3) !important;
      position: relative !important;
      z-index: 100001 !important;
    }

    /* ========================================
       POPOVER STYLING
    ======================================== */
    .driver-popover.driverjs-theme-upkyp {
      background: #ffffff !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 16px !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
      padding: 0 !important;
      max-width: 340px !important;
      overflow: hidden !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-title {
      font-size: 16px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      padding: 16px 16px 8px 16px !important;
      margin: 0 !important;
      background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%) !important;
      border-bottom: 1px solid #e5e7eb !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-description {
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #4b5563 !important;
      padding: 12px 16px !important;
      margin: 0 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-progress-text {
      font-size: 12px !important;
      font-weight: 600 !important;
      color: #9ca3af !important;
      padding: 0 16px 8px 16px !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-footer {
      padding: 12px 16px 16px 16px !important;
      background: #f9fafb !important;
      border-top: 1px solid #f3f4f6 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-footer button {
      border: none !important;
      border-radius: 8px !important;
      padding: 8px 16px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-prev-btn {
      background: #f3f4f6 !important;
      color: #6b7280 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-prev-btn:hover {
      background: #e5e7eb !important;
      color: #374151 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-next-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%) !important;
      color: white !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-next-btn:hover {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-close-btn {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 6px !important;
      color: #9ca3af !important;
      font-size: 14px !important;
      z-index: 10 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-close-btn:hover {
      background: #fef2f2 !important;
      border-color: #fecaca !important;
      color: #ef4444 !important;
    }

    /* ========================================
       ARROW STYLING
    ======================================== */
    .driver-popover.driverjs-theme-upkyp.driver-popover-arrow-side-left .driver-popover-arrow {
      border-right-color: #ffffff !important;
    }
    
    .driver-popover.driverjs-theme-upkyp.driver-popover-arrow-side-right .driver-popover-arrow {
      border-left-color: #ffffff !important;
    }
    
    .driver-popover.driverjs-theme-upkyp.driver-popover-arrow-side-top .driver-popover-arrow {
      border-bottom-color: #eff6ff !important;
    }
    
    .driver-popover.driverjs-theme-upkyp.driver-popover-arrow-side-bottom .driver-popover-arrow {
      border-top-color: #ffffff !important;
    }
  `;
  document.head.appendChild(styles);
};

export const useOnboarding = ({
  tourId,
  steps,
  autoStart = false,
  onComplete,
}: OnboardingOptions) => {
  // Inject styles on mount
  useEffect(() => {
    injectCustomStyles();
  }, []);

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: steps,
      onDestroyed: () => {
        localStorage.setItem(`onboarding_${tourId}`, "true");
        if (onComplete) onComplete();
      },
      popoverClass: "driverjs-theme-upkyp",
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done",
      allowClose: true,
      // Key settings for clear highlighting
      stagePadding: 15,
      stageRadius: 12,
      animate: true,
      smoothScroll: true,
      allowKeyboardControl: true,
    });

    driverObj.drive();
  }, [steps, tourId, onComplete]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`onboarding_${tourId}`);

    if (!hasSeenTour && autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, tourId, startTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`onboarding_${tourId}`);
  }, [tourId]);

  return { startTour, resetTour };
};
