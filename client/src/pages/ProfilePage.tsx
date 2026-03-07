import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { questionService, directoryService } from "@/lib/services";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  FolderOpen,
  Database,
  Trash2,
  Info,
  Smartphone,
  Brain,
} from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalDirs, setTotalDirs] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [count, dirs] = await Promise.all([
        questionService.getCount(),
        directoryService.getAll(),
      ]);
      setTotalQuestions(count);
      setTotalDirs(dirs.length);
    };
    load();
  }, []);

  const handleClearAll = async () => {
    await db.questions.clear();
    await db.directories.clear();
    setTotalQuestions(0);
    setTotalDirs(0);
    setShowClearDialog(false);
    toast({ title: "已清除所有数据" });
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">我的</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理你的错题数据
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 -mt-2">
        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            数据统计
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold" data-testid="text-profile-questions">{totalQuestions}</p>
                <p className="text-[10px] text-muted-foreground">错题总数</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <FolderOpen className="w-5 h-5 text-chart-3" />
              <div>
                <p className="text-lg font-bold" data-testid="text-profile-dirs">{totalDirs}</p>
                <p className="text-[10px] text-muted-foreground">目录数量</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-chart-4" />
            关于应用
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">应用名称</span>
              <span className="text-sm font-medium">智能错题本</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">版本</span>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">数据存储</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                本地存储
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">AI 引擎</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Gemini
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-destructive" />
            数据管理
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            清除所有本地数据，包括所有目录和错题记录。此操作不可撤销。
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            data-testid="button-clear-all"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            清除所有数据
          </Button>
        </Card>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认清除所有数据</AlertDialogTitle>
            <AlertDialogDescription>
              这将删除所有目录和错题记录，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground"
            >
              确认清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
