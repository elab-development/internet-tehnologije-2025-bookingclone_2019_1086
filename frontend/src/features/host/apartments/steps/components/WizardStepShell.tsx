import type { ReactNode } from "react";

type WizardStepShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function WizardStepShell({
  title,
  subtitle,
  children,
}: WizardStepShellProps) {
  return (
    <div className="card shadow-sm apartment-wizard-step">
      <div className="card-body apartment-wizard-step__body">
        <h5 className="apartment-wizard-step__title">{title}</h5>

        <div className="apartment-wizard-step__subtitle">{subtitle}</div>

        {children}
      </div>
    </div>
  );
}