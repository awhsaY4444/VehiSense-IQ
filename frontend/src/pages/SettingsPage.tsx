import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileForm = {
  name: string;
  email: string;
  organization: string;
};

const defaultProfile: ProfileForm = {
  name: "Fleet Manager",
  email: "fleet.manager@tatatech.com",
  organization: "Tata Technologies Demo Fleet",
};

const fleetConfig = [
  { label: "Fleet Size", value: "30", helper: "Number of vehicles managed by this deployment." },
  { label: "Maintenance Planning Horizon (Days)", value: "18", helper: "Forward window used for maintenance planning and report summaries." },
  { label: "Currency", value: "INR", helper: "Default currency used for repair cost and business impact calculations." },
];

const modelConfig = [
  { label: "Failure Prediction Model", value: "xgboost_failure_v4.2", helper: "XGBoost classifier used to estimate failure probability." },
  { label: "Prediction Threshold", value: "0.62", helper: "Minimum probability required before a vehicle is classified as high risk." },
  { label: "Explainability Engine", value: "shap_tree_explainer", helper: "Method used to generate AI explanations." },
];

export function SettingsPage() {
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(defaultProfile);
  const [profile, setProfile] = useState<ProfileForm>(defaultProfile);

  const errors = useMemo(() => validateProfile(profile), [profile]);
  const changed = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const canSave = changed && Object.keys(errors).length === 0;

  function updateField(field: keyof ProfileForm, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function saveChanges() {
    if (!canSave) return;
    setSavedProfile(profile);
  }

  function resetDefaults() {
    setProfile(defaultProfile);
    setSavedProfile(defaultProfile);
  }

  function cancelChanges() {
    setProfile(savedProfile);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage user profile, fleet configuration, and model governance thresholds.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="h-full">
          <CardHeader><CardTitle>User Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <EditableField label="Fleet Manager Name" value={profile.name} helper="Name shown on reports and administrative views." error={errors.name} onChange={(value) => updateField("name", value)} />
            <EditableField label="Email Address" value={profile.email} helper="Used for account identification and report ownership." error={errors.email} onChange={(value) => updateField("email", value)} />
            <EditableField label="Organization" value={profile.organization} helper="Fleet organization displayed across the deployment." error={errors.organization} onChange={(value) => updateField("organization", value)} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={saveChanges} disabled={!canSave}>Save Changes</Button>
              <Button size="sm" variant="outline" onClick={resetDefaults}>Reset Defaults</Button>
              <Button size="sm" variant="ghost" onClick={cancelChanges} disabled={!changed}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader><CardTitle>Fleet Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ManagedNotice />
            {fleetConfig.map((field) => <ReadOnlyField key={field.label} {...field} />)}
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader><CardTitle>Model Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ManagedNotice />
            {modelConfig.map((field) => <ReadOnlyField key={field.label} {...field} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditableField({ label, value, helper, error, onChange }: { label: string; value: string; helper: string; error?: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
      <p className="text-xs text-muted-foreground">{helper}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value, helper }: { label: string; value: string; helper: string }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input id={id} value={value} readOnly aria-readonly="true" className="bg-secondary/40" />
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function ManagedNotice() {
  return <div className="flex items-center gap-2 rounded-md border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Managed by Administrator.</div>;
}

function validateProfile(profile: ProfileForm) {
  const errors: Partial<Record<keyof ProfileForm, string>> = {};
  if (!profile.name.trim()) errors.name = "Fleet manager name is required.";
  if (!profile.organization.trim()) errors.organization = "Organization is required.";
  if (!profile.email.trim()) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = "Enter a valid email address.";
  return errors;
}
