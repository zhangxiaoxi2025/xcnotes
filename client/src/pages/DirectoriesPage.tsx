import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { directoryService } from "@/lib/services";
import { type Directory } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";

export default function DirectoriesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Directory[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [editingDir, setEditingDir] = useState<Directory | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  const loadDirectories = useCallback(async () => {
    const parentKey = currentParentId ?? "";
    let dirs: Directory[];
    if (parentKey === "") {
      dirs = await directoryService.getRootDirectories();
    } else {
      dirs = await directoryService.getChildren(currentParentId);
    }
    setDirectories(dirs);

    const counts: Record<string, number> = {};
    for (const d of dirs) {
      counts[d.id] = await directoryService.getQuestionCount(d.id);
    }
    setQuestionCounts(counts);

    if (currentParentId) {
      const path = await directoryService.getDirectoryPath(currentParentId);
      setBreadcrumb(path);
    } else {
      setBreadcrumb([]);
    }
  }, [currentParentId]);

  useEffect(() => {
    loadDirectories();
  }, [loadDirectories]);

  const handleCreate = async () => {
    if (!newDirName.trim()) return;

    const depth = await directoryService.getDepth(currentParentId);
    if (depth >= 3) {
      toast({
        title: "目录层级已达上限",
        description: "最多支持3级目录",
        variant: "destructive",
      });
      return;
    }

    await directoryService.create(newDirName.trim(), currentParentId);
    setNewDirName("");
    setShowCreateDialog(false);
    toast({ title: "创建成功" });
    await loadDirectories();
  };

  const handleRename = async () => {
    if (!editingDir || !newDirName.trim()) return;
    await directoryService.rename(editingDir.id, newDirName.trim());
    setShowRenameDialog(false);
    setNewDirName("");
    setEditingDir(null);
    toast({ title: "重命名成功" });
    await loadDirectories();
  };

  const handleDelete = async () => {
    if (!editingDir) return;
    await directoryService.delete(editingDir.id);
    setShowDeleteDialog(false);
    setEditingDir(null);
    toast({ title: "删除成功" });
    await loadDirectories();
  };

  const navigateToDir = (dir: Directory) => {
    navigate(`/directory/${dir.id}`);
  };

  const enterSubDir = (dir: Directory) => {
    setCurrentParentId(dir.id);
  };

  const goBack = () => {
    if (breadcrumb.length > 1) {
      setCurrentParentId(breadcrumb[breadcrumb.length - 2].id);
    } else {
      setCurrentParentId(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-4 h-14">
          <div className="flex items-center gap-2">
            {currentParentId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={goBack}
                data-testid="button-go-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold">
              {breadcrumb.length > 0
                ? breadcrumb[breadcrumb.length - 1].name
                : "目录管理"}
            </h1>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setNewDirName("");
              setShowCreateDialog(true);
            }}
            data-testid="button-create-dir"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            新建
          </Button>
        </div>
        {breadcrumb.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-2 flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
            <button
              onClick={() => setCurrentParentId(null)}
              className="text-primary whitespace-nowrap"
              data-testid="breadcrumb-root"
            >
              全部目录
            </button>
            {breadcrumb.map((dir, i) => (
              <span key={dir.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button
                  onClick={() =>
                    i < breadcrumb.length - 1
                      ? setCurrentParentId(dir.id)
                      : undefined
                  }
                  className={`whitespace-nowrap ${i === breadcrumb.length - 1 ? "font-medium text-foreground" : "text-primary"}`}
                >
                  {dir.name}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {directories.length === 0 ? (
          <Card className="p-8 text-center border-card-border">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无目录</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              点击右上角"新建"创建第一个目录
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {directories.map((dir) => (
              <Card
                key={dir.id}
                className="p-3.5 border-card-border active:scale-[0.98] transition-transform duration-150"
                data-testid={`card-directory-${dir.id}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => navigateToDir(dir)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {dir.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {questionCounts[dir.id] ?? 0} 道题目
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8"
                      onClick={() => enterSubDir(dir)}
                      data-testid={`button-expand-${dir.id}`}
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8"
                          data-testid={`button-dir-menu-${dir.id}`}
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingDir(dir);
                            setNewDirName(dir.name);
                            setShowRenameDialog(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setEditingDir(dir);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>新建目录</DialogTitle>
          </DialogHeader>
          <Input
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            placeholder="请输入目录名称"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            data-testid="input-dir-name"
          />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newDirName.trim()} data-testid="button-confirm-create">
              确认创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>重命名目录</DialogTitle>
          </DialogHeader>
          <Input
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            placeholder="请输入新名称"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            data-testid="input-rename-dir"
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={!newDirName.trim()} data-testid="button-confirm-rename">
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除"{editingDir?.name}"将同时删除其下所有子目录和题目，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
