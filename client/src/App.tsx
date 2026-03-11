import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import DirectoriesPage from "@/pages/DirectoriesPage";
import DirectoryDetailPage from "@/pages/DirectoryDetailPage";
import QuestionDetailPage from "@/pages/QuestionDetailPage";
import KnowledgeGraphPage from "@/pages/KnowledgeGraphPage";
import ReviewPage from "@/pages/ReviewPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/directories" component={DirectoriesPage} />
      <Route path="/directory/:id" component={DirectoryDetailPage} />
      <Route path="/question/:id" component={QuestionDetailPage} />
      <Route path="/knowledge-graph" component={KnowledgeGraphPage} />
      <Route path="/review" component={ReviewPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <div className="max-w-lg mx-auto min-h-screen relative">
            <Router />
            <BottomNav />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
