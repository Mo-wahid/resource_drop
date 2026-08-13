"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addRequestComment } from "@/app/(protected)/admin/requests/actions";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RequestComments({ 
  requestId, 
  comments,
  currentUserId
}: { 
  requestId: string;
  comments: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsPending(true);
    const result = await addRequestComment(requestId, message);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setMessage("");
      router.refresh();
    }
    
    setIsPending(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageSquare className="size-4" />
          Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length > 0 ? (
          <div className="space-y-4">
          {comments.map((comment) => {
            const isMe = comment.authorId === currentUserId;
            return (
              <div 
                key={comment.id} 
                className={`flex flex-col gap-1 max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-medium">{isMe ? "You" : comment.author.username}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                </div>
                <div className={`text-sm px-4 py-2.5 rounded-2xl ${
                  isMe 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}>
                  {comment.message}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
          No comments yet. Start the discussion below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-2">
        <Input
          placeholder="Add a comment..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !message.trim()}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
