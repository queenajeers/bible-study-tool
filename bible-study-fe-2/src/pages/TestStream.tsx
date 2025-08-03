import { useState } from "react";
import { createParser, type EventSourceMessage } from "eventsource-parser";

type WeatherData = {
  location: string;
  temperature: number;
  conditions: string;
};

type StreamEvent =
  | {
      type: "field_update";
      field: "location" | "temperature" | "conditions";
      value: string | number;
      char?: string;
      all_fields: Partial<WeatherData>;
    }
  | {
      type: "complete";
      data: WeatherData;
    }
  | {
      type: "comment";
      message: string;
    };

function TestStream() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialData, setPartialData] = useState<Partial<WeatherData>>({});
  const [streamingField, setStreamingField] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>("");

  const fetchStream = async () => {
    setWeatherData(null);
    setPartialData({});
    setStreamingField(null);
    setProcessingMessage("");
    setLoading(true);
    setIsStreaming(false);

    const response = await fetch("http://localhost:8000/stream-weather");

    if (!response.body) {
      console.error("No response body.");
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const parser = createParser({
      onEvent(event: EventSourceMessage) {
        console.log("Raw event:", event);
        if (event.data === "[DONE]") {
          setLoading(false);
          setIsStreaming(false);
          setStreamingField(null);
          return;
        }

        try {
          const parsed: StreamEvent = JSON.parse(event.data);
          console.log("Parsed chunk:", parsed);

          if (parsed.type === "comment") {
            setProcessingMessage(parsed.message);
          } else if (parsed.type === "field_update") {
            setIsStreaming(true);
            setStreamingField(parsed.field);
            setPartialData(parsed.all_fields);
          } else if (parsed.type === "complete") {
            setWeatherData(parsed.data);
            setPartialData(parsed.data);
            setIsStreaming(false);
            setStreamingField(null);
            setLoading(false);
            setProcessingMessage("");
          }
        } catch (error) {
          console.warn("Invalid JSON chunk:", event.data, error);
        }
      },
    });

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        parser.feed(decoded);
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingField(null);
    }
  };

  const getFieldStatus = (field: keyof WeatherData) => {
    if (weatherData && weatherData[field] !== undefined) return "complete";
    if (partialData[field] !== undefined) return "streaming";
    return "waiting";
  };

  const getFieldValue = (field: keyof WeatherData) => {
    if (weatherData && weatherData[field] !== undefined) {
      return field === "temperature"
        ? `${weatherData[field]}°C`
        : weatherData[field];
    }
    if (partialData[field] !== undefined) {
      return field === "temperature"
        ? `${partialData[field]}°C`
        : partialData[field];
    }
    return "Loading...";
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🌦️ Weather Stream</h1>

      <button onClick={fetchStream} disabled={loading || isStreaming}>
        {loading
          ? "Loading..."
          : isStreaming
          ? "Streaming..."
          : "Stream Weather"}
      </button>

      {/* Processing message */}
      {processingMessage && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "4px",
            fontSize: "0.9rem",
            color: "#1976d2",
          }}
        >
          🔄 {processingMessage}
        </div>
      )}

      {/* Progressive Weather Data Display */}
      <div style={{ marginTop: "2rem", fontSize: "1.2rem" }}>
        <div
          style={{
            lineHeight: "2.5",
            backgroundColor: isStreaming
              ? "#fff3cd"
              : weatherData
              ? "#e8f5e8"
              : "#f8f9fa",
            padding: "2rem",
            borderRadius: "12px",
            border: `3px solid ${
              isStreaming ? "#ffc107" : weatherData ? "#4caf50" : "#dee2e6"
            }`,
            transition: "all 0.3s ease",
            boxShadow: isStreaming
              ? "0 4px 12px rgba(255, 193, 7, 0.3)"
              : weatherData
              ? "0 4px 12px rgba(76, 175, 80, 0.3)"
              : "none",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
            {isStreaming
              ? "🔄 Building Weather Data..."
              : weatherData
              ? "✅ Complete Weather Data:"
              : "⏳ Waiting for data..."}
          </h3>

          {/* Location Field */}
          <div
            style={{
              opacity: getFieldStatus("location") === "waiting" ? 0.4 : 1,
              marginBottom: "1rem",
              transition: "opacity 0.3s ease",
            }}
          >
            <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
              📍
            </span>
            <strong>Location:</strong>
            <span
              style={{
                marginLeft: "0.5rem",
                fontFamily:
                  getFieldStatus("location") === "streaming"
                    ? "monospace"
                    : "inherit",
                backgroundColor:
                  getFieldStatus("location") === "streaming"
                    ? "#fffbf0"
                    : "transparent",
                padding:
                  getFieldStatus("location") === "streaming" ? "2px 4px" : "0",
                borderRadius: "3px",
              }}
            >
              {getFieldValue("location")}
            </span>
            {streamingField === "location" && (
              <span
                style={{
                  animation: "blink 1s infinite",
                  marginLeft: "2px",
                  fontSize: "1.2em",
                  color: "#ffc107",
                }}
              >
                |
              </span>
            )}
            {getFieldStatus("location") === "complete" && (
              <span style={{ marginLeft: "0.5rem", color: "#4caf50" }}>✓</span>
            )}
          </div>

          {/* Temperature Field */}
          <div
            style={{
              opacity: getFieldStatus("temperature") === "waiting" ? 0.4 : 1,
              marginBottom: "1rem",
              transition: "opacity 0.3s ease",
            }}
          >
            <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
              🌡️
            </span>
            <strong>Temperature:</strong>
            <span
              style={{
                marginLeft: "0.5rem",
                fontFamily:
                  getFieldStatus("temperature") === "streaming"
                    ? "monospace"
                    : "inherit",
                backgroundColor:
                  getFieldStatus("temperature") === "streaming"
                    ? "#fffbf0"
                    : "transparent",
                padding:
                  getFieldStatus("temperature") === "streaming"
                    ? "2px 4px"
                    : "0",
                borderRadius: "3px",
              }}
            >
              {getFieldValue("temperature")}
            </span>
            {streamingField === "temperature" && (
              <span
                style={{
                  animation: "blink 1s infinite",
                  marginLeft: "2px",
                  fontSize: "1.2em",
                  color: "#ffc107",
                }}
              >
                |
              </span>
            )}
            {getFieldStatus("temperature") === "complete" && (
              <span style={{ marginLeft: "0.5rem", color: "#4caf50" }}>✓</span>
            )}
          </div>

          {/* Conditions Field */}
          <div
            style={{
              opacity: getFieldStatus("conditions") === "waiting" ? 0.4 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
              ☁️
            </span>
            <strong>Conditions:</strong>
            <div
              style={{
                marginTop: "0.5rem",
                marginLeft: "2.5rem",
                fontFamily:
                  getFieldStatus("conditions") === "streaming"
                    ? "monospace"
                    : "inherit",
                backgroundColor:
                  getFieldStatus("conditions") === "streaming"
                    ? "#fffbf0"
                    : "transparent",
                padding:
                  getFieldStatus("conditions") === "streaming"
                    ? "8px 12px"
                    : "0",
                borderRadius: "6px",
                lineHeight: "1.6",
                fontStyle:
                  getFieldStatus("conditions") !== "waiting"
                    ? "italic"
                    : "normal",
              }}
            >
              {getFieldValue("conditions")}
              {streamingField === "conditions" && (
                <span
                  style={{
                    animation: "blink 1s infinite",
                    marginLeft: "2px",
                    fontSize: "1.2em",
                    color: "#ffc107",
                  }}
                >
                  |
                </span>
              )}
            </div>
            {getFieldStatus("conditions") === "complete" && (
              <span style={{ marginLeft: "0.5rem", color: "#4caf50" }}>✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Status message */}
      {!weatherData && !isStreaming && !loading && (
        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            color: "#666",
            fontSize: "1.1rem",
          }}
        >
          Click "Stream Weather" to see each field appear and build in
          real-time! 🚀
        </div>
      )}

      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

export default TestStream;
