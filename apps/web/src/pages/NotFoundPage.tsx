import React from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8 sm:p-12 text-center space-y-8 bg-paper-2 border border-rule/80 rounded-2xl shadow-md">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-paper-3 p-5 border border-rule text-accent shadow-sm">
            <FileQuestion className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink">Page not found</h1>
          <p className="text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
            The requested address does not exist or has been moved.
          </p>
        </div>
        <div>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate("/")}
            leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            className="min-h-[48px] px-6 text-sm font-semibold rounded-xl press-scale shadow-sm"
          >
            Return to screener
          </Button>
        </div>
      </Card>
    </div>
  );
};
