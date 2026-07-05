import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (String(data.get("password")).length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    localStorage.setItem("vehisense:auth", "true");
    navigate("/");
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex items-center px-6 py-10 md:px-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Edge AI fleet maintenance intelligence
          </div>
          <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">VehiSense IQ</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            A decision cockpit for predicting failures, explaining model drivers, prioritizing service work, and protecting route revenue across high-utilization fleets.
          </p>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {["XGBoost inference", "SHAP explainability", "Edge telemetry"].map((label) => (
              <div key={label} className="rounded-lg border bg-card p-4 text-sm font-medium shadow-panel">{label}</div>
            ))}
          </div>
        </motion.div>
      </section>
      <section className="flex items-center justify-center border-l bg-card px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Secure access</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to the fleet command center.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Input name="email" type="email" defaultValue="fleet.manager@tatatech.com" aria-label="Email" />
              <Input name="password" type="password" defaultValue="vehisense" aria-label="Password" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full"><LockKeyhole className="h-4 w-4" /> Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
