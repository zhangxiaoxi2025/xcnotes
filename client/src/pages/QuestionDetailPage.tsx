import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { questionService, directoryService } from "@/lib/services";
import { type Question, type Directory, type AnalysisJson, type QuestionStatus } from "@/lib/db";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookOpen,
  ImageIcon,
  BookmarkPlus,
  AlertCircle,
  BookmarkX,
  MessageCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ChatPanel from "@/components/ChatPanel";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [question, setQuestion] = useState<Question | null>(null);
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      const q = await questionService.getById(params.id);
      if (q) {
        setQuestion(q);
        const dir = await directoryService.getById(q.directoryId);
        setDirectory(dir || null);
      }
    };
    load();
  }, [params.id]);

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  let analysis: AnalysisJson | null = null;
  try {
    analysis = JSON.parse(question.analysisJson);
  } catch {
    analysis = null;
  }

  const handleSetStatus = async (status: QuestionStatus) => {
    await questionService.setStatus(question.id, status);
    setQuestion({ ...question, status });
    const labels: Record<QuestionStatus, string> = {
      mastered: "已标记为「已掌握」",
      review: "已标记为「需复习」",
      none: "已取消标记",
    };
    toast({ title: labels[status] });
  };

  const currentStatus = question.status || "none";

  const handleDelete = async () => {
    await questionService.delete(question.id);
    toast({ title: "删除成功" });
    if (directory) {
      navigate(`/directory/${directory.id}`);
    } else {
      navigate("/");
    }
  };

  const date = new Date(question.createdAt);
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-4 h-14">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (directory) {
                  navigate(`/directory/${directory.id}`);
                } else {
                  navigate("/");
                }
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">题目详情</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowChat(true)}
              data-testid="button-open-chat"
              className="text-primary"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-mark-status"
                  className={
                    currentStatus === "mastered"
                      ? "text-green-600 dark:text-green-400"
                      : currentStatus === "review"
                      ? "text-orange-600 dark:text-orange-400"
                      : ""
                  }
                >
                  {currentStatus === "mastered" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : currentStatus === "review" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <BookmarkPlus className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleSetStatus("mastered")}
                  className="gap-2"
                  data-testid="menu-mark-mastered"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  已掌握
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSetStatus("review")}
                  className="gap-2"
                  data-testid="menu-mark-review"
                >
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  需复习
                </DropdownMenuItem>
                {currentStatus !== "none" && (
                  <DropdownMenuItem
                    onClick={() => handleSetStatus("none")}
                    className="gap-2"
                    data-testid="menu-mark-none"
                  >
                    <BookmarkX className="w-4 h-4 text-muted-foreground" />
                    取消标记
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-question"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <Card
          className="overflow-hidden border-card-border cursor-pointer"
          onClick={() => setShowImageDialog(true)}
        >
          <div className="relative">
            <img
              src={question.imageBase64}
              alt="题目图片"
              className="w-full max-h-64 object-contain bg-muted/50"
              data-testid="img-question"
            />
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <ImageIcon className="w-3 h-3" />
                点击查看大图
              </Badge>
            </div>
          </div>
        </Card>

        {analysis && (
          <>
            <Card className="p-4 border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">题目内容</h3>
              </div>
              <p className="text-sm leading-relaxed" data-testid="text-question-content">
                {analysis.question_text}
              </p>
            </Card>

            <Card className="p-4 border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-chart-4" />
                <h3 className="font-semibold text-sm">知识点</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.knowledge_points.map((kp, i) => (
                  <Badge key={i} variant="secondary">
                    {kp}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-chart-2" />
                <h3 className="font-semibold text-sm">趣味讲解</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground" data-testid="text-explanation">
                {analysis.humorous_explanation}
              </p>
            </Card>

            {analysis.options_analysis && analysis.options_analysis.length > 0 && (
              <Card className="p-4 border-card-border">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-chart-3" />
                  <h3 className="font-semibold text-sm">选项分析</h3>
                </div>
                <div className="space-y-3">
                  {analysis.options_analysis.map((opt, i) => (
                    <div key={i}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            opt.is_correct
                              ? "bg-chart-3/10 text-chart-3"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {opt.is_correct ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            选项 {opt.option}
                            {opt.is_correct && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">
                                正确答案
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {opt.related_knowledge}
                          </p>
                          <p className="text-xs mt-1">{opt.why_wrong}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2">
          <span>目录: {directory?.name || "未知"}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {showImageDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImageDialog(false)}
        >
          <img
            src={question.imageBase64}
            alt="题目大图"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这道题目吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChatPanel
        questionId={question.id}
        questionImageBase64={question.imageBase64}
        questionAnalysis={question.analysisJson}
        open={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
}
