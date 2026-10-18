package com.sabycut.core.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabycut.core.dto.AutoCutDtos.ProgressUpdate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class AutoCutWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private final Map<String, Set<WebSocketSession>> jobSubscriptions = new ConcurrentHashMap<>();

    public AutoCutWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        jobSubscriptions.values().forEach(set -> set.remove(session));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<?, ?> json = objectMapper.readValue(message.getPayload(), Map.class);
            String action = (String) json.get("action");
            String jobId = (String) json.get("jobId");

            if ("subscribe".equalsIgnoreCase(action) && jobId != null) {
                jobSubscriptions.computeIfAbsent(jobId, k -> new CopyOnWriteArraySet<>()).add(session);
                session.sendMessage(new TextMessage("{\"status\":\"subscribed\",\"jobId\":\"" + jobId + "\"}"));
            }
        } catch (Exception ignored) {
        }
    }

    public void sendProgress(ProgressUpdate update) {
        try {
            String json = objectMapper.writeValueAsString(update);
            TextMessage message = new TextMessage(json);

            // Send to job subscribers if any
            Set<WebSocketSession> subscribers = jobSubscriptions.get(update.jobId());
            if (subscribers != null && !subscribers.isEmpty()) {
                for (WebSocketSession session : subscribers) {
                    if (session.isOpen()) {
                        session.sendMessage(message);
                    }
                }
            } else {
                // Otherwise broadcast to all active sessions
                for (WebSocketSession session : sessions) {
                    if (session.isOpen()) {
                        session.sendMessage(message);
                    }
                }
            }
        } catch (IOException ignored) {
        }
    }
}
