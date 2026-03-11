import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import QuestionCard from "@/components/QuestionCard";
import { questionService } from "@/lib/services";
import { type Question } from "@/lib/db";
import { BookMarked, AlertCircle, CheckCircle2 } from "lucide-react";

type FilterTab = "review" | "mastered";

export default function ReviewPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<FilterTab>("review");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  const loadData = async () => {
    const [items, rc, mc] = await Promise.all([
      questionService.getByStatus(activeTab),
      questionService.getStatusCount("review"),
      questionService.getStatusCount("mastered"),
    ]);
    setQuestions(items);
    setReviewCount(rc);
    setMasteredCount(mc);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-review-title">
            <BookMarked className="w-6 h-6 text-primary" />
            复习本
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理标记的题目，高效复习
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-all touch-manipulation ${
              activeTab === "review"
                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                : "bg-muted/50 text-muted-foreground border border-transparent"
            }`}
            data-testid="tab-review"
          >
            <AlertCircle className="w-4 h-4" />
            需复习
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              activeTab === "review"
                ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                : "bg-muted text-muted-foreground"
            }`} data-testid="count-review">
              {reviewCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mastered")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-all touch-manipulation ${
              activeTab === "mastered"
                ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30"
                : "bg-muted/50 text-muted-foreground border border-transparent"
            }`}
            data-testid="tab-mastered"
          >
            <CheckCircle2 className="w-4 h-4" />
            已掌握
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              activeTab === "mastered"
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`} data-testid="count-mastered">
              {masteredCount}
            </span>
          </button>
        </div>

        {questions.length === 0 ? (
          <Card className="p-8 text-center border-card-border">
            {activeTab === "review" ? (
              <>
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-empty-review">
                  暂无需要复习的题目
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  在题目详情页标记"需复习"即可添加到这里
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-empty-mastered">
                  暂无已掌握的题目
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  在题目详情页标记"已掌握"即可添加到这里
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onClick={() => navigate(`/question/${q.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
