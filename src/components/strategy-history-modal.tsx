"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "markdown-to-jsx";
import dayjs from "dayjs";

interface CaseStrategy {
  id: string;
  version: number;
  title: string;
  content: string;
  summary?: string | null;
  aiModel: string;
  generationReason?: string | null;
  createdAt: string;
  generatedBy?: string | null;
  strategy_metadata?: {
    contentType?: string;
    [key: string]: unknown;
  } | null;
}

interface StrategyHistoryModalProps {
  strategies: CaseStrategy[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategyHistoryModal({
  strategies,
  open,
  onOpenChange,
}: StrategyHistoryModalProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set()
  );

  const toggleExpanded = (strategyId: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId);
      } else {
        newSet.add(strategyId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Strategy Version History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {strategies.map((strategy, index) => {
              const isExpanded = expandedVersions.has(strategy.id);
              const isLatest = index === 0;

              return (
                <div
                  key={strategy.id}
                  className={`border rounded-lg p-4 ${
                    isLatest ? "border-blue-300 bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{strategy.title}</h4>
                        <Badge variant={isLatest ? "default" : "outline"}>
                          v{strategy.version}
                        </Badge>
                        {isLatest && (
                          <Badge variant="default" className="bg-blue-600">
                            Latest
                          </Badge>
                        )}
                      </div>
                      {strategy.summary && (
                        <p className="text-sm text-muted-foreground">
                          {strategy.summary}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => toggleExpanded(strategy.id)}
                      size="sm"
                      variant="ghost"
                      className="ml-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm prose prose-sm max-w-none markdown-body">
                        {strategy.strategy_metadata?.contentType === "html" ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: strategy.content,
                            }}
                          />
                        ) : (
                          <Markdown>{strategy.content}</Markdown>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {strategy.generationReason && (
                      <span className="text-blue-700 italic">
                        {strategy.generationReason}
                      </span>
                    )}
                    <span>
                      Generated: {dayjs(strategy.createdAt).format("MM/DD/YYYY")}
                      {strategy.generatedBy && ` by ${strategy.generatedBy}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
