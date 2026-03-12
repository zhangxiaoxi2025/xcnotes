import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, ImagePlus, Loader2, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  onImagesSelected?: (base64List: string[]) => void;
  isUploading?: boolean;
  uploadProgress?: { current: number; total: number } | null;
}

function getCroppedImageBase64(
  image: HTMLImageElement,
  crop: PixelCrop
): string {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}

const MAX_BATCH = 10;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  onImageSelected,
  onImagesSelected,
  isUploading = false,
  uploadProgress = null,
}: ImageUploaderProps) {
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [rawImage, setRawImage] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setShowMethodDialog(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setShowMethodDialog(false);

    if (files.length === 1) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImage(reader.result as string);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(files[0]);
      e.target.value = "";
      return;
    }

    const fileList = Array.from(files).slice(0, MAX_BATCH);
    const base64List: string[] = [];
    for (const file of fileList) {
      try {
        const b64 = await readFileAsBase64(file);
        base64List.push(b64);
      } catch {
      }
    }
    e.target.value = "";

    if (base64List.length > 1 && onImagesSelected) {
      onImagesSelected(base64List);
    } else if (base64List.length === 1) {
      setRawImage(base64List[0]);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setShowCropDialog(true);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  }, []);

  const handleConfirmCrop = () => {
    if (!imgRef.current) return;

    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const croppedBase64 = getCroppedImageBase64(imgRef.current, completedCrop);
      if (croppedBase64) {
        onImageSelected(croppedBase64);
      }
    } else {
      onImageSelected(rawImage);
    }

    setShowCropDialog(false);
    setRawImage("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleUseOriginal = () => {
    onImageSelected(rawImage);
    setShowCropDialog(false);
    setRawImage("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleCancelCrop = () => {
    setShowCropDialog(false);
    setRawImage("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const progressPercent = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  return (
    <>
      <Button
        onClick={() => setShowMethodDialog(true)}
        disabled={isUploading}
        className="w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 text-primary rounded-2xl flex flex-col gap-2 relative overflow-hidden"
        variant="ghost"
        data-testid="button-upload-trigger"
      >
        {isUploading ? (
          <>
            {uploadProgress && (
              <div
                className="absolute bottom-0 left-0 h-1.5 bg-primary/40 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-bar"
              />
            )}
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium" data-testid="text-upload-progress">
              {uploadProgress
                ? `正在解析 ${uploadProgress.current} / ${uploadProgress.total}`
                : "AI 正在解析中..."}
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="w-8 h-8" />
            <span className="text-sm font-medium">上传题目图片</span>
            <span className="text-xs text-muted-foreground">
              拍照或从相册选择（支持多选）
            </span>
          </>
        )}
      </Button>

      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
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
              从相册选择（可多选）
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCropDialog} onOpenChange={(open) => { if (!open) handleCancelCrop(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] rounded-2xl p-3">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">
              预览和裁剪图片
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground text-center">
              拖拽选择要保留的区域，或直接使用原图
            </p>
            <div className="max-h-[50vh] overflow-auto rounded-lg bg-muted/30 flex items-center justify-center">
              {rawImage && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  <img
                    src={rawImage}
                    alt="待裁剪图片"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[48vh] object-contain"
                    data-testid="img-crop-preview"
                  />
                </ReactCrop>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleCancelCrop}
                data-testid="button-cancel-crop"
              >
                <X className="w-4 h-4" />
                取消
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleUseOriginal}
                data-testid="button-use-original"
              >
                <RotateCcw className="w-4 h-4" />
                使用原图
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleConfirmCrop}
                disabled={!completedCrop || completedCrop.width === 0}
                data-testid="button-confirm-crop"
              >
                <Check className="w-4 h-4" />
                确认裁剪
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryChange}
      />
    </>
  );
}
