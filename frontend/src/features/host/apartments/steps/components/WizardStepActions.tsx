type WizardStepActionsProps = {
  children: React.ReactNode;
};

export default function WizardStepActions({ children }: WizardStepActionsProps) {
  return <div className="apartment-wizard-step__actions">{children}</div>;
}