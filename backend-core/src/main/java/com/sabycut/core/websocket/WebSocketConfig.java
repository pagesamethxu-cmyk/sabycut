package com.sabycut.core.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AutoCutWebSocketHandler autoCutWebSocketHandler;

    public WebSocketConfig(AutoCutWebSocketHandler autoCutWebSocketHandler) {
        this.autoCutWebSocketHandler = autoCutWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(autoCutWebSocketHandler, "/ws/autocut")
                .setAllowedOriginPatterns("*");
    }
}
