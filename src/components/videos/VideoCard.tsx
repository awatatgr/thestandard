import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VIDEO_CATEGORIES, getPrimaryThumbnail, type Video } from "@/data/videos";
import { Video as VideoIcon, Play, Calendar, Layers } from "lucide-react";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const categoryInfo = VIDEO_CATEGORIES[video.category];
  const thumbnailUrl = getPrimaryThumbnail(video);

  return (
    <Card className="overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors" onClick={onClick}>
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <VideoIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-12 w-12 text-white" />
        </div>
        {video.durationSeconds && video.durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium tabular-nums">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>
        )}
        {video.angles.length > 1 && (
          <div className="absolute top-2 right-2">
            <span className="bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {video.angles.length}
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium truncate">{video.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          {categoryInfo && (
            <Badge className={categoryInfo.color} variant="secondary">
              {categoryInfo.label}
            </Badge>
          )}
          {video.chapter && (
            <span className="text-muted-foreground">{video.chapter}</span>
          )}
        </div>
        {video.recordedAt && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {video.recordedAt}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
