import * as fs from "fs";
import * as path from "path";

export interface QuestResult {
  questId: string;
  title: string;
  status: "COMPLETED" | "FAILED";
  concern: boolean;
  comment: string | null;
  durationMs: number;
}

export interface UATReport {
  meta: {
    projectId: string;
    userId: string;
    startedAt: string;
    endedAt: string;
    durationSeconds: number;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    concernCount: number;
    passRate: number;
  };
  quests: QuestResult[];
  generatedAt: string;
}

export class UATReporter {
  private quests: QuestResult[] = [];
  private startTime = Date.now();

  constructor(
    private config: { projectId: string; userId: string },
  ) {}

  pass(
    id: string,
    title: string,
    durationMs: number,
    options?: { concern?: boolean; comment?: string },
  ) {
    this.quests.push({
      questId: id,
      title,
      status: "COMPLETED",
      concern: options?.concern ?? false,
      comment: options?.comment ?? null,
      durationMs,
    });
  }

  fail(id: string, title: string, durationMs: number, comment?: string) {
    this.quests.push({
      questId: id,
      title,
      status: "FAILED",
      concern: false,
      comment: comment ?? null,
      durationMs,
    });
  }

  generate(): UATReport {
    const endTime = Date.now();
    const passed = this.quests.filter((q) => q.status === "COMPLETED").length;
    const failed = this.quests.filter((q) => q.status === "FAILED").length;
    const total = this.quests.length;

    return {
      meta: {
        projectId: this.config.projectId,
        userId: this.config.userId,
        startedAt: new Date(this.startTime).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        durationSeconds: Math.round((endTime - this.startTime) / 1000),
      },
      summary: {
        total,
        passed,
        failed,
        concernCount: this.quests.filter((q) => q.concern).length,
        passRate: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
      },
      quests: this.quests,
      generatedAt: new Date().toISOString(),
    };
  }

  save(filename: string) {
    const report = this.generate();
    const dir = path.resolve(process.cwd(), "uat-reports");
    fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`UAT report saved: ${filepath}`);
    return report;
  }
}
