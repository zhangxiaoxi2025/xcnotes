import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import ReactECharts from "echarts-for-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { questionService } from "@/lib/services";
import { generateKnowledgeSummary } from "@/lib/gemini";
import { type AnalysisJson } from "@/lib/db";
import { ArrowLeft, Download, Loader2, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeGraphPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [graphData, setGraphData] = useState<{
    nodes: { name: string; category: number }[];
    links: { source: string; target: string }[];
    categories: { name: string }[];
    summary: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(search);
      const ids = params.get("ids")?.split(",").filter(Boolean) || [];
      if (ids.length === 0) {
        navigate("/");
        return;
      }

      const knowledgePoints: string[] = [];
      for (const id of ids) {
        const q = await questionService.getById(id);
        if (q) {
          try {
            const analysis: AnalysisJson = JSON.parse(q.analysisJson);
            knowledgePoints.push(...(analysis.knowledge_points || []));
          } catch {}
        }
      }

      const uniquePoints = [...new Set(knowledgePoints)];
      if (uniquePoints.length === 0) {
        toast({
          title: "没有找到知识点",
          description: "所选题目中没有可用的知识点数据",
          variant: "destructive",
        });
        navigate("/directories");
        return;
      }

      try {
        const data = await generateKnowledgeSummary(uniquePoints);
        setGraphData(data);
      } catch (e: any) {
        toast({
          title: "生成失败",
          description: e.message || "知识图谱生成失败",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  const getChartOption = () => {
    if (!graphData) return {};

    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
    ];

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "node") {
            return `<strong>${params.data.name}</strong><br/>类别: ${graphData.categories[params.data.category]?.name || "未分类"}`;
          }
          return `${params.data.source} → ${params.data.target}`;
        },
      },
      legend: {
        data: graphData.categories.map((c) => c.name),
        orient: "horizontal",
        bottom: 0,
        textStyle: {
          fontSize: 11,
          color: "#888",
        },
      },
      animationDuration: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          type: "graph",
          layout: "force",
          data: graphData.nodes.map((node, i) => ({
            ...node,
            symbolSize: 35 + Math.random() * 20,
            itemStyle: {
              color: colors[node.category % colors.length],
            },
            label: {
              show: true,
              fontSize: 10,
              formatter: (p: any) =>
                p.name.length > 6 ? p.name.slice(0, 6) + "..." : p.name,
            },
          })),
          links: graphData.links.map((link) => ({
            ...link,
            lineStyle: {
              color: "#ccc",
              width: 1.5,
              curveness: 0.2,
            },
          })),
          categories: graphData.categories.map((c, i) => ({
            ...c,
            itemStyle: { color: colors[i % colors.length] },
          })),
          roam: true,
          force: {
            repulsion: 200,
            edgeLength: [80, 160],
            gravity: 0.1,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 3,
            },
          },
        },
      ],
    };
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `知识图谱_${new Date().toLocaleDateString("zh-CN")}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "导出成功", description: "图片已保存到本地" });
    } catch (e: any) {
      toast({
        title: "导出失败",
        description: "请重试",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-4 h-14">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/directories")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">知识图谱</h1>
          </div>
          {graphData && (
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              data-testid="button-export"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              保存到本地
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <Card className="p-12 text-center border-card-border">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              AI 正在分析知识点关联...
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              请稍候，这可能需要几秒钟
            </p>
          </Card>
        ) : graphData ? (
          <div ref={exportRef} className="space-y-4">
            <Card className="border-card-border overflow-hidden">
              <div className="p-3 border-b border-border flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">知识点关联图</h3>
              </div>
              <div className="p-2">
                <ReactECharts
                  option={getChartOption()}
                  style={{ height: 360, width: "100%" }}
                  opts={{ renderer: "canvas" }}
                  data-testid="chart-knowledge-graph"
                />
              </div>
            </Card>

            <Card className="p-4 border-card-border">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                学习总结与建议
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground" data-testid="text-summary">
                {graphData.summary}
              </p>
            </Card>

            <Card className="p-4 border-card-border">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-chart-2 rounded-full" />
                涉及知识点
              </h3>
              <div className="flex flex-wrap gap-2">
                {graphData.nodes.map((node, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground"
                    data-testid={`tag-knowledge-${i}`}
                  >
                    {node.name}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center border-card-border">
            <Network className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">知识图谱生成失败</p>
            <p className="text-xs text-muted-foreground/70 mt-1">请返回重试</p>
          </Card>
        )}
      </div>
    </div>
  );
}
