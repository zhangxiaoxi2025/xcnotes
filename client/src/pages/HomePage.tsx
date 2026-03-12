import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ImageUploader from "@/components/ImageUploader";
import QuestionCard from "@/components/QuestionCard";
import { questionService, directoryService } from "@/lib/services";
import { analyzeQuestionImage } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { type Question, type Directory } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  FolderOpen,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Search,
  X,
  Images,
} from "lucide-react";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalDirs, setTotalDirs] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDirSelect, setShowDirSelect] = useState(false);
  const [selectedDirId, setSelectedDirId] = useState<string>("");
  const [pendingImage, setPendingImage] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const [pendingBatchImages, setPendingBatchImages] = useState<string[]>([]);
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [batchDirId, setBatchDirId] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const loadData = async () => {
    const [recent, dirs, count] = await Promise.all([
      questionService.getRecentQuestions(5),
      directoryService.getAll(),
      questionService.getCount(),
    ]);
    setRecentQuestions(recent);
    setDirectories(dirs);
    setTotalQuestions(count);
    setTotalDirs(dirs.length);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      searchIdRef.current++;
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const currentId = ++searchIdRef.current;
    searchTimerRef.current = setTimeout(async () => {
      const results = await questionService.search(value);
      if (searchIdRef.current === currentId) {
        setSearchResults(results);
        setIsSearching(false);
      }
    }, 300);
  };

  const clearSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchIdRef.current++;
    setSearchKeyword("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const inSearchMode = searchKeyword.trim().length > 0;

  const checkDirectories = (): boolean => {
    if (directories.length === 0) {
      toast({
        title: "请先创建目录",
        description: "请前往目录页面创建一个目录后再上传题目",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleImageSelected = async (base64: string) => {
    if (!checkDirectories()) return;
    setPendingImage(base64);
    setSelectedDirId(directories[0].id);
    setShowDirSelect(true);
  };

  const handleImagesSelected = (base64List: string[]) => {
    if (!checkDirectories()) return;
    if (base64List.length === 1) {
      handleImageSelected(base64List[0]);
      return;
    }
    setPendingBatchImages(base64List);
    setBatchDirId(directories[0].id);
    setShowBatchPreview(true);
  };

  const removeBatchImage = (index: number) => {
    setPendingBatchImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmUpload = async () => {
    if (!selectedDirId || !pendingImage) return;
    setShowDirSelect(false);
    setIsUploading(true);
    try {
      const analysisJson = await analyzeQuestionImage(pendingImage);
      await questionService.create(selectedDirId, pendingImage, analysisJson);
      toast({ title: "解析成功", description: "题目已保存到指定目录" });
      await loadData();
    } catch (e: any) {
      toast({
        title: "解析失败",
        description: e.message || "请检查网络后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setPendingImage("");
    }
  };

  const handleBatchUpload = async () => {
    if (!batchDirId || pendingBatchImages.length === 0) return;
    const images = [...pendingBatchImages];
    setShowBatchPreview(false);
    setPendingBatchImages([]);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: images.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      setUploadProgress({ current: i + 1, total: images.length });
      try {
        const analysisJson = await analyzeQuestionImage(images[i]);
        await questionService.create(batchDirId, images[i], analysisJson);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    await loadData();

    if (failCount === 0) {
      toast({
        title: "全部解析完成",
        description: `成功解析并保存 ${successCount} 道题目`,
      });
    } else {
      toast({
        title: "批量解析完成",
        description: `成功 ${successCount} 张，失败 ${failCount} 张`,
        variant: failCount === images.length ? "destructive" : "default",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-app-title">
            智能错题本
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            拍照上传，AI智能解析，轻松管理错题
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索题目、知识点..."
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            data-testid="input-search"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-manipulation"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {inSearchMode ? (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3" data-testid="text-search-status">
              {isSearching
                ? "搜索中..."
                : `找到 ${searchResults.length} 个结果`}
            </h2>
            {!isSearching && searchResults.length === 0 ? (
              <Card className="p-8 text-center border-card-border">
                <Search className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-results">
                  没有找到相关题目
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  试试其他关键词
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {searchResults.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onClick={() => navigate(`/question/${q.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center border-card-border">
            <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-primary/10 mb-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold" data-testid="text-total-questions">{totalQuestions}</p>
            <p className="text-[10px] text-muted-foreground">错题总数</p>
          </Card>
          <Card className="p-3 text-center border-card-border">
            <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-chart-3/10 mb-1.5">
              <FolderOpen className="w-4 h-4 text-chart-3" />
            </div>
            <p className="text-xl font-bold" data-testid="text-total-dirs">{totalDirs}</p>
            <p className="text-[10px] text-muted-foreground">目录数量</p>
          </Card>
          <Card className="p-3 text-center border-card-border">
            <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-chart-2/10 mb-1.5">
              <TrendingUp className="w-4 h-4 text-chart-2" />
            </div>
            <p className="text-xl font-bold" data-testid="text-weekly-count">
              {recentQuestions.filter(
                (q) => Date.now() - q.createdAt < 7 * 24 * 60 * 60 * 1000
              ).length}
            </p>
            <p className="text-[10px] text-muted-foreground">本周新增</p>
          </Card>
        </div>

        <div className="mb-6">
          <ImageUploader
            onImageSelected={handleImageSelected}
            onImagesSelected={handleImagesSelected}
            onError={(msg) => toast({ title: msg, variant: "destructive" })}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              最近错题
            </h2>
            {recentQuestions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/directories")}
                className="text-xs text-muted-foreground gap-1"
                data-testid="button-view-all"
              >
                查看全部
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>

          {recentQuestions.length === 0 ? (
            <Card className="p-8 text-center border-card-border">
              <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                还没有错题记录
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                点击上方按钮上传第一道错题吧
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {recentQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onClick={() => navigate(`/question/${q.id}`)}
                />
              ))}
            </div>
          )}
        </div>
        </>
        )}

        <Dialog open={showDirSelect} onOpenChange={setShowDirSelect}>
          <DialogContent className="max-w-[320px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>选择保存目录</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <Select value={selectedDirId} onValueChange={setSelectedDirId}>
                <SelectTrigger data-testid="select-directory">
                  <SelectValue placeholder="选择目录" />
                </SelectTrigger>
                <SelectContent>
                  {directories.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleConfirmUpload}
                disabled={!selectedDirId}
                data-testid="button-confirm-upload"
              >
                确认上传并解析
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBatchPreview} onOpenChange={(open) => {
          if (!open) {
            setShowBatchPreview(false);
            setPendingBatchImages([]);
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] rounded-2xl p-4">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                批量上传预览
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground text-center" data-testid="text-batch-count">
                已选择 {pendingBatchImages.length} 张图片（最多 10 张）
              </p>

              <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-auto" data-testid="batch-preview-grid">
                {pendingBatchImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-muted/30 border border-border">
                    <img
                      src={img}
                      alt={`图片 ${idx + 1}`}
                      className="w-full h-full object-cover"
                      data-testid={`batch-image-${idx}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeBatchImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ opacity: 1 }}
                      data-testid={`button-remove-batch-${idx}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>

              <Select value={batchDirId} onValueChange={setBatchDirId}>
                <SelectTrigger data-testid="select-batch-directory">
                  <SelectValue placeholder="选择保存目录" />
                </SelectTrigger>
                <SelectContent>
                  {directories.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowBatchPreview(false);
                    setPendingBatchImages([]);
                  }}
                  data-testid="button-cancel-batch"
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBatchUpload}
                  disabled={!batchDirId || pendingBatchImages.length === 0}
                  data-testid="button-start-batch"
                >
                  开始解析 ({pendingBatchImages.length} 张)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
