import * as React from "react";
import { MessageSquareCode } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui";
import { InterviewQuestion } from "../../types/api";

interface InterviewPrepProps {
  questions: InterviewQuestion[];
}

export const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <Card className="bg-paper-2 border border-rule/80 overflow-hidden shadow-lg shadow-black/10">
      <CardHeader className="p-6 sm:p-8 pb-5 border-b border-rule/80">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl sm:text-3xl text-ink font-display font-medium">Interview preparation</CardTitle>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
              Realistic technical and project questions grounded in your actual verified experience.
            </p>
          </div>
          <MessageSquareCode className="h-6 w-6 text-violet shrink-0" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <Accordion type="single" defaultValue="q-0" className="space-y-3">
          {questions.map((q, idx) => (
            <AccordionItem key={idx} value={`q-${idx}`} className="border border-rule/70 rounded-xl bg-paper-3/40 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4 px-4 sm:px-6 press-scale">
                <div className="flex items-center gap-3.5 pr-3 text-left">
                  <Badge variant="neutral" size="sm" className="px-2.5 py-1 text-xs font-semibold shrink-0">
                    {q.category}
                  </Badge>
                  <span className="font-semibold text-ink text-sm sm:text-base">{q.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 sm:px-6 pt-2 pb-6 border-t border-rule/50">
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <span className="text-xs font-medium text-ink-2">
                    Why interviewers ask this:
                  </span>
                  <p className="text-ink-2 leading-relaxed font-normal">{q.why_asked}</p>
                </div>

                {q.good_answer_covers && q.good_answer_covers.length > 0 && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <span className="text-xs font-medium text-violet">
                      Key competencies a strong answer demonstrates:
                    </span>
                    <ul className="list-disc list-inside space-y-1.5 text-ink">
                      {q.good_answer_covers.map((point, pIdx) => (
                        <li key={pIdx} className="leading-relaxed">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {q.grounded_in && (
                  <div className="rounded-xl bg-paper-2 p-3.5 text-xs sm:text-sm text-muted border border-rule/70">
                    <span className="text-ink font-semibold">Grounded in:</span> {q.grounded_in}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
