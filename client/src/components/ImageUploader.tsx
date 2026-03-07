import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isUploading?: boolean;
}

export default function ImageUploader({
  onImageSelected,
  isUploading = false,
}: ImageUploaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onImageSelected(base64);
      setShowDialog(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={isUploading}
        className="w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 text-primary rounded-2xl flex flex-col gap-2"
        variant="ghost"
        data-testid="button-upload-trigger"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">AI 正在解析中...</span>
          </>
        ) : (
          <>
            <ImagePlus className="w-8 h-8" />
            <span className="text-sm font-medium">上传题目图片</span>
            <span className="text-xs text-muted-foreground">
              拍照或从相册选择
            </span>
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">选择上传方式</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="h-14 text-base rounded-xl gap-3 justify-start px-6"
              onClick={() => cameraRef.current?.click()}
              data-testid="button-camera"
            >
              <Camera className="w-5 h-5 text-primary" />
              拍照上传
            </Button>
            <Button
              variant="outline"
              className="h-14 text-base rounded-xl gap-3 justify-start px-6"
              onClick={() => galleryRef.current?.click()}
              data-testid="button-gallery"
            >
              <ImagePlus className="w-5 h-5 text-primary" />
              从相册选择
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
