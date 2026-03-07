import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ImageUploader from "@/components/ImageUploader";
import QuestionCard from "@/components/QuestionCard";
import { directoryService, questionService } from "@/lib/services";
import { analyzeQuestionImage } from "@/lib/gemini";
import { type Question, type Directory } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckSquare,
  XSquare,
  Network,
  Trash2,
  BookOpen,
} from "lucide-react";
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

export default function DirectoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Directory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadData = useCallback(async () => {
    if (!params.id) return;
    const dir = await directoryService.getById(params.id);
    if (dir) {
      setDirectory(dir);
      const path = await directoryService.getDirectoryPath(params.id);
      setBreadcrumb(path);
    }
    const qs = await questionService.getByDirectory(params.id);
    setQuestions(qs);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImageSelected = async (base64: string) => {
    if (!params.id) return;
    setIsUploading(true);
    try {
      const analysisJson = await analyzeQuestionImage(base64);
      await questionService.create(params.id, base64, analysisJson);
      toast({ title: "解析成功", description: "题目已保存" });
      await loadData();
    } catch (e: any) {
      toast({
        title: "解析失败",
        description: e.message || "请检查网络后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(questions.map((q) => q.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    await questionService.deleteMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectMode(false);
    setShowDeleteDialog(false);
    toast({ title: "删除成功" });
    await loadData();
  };

  const handleKnowledgeGraph = () => {
    const ids = Array.from(selectedIds);
    if (ids.length < 2) {
      toast({
        title: "请至少选择2道题",
        description: "选择更多题目以生成更完整的知识图谱",
        variant: "destructive",
      });
      return;
    }
    navigate(`/knowledge-graph?ids=${ids.join(",")}`);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/directories")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate">
              {directory?.name || "加载中..."}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {questions.length > 0 && (
              <Button
                size="sm"
                variant={selectMode ? "default" : "outline"}
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
                data-testid="button-toggle-select"
              >
                {selectMode ? (
                  <>
                    <XSquare className="w-4 h-4 mr-1" />
                    取消
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    选择
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {!selectMode && (
          <div className="mb-4">
            <ImageUploader
              onImageSelected={handleImageSelected}
              isUploading={isUploading}
            />
          </div>
        )}

        {selectMode && questions.length > 0 && (
          <div className="flex items-center justify-between gap-2 mb-4 p-3 bg-primary/5 rounded-xl">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedIds.size} / {questions.length} 道
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectedIds.size === questions.length ? deselectAll : selectAll}
                data-testid="button-select-all"
              >
                {selectedIds.size === questions.length ? "取消全选" : "全选"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleKnowledgeGraph}
                disabled={selectedIds.size < 2}
                data-testid="button-knowledge-graph"
              >
                <Network className="w-4 h-4 mr-1" />
                知识图谱
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={selectedIds.size === 0}
                data-testid="button-delete-selected"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {questions.length === 0 && !isUploading ? (
          <Card className="p-8 text-center border-card-border mt-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              该目录下暂无题目
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              上传图片开始添加错题
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                selectable={selectMode}
                selected={selectedIds.has(q.id)}
                onSelectChange={(sel) => toggleSelect(q.id, sel)}
                onClick={() => navigate(`/question/${q.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.size} 道题目吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
