import { type Question, type AnalysisJson } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export default function QuestionCard({
  question,
  onClick,
  selectable = false,
  selected = false,
  onSelectChange,
}: QuestionCardProps) {
  let analysis: AnalysisJson | null = null;
  try {
    analysis = JSON.parse(question.analysisJson);
  } catch {
    analysis = null;
  }

  const date = new Date(question.createdAt);
  const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  return (
    <Card
      className="p-3 cursor-pointer transition-all duration-200 active:scale-[0.98] border-card-border"
      onClick={() => {
        if (selectable && onSelectChange) {
          onSelectChange(!selected);
        } else if (onClick) {
          onClick();
        }
      }}
      data-testid={`card-question-${question.id}`}
    >
      <div className="flex gap-3">
        {selectable && (
          <div className="flex items-start pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectChange?.(!!checked)}
              data-testid={`checkbox-question-${question.id}`}
            />
          </div>
        )}

        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={question.imageBase64}
            alt="题目图片"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 leading-snug">
            {analysis?.question_text || "解析中..."}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {analysis?.knowledge_points?.slice(0, 3).map((kp, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {kp}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">{formattedDate}</span>
            </div>
            {question.status === "mastered" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-0.5" variant="outline" data-testid={`badge-mastered-${question.id}`}>
                <CheckCircle2 className="w-2.5 h-2.5" />
                已掌握
              </Badge>
            )}
            {question.status === "review" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 gap-0.5" variant="outline" data-testid={`badge-review-${question.id}`}>
                <AlertCircle className="w-2.5 h-2.5" />
                需复习
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
