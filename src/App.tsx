import { Navigate, Route, Routes } from "react-router-dom";
import { IdlePage } from "./games/idle/IdlePage";
import { WordlePage } from "./games/wordle/WordlePage";
import { HubPage } from "./pages/HubPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />
      <Route path="/wordle" element={<WordlePage />} />
      <Route path="/idle" element={<IdlePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
