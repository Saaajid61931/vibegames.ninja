CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

CREATE INDEX "Comment_gameId_createdAt_idx" ON "Comment"("gameId", "createdAt");

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

CREATE INDEX "Report_reporterId_gameId_reason_status_idx" ON "Report"("reporterId", "gameId", "reason", "status");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
