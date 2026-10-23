import { Route, Routes } from "react-router-dom";
import { Desktop } from "./desktop/components/Desktop";

export function App() {
  return (
    <Routes>
      {/* Satu rute: desktop menangani deep link /wordle dan /idle sebagai jendela. */}
      <Route path="*" element={<Desktop />} />
    </Routes>
  );
}
