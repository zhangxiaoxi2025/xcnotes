import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-sm w-full border-card-border">
        <h1 className="text-6xl font-bold text-muted-foreground/30 mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-4">页面未找到</p>
        <Link href="/">
          <Button data-testid="button-go-home">
            <Home className="w-4 h-4 mr-1.5" />
            返回首页
          </Button>
        </Link>
      </Card>
    </div>
  );
}
