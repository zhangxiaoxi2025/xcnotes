import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { chatService } from "@/lib/services";
import { chatWithQuestion, type ChatHistoryItem } from "@/lib/gemini";
import { type ChatMessage } from "@/lib/db";
import {
  Send,
  ImagePlus,
  X,
  Loader2,
  ChevronDown,
  Trash2,
  Bot,
  User,
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

interface ChatPanelProps {
  questionId: string;
  questionImageBase64: string;
  questionAnalysis: string;
  open: boolean;
  onClose: () => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export default function ChatPanel({
  questionId,
  questionImageBase64,
  questionAnalysis,
  open,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const buildIntroText = (): string => {
    let introText = "你好！我是你的 AI 学习助手。我已经阅读了这道题目的信息：\n\n";
    try {
      const parsed = JSON.parse(questionAnalysis);
      if (parsed.question_text) {
        introText += `📝 题目：${parsed.question_text}\n\n`;
      }
      if (parsed.knowledge_points?.length) {
        introText += `📚 知识点：${parsed.knowledge_points.join("、")}\n\n`;
      }
      if (parsed.humorous_explanation) {
        introText += `💡 解析摘要：${parsed.humorous_explanation}\n\n`;
      }
    } catch {}
    introText += "你可以：\n• 指出我的解析错误，我会重新分析\n• 上传教材截图让我参考\n• 针对某个知识点深入提问\n\n有什么问题尽管问我吧！";
    return introText;
  };

  useEffect(() => {
    if (!open) return;
    const loadMessages = async () => {
      const existing = await chatService.getByQuestion(questionId);
      if (existing.length === 0) {
        const introMsg = await chatService.saveMessage(questionId, "model", buildIntroText());
        setMessages([introMsg]);
      } else {
        setMessages(existing);
      }
    };
    loadMessages();
  }, [open, questionId]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await readFileAsBase64(file);
      setAttachedImage(b64);
    } catch {}
    e.target.value = "";
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !attachedImage) return;
    if (isSending) return;

    const userText = text || (attachedImage ? "（请看图片）" : "");
    const userImage = attachedImage || undefined;

    setInputText("");
    setAttachedImage("");
    setIsSending(true);

    try {
      const userMsg = await chatService.saveMessage(questionId, "user", userText, userImage);
      setMessages((prev) => [...prev, userMsg]);

      const allMessages = [...messages, userMsg];
      const history: ChatHistoryItem[] = allMessages.map((m) => ({
        role: m.role,
        text: m.text,
        imageBase64: m.role === "user" ? m.imageBase64 : undefined,
      }));

      const reply = await chatWithQuestion(history, questionImageBase64, questionAnalysis);
      const modelMsg = await chatService.saveMessage(questionId, "model", reply);
      setMessages((prev) => [...prev, modelMsg]);
    } catch {
      try {
        const errorMsg = await chatService.saveMessage(
          questionId,
          "model",
          "抱歉，回复失败了，请稍后重试。"
        );
        setMessages((prev) => [...prev, errorMsg]);
      } catch {}
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    await chatService.clearByQuestion(questionId);
    const introMsg = await chatService.saveMessage(questionId, "model", buildIntroText());
    setMessages([introMsg]);
    setShowClearDialog(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" data-testid="chat-panel">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">AI 讨论</h2>
          <span className="text-xs text-muted-foreground">
            ({messages.length} 条消息)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowClearDialog(true)}
              data-testid="button-clear-chat"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-chat"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-3 flex-shrink-0">
        <img
          src={questionImageBase64}
          alt="原题图片"
          className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
          data-testid="img-question-context"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">当前题目</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {(() => {
              try {
                return JSON.parse(questionAnalysis)?.question_text?.slice(0, 50) || "题目图片已加载";
              } catch {
                return "题目图片已加载";
              }
            })()}
          </p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        data-testid="chat-messages"
      >
        {messages.length === 0 && !isSending && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Bot className="w-12 h-12 text-primary/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              AI 讨论助手
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[280px]">
              你可以纠正AI的解析错误、上传教材截图让AI分析、或询问相关知识点
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["正确答案应该是...", "教材上是这样说的", "最新指南有什么变化？"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setInputText(hint)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted/50 transition-colors touch-manipulation"
                  data-testid={`hint-${hint}`}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            data-testid={`chat-msg-${msg.id}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md"
                  : "bg-muted text-foreground rounded-tl-md"
              }`}
            >
              {msg.imageBase64 && (
                <img
                  src={msg.imageBase64}
                  alt="附图"
                  className="max-w-full max-h-40 rounded-lg mb-2 object-contain"
                  data-testid={`chat-img-${msg.id}`}
                />
              )}
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2 flex-row" data-testid="chat-loading">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">正在思考...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-background flex-shrink-0 px-3 py-2 pb-4">
        {attachedImage && (
          <div className="relative inline-block mb-2">
            <img
              src={attachedImage}
              alt="附件预览"
              className="h-16 rounded-lg object-cover border border-border"
              data-testid="img-attachment-preview"
            />
            <button
              type="button"
              onClick={() => setAttachedImage("")}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center touch-manipulation"
              data-testid="button-remove-attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            data-testid="button-attach-image"
          >
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          </Button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all max-h-[120px]"
            disabled={isSending}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            className="flex-shrink-0 h-9 w-9 rounded-xl"
            onClick={handleSend}
            disabled={isSending || (!inputText.trim() && !attachedImage)}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAttachImage}
      />

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>清空聊天记录</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清空与这道题的所有聊天记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearChat}
              className="bg-destructive text-destructive-foreground"
            >
              清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
