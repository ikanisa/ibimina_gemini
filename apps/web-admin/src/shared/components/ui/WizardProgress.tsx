/**
 * Wizard Progress Indicator Component
 * 
 * Displays progress through multi-step wizards with visual indicators
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

export interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber) || index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 ease-in-out
                    ${
                      isCompleted
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                        : 'bg-slate-200 text-slate-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={18} className="animate-in zoom-in duration-200" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-xs font-medium transition-colors duration-200
                      ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}
                    `}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all duration-500 ease-in-out
                    ${isCompleted ? 'bg-blue-600' : 'bg-slate-200'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

